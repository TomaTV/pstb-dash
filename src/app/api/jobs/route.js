import { NextResponse } from "next/server";

/*
 * 2 sources d'offres alternance — fusionnées avec dédup :
 *   1. Adzuna (clés ADZUNA_*)               · https://developer.adzuna.com
 *   2. France Travail (clés FRANCETRAVAIL_*) · https://francetravail.io
 */
const APP_ID = process.env.ADZUNA_APP_ID ?? "";
const APP_KEY = process.env.ADZUNA_APP_KEY ?? "";
const FT_CLIENT_ID = process.env.FRANCETRAVAIL_CLIENT_ID ?? "";
const FT_CLIENT_SECRET = process.env.FRANCETRAVAIL_CLIENT_SECRET ?? "";

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
  const { searchParams } = new URL(req.url);
  const customQuery = searchParams.get("q");
  const customLocation = searchParams.get("where") ?? "Paris";
  const count = Number(searchParams.get("count") ?? "6");
  const force = searchParams.get("refresh") === "1";
  const reset = searchParams.get("reset") === "1";
  if (reset) {
    cumulativeOffers = [];
    lastFetch = 0;
  }

  // Query custom = direct Adzuna only, pas de cache (rare, à la demande)
  if (customQuery) {
    if (!APP_ID || !APP_KEY) {
      return NextResponse.json({ error: "Adzuna keys missing", offers: [] });
    }
    try {
      const offers = await fetchAdzunaOffers(customQuery, customLocation, count);
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
      // Lance les 2 sources en parallèle. Chaque source fail-soft → []
      const [adzuna, ftravail] = await Promise.all([
        fetchAllAdzuna(),
        fetchAllFranceTravail(),
      ]);

      const fresh = [...adzuna, ...ftravail].filter((o) => {
        const c = (o.company || "").toLowerCase();
        const t = (o.title || "").toLowerCase();
        if (SCHOOL_BLOCKLIST.some((k) => c.includes(k))) return false;
        if (t.includes("formation") || t.includes("école") || t.includes("ecole")) return false;
        return true;
      });

      // ── Merge cumulatif (dédup titre+entreprise) ──
      const seen = new Set();
      const merged = [];
      for (const offer of [...fresh, ...cumulativeOffers]) {
        const key = `${(offer.title || "").toLowerCase().slice(0, 60)}|${(offer.company || "").toLowerCase()}`;
        if (seen.has(key)) continue;
        seen.add(key);
        merged.push(offer);
      }

      merged.sort((a, b) => {
        const dt = parseFrDate(b.postedAt) - parseFrDate(a.postedAt);
        if (dt !== 0) return dt;
        return (a.title || "").localeCompare(b.title || "");
      });

      if (fresh.length > 0 || isCold) {
        cumulativeOffers = merged.slice(0, MAX_OFFERS);
        lastFetch = Date.now();
      }

      return NextResponse.json({
        offers: cumulativeOffers,
        total: cumulativeOffers.length,
        sources: { adzuna: adzuna.length, francetravail: ftravail.length },
        refreshed: true,
        ageSeconds: 0,
      });
    } catch (e) {
      console.error("[Jobs API]", e.message);
      // Fail soft : on garde le cumulatif existant
    }
  }

  return NextResponse.json({
    offers: cumulativeOffers,
    total: cumulativeOffers.length,
    cached: true,
    ageSeconds: lastFetch ? Math.round((Date.now() - lastFetch) / 1000) : null,
  });
}

// ════════════════════════════════════════════════════════════════════
//   ADZUNA
// ════════════════════════════════════════════════════════════════════

async function fetchAllAdzuna() {
  if (!APP_ID || !APP_KEY) return [];
  try {
    const results = await Promise.all(
      SEARCHES.map((s) =>
        fetchAdzunaOffers(s.query, "Paris", s.count ?? 2, s.category, s.tag)
      )
    );
    return results.flat();
  } catch (e) {
    console.warn("[Adzuna] all-fetch failed:", e.message);
    return [];
  }
}

async function fetchAdzunaOffers(query, location, count, category, tag) {
  const url = new URL("https://api.adzuna.com/v1/api/jobs/fr/search/1");
  url.searchParams.set("app_id", APP_ID);
  url.searchParams.set("app_key", APP_KEY);
  url.searchParams.set("results_per_page", String(count));
  url.searchParams.set("what", query);
  url.searchParams.set("where", location);
  url.searchParams.set("sort_by", "date");
  if (category) url.searchParams.set("category", category);

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
      category: tag ?? detectCategory(category, title, description),
      level: detectLevel(title, description),
      source: "adzuna",
    };
  });
}

// ════════════════════════════════════════════════════════════════════
//   FRANCE TRAVAIL — OAuth2 client_credentials + Offres v2
// ════════════════════════════════════════════════════════════════════

let ftToken = null;
let ftTokenExpiry = 0;

async function getFtToken() {
  if (ftToken && Date.now() < ftTokenExpiry) return ftToken;
  if (!FT_CLIENT_ID || !FT_CLIENT_SECRET) return null;

  try {
    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: FT_CLIENT_ID,
      client_secret: FT_CLIENT_SECRET,
      scope: "api_offresdemploiv2 o2dsoffre",
    });
    const res = await fetch(
      "https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=%2Fpartenaire",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      }
    );
    if (!res.ok) {
      console.warn("[FranceTravail] OAuth failed:", res.status);
      return null;
    }
    const data = await res.json();
    ftToken = data.access_token;
    // expires_in en secondes, on garde une marge de 60s
    ftTokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
    return ftToken;
  } catch (e) {
    console.warn("[FranceTravail] OAuth error:", e.message);
    return null;
  }
}

// Codes ROME calés sur les programmes PST&B — Tech & Marketing/Business
// Tech élargi : dev, prod SI, expert SI, conseil SI, contenus multimédia, admin SI
const FT_ROME_TECH = ["M1805", "M1810", "M1802", "M1806", "M1801", "E1104", "E1101"];
// Marketing resserré : marketing, communication, stratégie commerciale, relation client, e-commerce
const FT_ROME_MARKETING = ["M1705", "E1103", "M1707", "M1704", "D1402"];
// natureContrat : E2 (apprentissage) + FS (professionnalisation) — on cible alternance
const FT_NATURE_CONTRAT = "E2,FS";

async function fetchAllFranceTravail() {
  const token = await getFtToken();
  if (!token) return [];

  // 2 requêtes : tech + marketing. On limite à 100 résultats par requête (max 150)
  const queries = [
    { romes: FT_ROME_TECH, tag: "tech" },
    { romes: FT_ROME_MARKETING, tag: "marketing" },
  ];

  try {
    const results = await Promise.all(
      queries.map((q) => fetchFranceTravailOffers(token, q.romes, q.tag))
    );
    return results.flat();
  } catch (e) {
    console.warn("[FranceTravail] all-fetch failed:", e.message);
    return [];
  }
}

async function fetchFranceTravailOffers(token, romes, tag) {
  const url = new URL("https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search");
  url.searchParams.set("natureContrat", FT_NATURE_CONTRAT);
  url.searchParams.set("codeROME", romes.join(","));
  url.searchParams.set("departement", "75");
  url.searchParams.set("range", "0-99");
  url.searchParams.set("sort", "1"); // tri par date

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      signal: ctrl.signal,
      next: { revalidate: 600 },
    });
    clearTimeout(timer);
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      console.warn("[FranceTravail] search", res.status, "for", tag, "·", txt.slice(0, 300));
      return [];
    }
    const data = await res.json();
    return (data.resultats ?? []).map((job) => {
      const title = cleanTitle(job.intitule ?? "");
      const description = cleanHtml(job.description ?? "");
      const lieu = job.lieuTravail?.libelle ?? "Paris";
      const company = job.entreprise?.nom || "Entreprise";
      const dateCreated = job.dateCreation ? new Date(job.dateCreation).toLocaleDateString("fr-FR") : "";
      const salary =
        job.salaire?.libelle?.replace(/\s+/g, " ").trim().slice(0, 40) || "";
      // Classement par ROME du job lui-même (plus précis que le tag de la query)
      const rome = (job.romeCode || "").toUpperCase();
      const cat = classifyByRome(rome) || tag || detectCategory(null, title, description);
      return {
        title,
        company,
        location: shortenLocation(lieu),
        contract: "Alternance",
        description: description.slice(0, 150),
        url: `https://candidat.francetravail.fr/offres/recherche/detail/${encodeURIComponent(job.id)}`,
        salary,
        postedAt: dateCreated,
        category: cat,
        level: detectLevel(title, description),
        source: "francetravail",
      };
    });
  } catch (e) {
    clearTimeout(timer);
    console.warn("[FranceTravail] fetch error:", e.message);
    return [];
  }
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
  const techKeys = ["développeur", "developer", "dev ", "fullstack", "front-end", "back-end", "frontend", "backend", "data", "devops", "cloud", "cyber", "ia ", "intelligence artificielle", "machine learning", "product manager", "qa ", "site reliability", "sre", "sécurité informatique"];
  if (techKeys.some((k) => text.includes(k))) return "tech";
  return "marketing";
}

// Classement direct via code ROME — beaucoup plus précis que les heuristiques.
// M180x = informatique, E1101/E1104 = web/multimédia → tech
// M170x, E1103 = marketing/communication → marketing
function classifyByRome(rome) {
  if (!rome) return null;
  if (/^M180/.test(rome)) return "tech";
  if (rome === "M1801" || rome === "M1802" || rome === "M1805" || rome === "M1806" || rome === "M1810" || rome === "M1811") return "tech";
  if (rome === "E1101" || rome === "E1104") return "tech";
  if (rome === "M1705" || rome === "M1704" || rome === "M1707" || rome === "E1103" || rome === "D1402") return "marketing";
  if (/^M17/.test(rome)) return "marketing";
  return null;
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
