import { NextResponse } from "next/server";

/*
 * Adzuna API — Alternances Tech & Marketing à Paris
 * Free tier · https://developer.adzuna.com/docs/search
 */
const APP_ID = process.env.ADZUNA_APP_ID ?? "";
const APP_KEY = process.env.ADZUNA_APP_KEY ?? "";

// Queries calées sur les programmes PST&B (Bachelor + Mastère, filière Tech & filière Business/Marketing)
// https://pstb.fr — Tech : Dev Web/Mobile, Data/IA, Cyber, Cloud · Business : Marketing Digital, Growth, Business Dev, Communication
const SEARCHES = [
  // ── Tech & Dev ──
  { query: "alternance développeur web", category: "it-jobs", count: 20, tag: "tech" },
  { query: "alternance fullstack", category: "it-jobs", count: 15, tag: "tech" },
  { query: "alternance data analyst", category: "it-jobs", count: 15, tag: "tech" },
  { query: "alternance data engineer", category: "it-jobs", count: 10, tag: "tech" },
  { query: "alternance intelligence artificielle", category: "it-jobs", count: 12, tag: "tech" },
  { query: "alternance cybersécurité", category: "it-jobs", count: 12, tag: "tech" },
  { query: "alternance devops cloud", category: "it-jobs", count: 10, tag: "tech" },
  { query: "alternance product manager", category: "it-jobs", count: 10, tag: "tech" },
  // ── Marketing & Business ──
  { query: "alternance marketing digital", count: 20, tag: "marketing" },
  { query: "alternance growth marketing", count: 12, tag: "marketing" },
  { query: "alternance social media", count: 12, tag: "marketing" },
  { query: "alternance communication digitale", count: 15, tag: "marketing" },
  { query: "alternance business developer", count: 15, tag: "marketing" },
  { query: "alternance chef de projet digital", count: 12, tag: "marketing" },
  { query: "alternance e-commerce", count: 10, tag: "marketing" },
  { query: "alternance content manager", count: 10, tag: "marketing" },
];

// Mots clés d'exclusion (écoles & organismes de formation = bruit)
const SCHOOL_BLOCKLIST = [
  "iscod", "alegria", "openclassrooms", "my digital school", "epitech", "aurlom",
  "dsti", "school", "école", "ecole", "campus", "formation", "ifocop", "studi",
];

// ── Cache cumulatif ──────────────────────────────────────────────────
// Stratégie : on accumule les offres au fil des fetchs Adzuna. Chaque
// nouveau refresh fusionne les nouvelles offres avec les anciennes
// (dédupe par titre+entreprise) → la liste ne fait que grossir, jamais
// rétrécir, jusqu'à un plafond de sécurité.
// Throttle : pour ne pas marteler Adzuna, on refetch au plus toutes les
// 10 min (sauf ?refresh=1). Entre 2 refetches, on resert le cumulatif.
let cumulativeOffers = [];
let lastFetch = 0;
const REFRESH_THROTTLE_MS = 10 * 60 * 1000;
const FETCH_TIMEOUT_MS = 8000;
const MAX_OFFERS = 1000;

export async function GET(req) {
  if (!APP_ID || !APP_KEY) {
    return NextResponse.json({
      error: "Set ADZUNA_APP_ID and ADZUNA_APP_KEY in .env.local",
      offers: [],
    });
  }

  const { searchParams } = new URL(req.url);
  const customQuery = searchParams.get("q");
  const customLocation = searchParams.get("where") ?? "Paris";
  const count = Number(searchParams.get("count") ?? "6");
  const force = searchParams.get("refresh") === "1";

  // Query custom = direct, pas de cache (rare, à la demande)
  if (customQuery) {
    try {
      const offers = await fetchOffers(customQuery, customLocation, count);
      return NextResponse.json({ offers, total: offers.length });
    } catch (e) {
      return NextResponse.json({ error: e.message, offers: [] });
    }
  }

  const isCold = cumulativeOffers.length === 0;
  const isStale = Date.now() - lastFetch > REFRESH_THROTTLE_MS;
  const shouldFetch = force || isCold || isStale;

  if (shouldFetch) {
    try {
      const results = await Promise.all(
        SEARCHES.map((s) =>
          fetchOffers(s.query, "Paris", s.count ?? 2, s.category, s.tag)
        )
      );
      const fresh = results
        .flat()
        .filter((o) => {
          const c = (o.company || "").toLowerCase();
          const t = (o.title || "").toLowerCase();
          if (SCHOOL_BLOCKLIST.some((k) => c.includes(k))) return false;
          if (t.includes("formation") || t.includes("école") || t.includes("ecole")) return false;
          return true;
        });

      // ── Merge cumulatif ──
      // On parcourt fresh d'abord (priorité aux nouvelles infos comme la
      // date ou le salaire qui peuvent avoir été mises à jour), puis le
      // cumulatif. La déduplication par (titre+entreprise) garantit qu'on
      // ne double pas une offre déjà connue.
      const seen = new Set();
      const merged = [];
      for (const offer of [...fresh, ...cumulativeOffers]) {
        const key = `${(offer.title || "").toLowerCase().slice(0, 60)}|${(offer.company || "").toLowerCase()}`;
        if (seen.has(key)) continue;
        seen.add(key);
        merged.push(offer);
      }

      // Tri stable : date desc + titre alphabétique en tiebreaker
      merged.sort((a, b) => {
        const dt = parseFrDate(b.postedAt) - parseFrDate(a.postedAt);
        if (dt !== 0) return dt;
        return (a.title || "").localeCompare(b.title || "");
      });

      // On garde le cumulatif uniquement si fresh a renvoyé qqch
      // (sinon on évite d'écraser un bon cache à cause d'un Adzuna down)
      if (fresh.length > 0 || isCold) {
        cumulativeOffers = merged.slice(0, MAX_OFFERS);
        lastFetch = Date.now();
      }
    } catch (e) {
      console.error("[Jobs API]", e.message);
      // Fail soft : on garde le cumulatif existant et on continue
    }
  }

  return NextResponse.json({
    offers: cumulativeOffers,
    total: cumulativeOffers.length,
    cached: !shouldFetch,
    refreshed: shouldFetch,
    ageSeconds: lastFetch ? Math.round((Date.now() - lastFetch) / 1000) : null,
  });
}

async function fetchOffers(query, location, count, category, tag) {
  const url = new URL("https://api.adzuna.com/v1/api/jobs/fr/search/1");
  url.searchParams.set("app_id", APP_ID);
  url.searchParams.set("app_key", APP_KEY);
  url.searchParams.set("results_per_page", String(count));
  url.searchParams.set("what", query);
  url.searchParams.set("where", location);
  url.searchParams.set("sort_by", "date");
  if (category) url.searchParams.set("category", category);

  // 1 retry avec timeout — évite qu'une query lente fasse perdre toutes ses offres
  const data = await fetchWithRetry(url.toString(), query);
  if (!data) return [];
  return (data.results ?? []).map((job) => {
    const title = cleanTitle(job.title ?? "");
    const description = cleanHtml(job.description ?? "");
    return {
      title,
      company: job.company?.display_name ?? "Entreprise",
      location: shortenLocation(job.location?.display_name ?? location),
      contract: "Alternance",
      description: description.slice(0, 150),
      url: shortenUrl(job.redirect_url ?? ""),
      salary: job.salary_min ? `${Math.round(job.salary_min)}€/an` : "",
      postedAt: job.created ? new Date(job.created).toLocaleDateString("fr-FR") : "",
      // Le `tag` de la query est prioritaire (intent connu) ; sinon fallback sur catégorie Adzuna + heuristique
      category: tag ?? detectCategory(category, title, description),
      level: detectLevel(title, description),
    };
  });
}

async function fetchWithRetry(urlString, label) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(urlString, {
        signal: ctrl.signal,
        next: { revalidate: 21600 }, // 6h — Next dedup côté plateforme
      });
      clearTimeout(timer);
      if (!res.ok) {
        if (attempt === 1) console.warn(`[Adzuna] ${res.status} for "${label}"`);
        continue;
      }
      return await res.json();
    } catch (e) {
      clearTimeout(timer);
      if (attempt === 1) console.warn(`[Adzuna] échec "${label}": ${e.message}`);
    }
  }
  return null;
}

function detectCategory(adzunaCat, title, description) {
  if (adzunaCat === "it-jobs") return "tech";
  const text = (title + " " + description).toLowerCase();
  const techKeys = ["développeur", "developer", "fullstack", "front-end", "back-end", "data", "devops", "cloud", "cyber", "ia ", "intelligence artificielle", "machine learning", "product manager"];
  if (techKeys.some((k) => text.includes(k))) return "tech";
  return "marketing";
}

function parseFrDate(s) {
  if (!s) return 0;
  const [d, m, y] = s.split("/");
  return new Date(`${y}-${m}-${d}`).getTime() || 0;
}

function detectLevel(title, description) {
  const text = (title + " " + description).toLowerCase();
  if (
    text.includes("mastère") || text.includes("master ") || text.includes("masters") ||
    text.includes("bac+5") || text.includes("bac +5") || text.includes("mba") ||
    text.includes("bac5") || text.includes("grade master")
  ) return "mastere";
  if (
    text.includes("bachelor") || text.includes("bac+3") || text.includes("bac +3") ||
    text.includes("bac3") || text.includes("licence ") || text.includes("licence pro")
  ) return "bachelor";
  if (
    text.includes("bts") || text.includes("bac+2") || text.includes("bac +2") ||
    text.includes("bac2") || text.includes(" dut ") || text.includes(" but ")
  ) return "bts";
  return null;
}

function cleanTitle(t) {
  return t.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function cleanHtml(s) {
  return s.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function shortenUrl(rawUrl) {
  if (!rawUrl) return "";
  try {
    const u = new URL(rawUrl);
    // Strip all tracking params — keep only the path
    u.search = "";
    return u.toString();
  } catch {
    return rawUrl;
  }
}

function shortenLocation(loc) {
  if (!loc) return "Paris";
  return loc.replace(/, Ile-de-France$/, "").replace(/, France$/, "").trim();
}
