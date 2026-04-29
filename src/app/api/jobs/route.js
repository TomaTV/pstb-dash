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

// ── Cache mémoire stable ─────────────────────────────────────────────
// Persiste sur l'instance serverless (chaud) → tous les refreshes d'un
// même utilisateur pendant 6h tombent sur la MÊME réponse. Sur Vercel,
// chaque instance a son cache propre, mais le cache fetch() d'Adzuna
// (revalidate: 21600) garantit la cohérence inter-instances.
let cachedResponse = null; // { offers, total, fetchedAt }
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 8000;

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

  // Hit du cache si réponse fraîche et pas de query custom (les query custom
  // restent toujours en direct car peu fréquentes).
  if (!customQuery && !force && cachedResponse && Date.now() - cachedResponse.fetchedAt < CACHE_TTL_MS) {
    return NextResponse.json({
      ...cachedResponse,
      cached: true,
      ageSeconds: Math.round((Date.now() - cachedResponse.fetchedAt) / 1000),
    });
  }

  try {
    let allOffers = [];

    if (customQuery) {
      const offers = await fetchOffers(customQuery, customLocation, count);
      allOffers = offers;
    } else {
      // Parallèle plutôt que séquentiel : Adzuna gère, et c'est ~10x plus rapide.
      // Chaque query peut échouer indépendamment sans casser le reste.
      const results = await Promise.all(
        SEARCHES.map((s) =>
          fetchOffers(s.query, "Paris", s.count ?? 2, s.category, s.tag)
        )
      );
      allOffers = results.flat();
    }

    // Filtrage écoles/formations côté serveur (avant déduplication)
    allOffers = allOffers.filter((o) => {
      const c = (o.company || "").toLowerCase();
      const t = (o.title || "").toLowerCase();
      if (SCHOOL_BLOCKLIST.some((k) => c.includes(k))) return false;
      if (t.includes("formation") || t.includes("école") || t.includes("ecole")) return false;
      return true;
    });

    // Déduplication par (titre + entreprise) plutôt que titre seul
    const seen = new Set();
    const unique = allOffers.filter((o) => {
      const key = `${o.title.toLowerCase().slice(0, 60)}|${(o.company || "").toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Tri stable : date desc puis titre alphabétique (évite que l'ordre change
    // entre deux fetches quand plusieurs offres ont la même date).
    unique.sort((a, b) => {
      const dt = parseFrDate(b.postedAt) - parseFrDate(a.postedAt);
      if (dt !== 0) return dt;
      return a.title.localeCompare(b.title);
    });

    // Sauvegarde dans le cache uniquement si on a une réponse exploitable.
    // Si on a moins d'offres qu'avant, on garde l'ancien cache (anti-flicker
    // quand une query Adzuna est down).
    if (!customQuery && unique.length > 0) {
      const previousCount = cachedResponse?.offers.length ?? 0;
      if (unique.length >= previousCount * 0.5) {
        cachedResponse = { offers: unique, total: unique.length, fetchedAt: Date.now() };
      } else {
        console.warn(`[Jobs API] Réponse partielle (${unique.length} vs ${previousCount} en cache), on garde l'ancien.`);
        return NextResponse.json({ ...cachedResponse, cached: true, partial: true });
      }
    }

    return NextResponse.json({ offers: unique, total: unique.length, cached: false });
  } catch (e) {
    console.error("[Jobs API]", e.message);
    // Fallback : si on a un cache, on le sert plutôt qu'une erreur
    if (cachedResponse) {
      return NextResponse.json({ ...cachedResponse, cached: true, stale: true, error: e.message });
    }
    return NextResponse.json({ error: e.message, offers: [] });
  }
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
