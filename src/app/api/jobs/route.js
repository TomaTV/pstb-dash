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

  try {
    let allOffers = [];

    if (customQuery) {
      // Single custom query
      const offers = await fetchOffers(customQuery, customLocation, count);
      allOffers = offers;
    } else {
      // Parallèle plutôt que séquentiel : Adzuna gère, et c'est ~10x plus rapide
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

    // Tri par date (récent en premier) pour que /alternance et le widget aient un ordre stable
    unique.sort((a, b) => parseFrDate(b.postedAt) - parseFrDate(a.postedAt));

    return NextResponse.json({ offers: unique, total: unique.length });
  } catch (e) {
    console.error("[Jobs API]", e.message);
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

  // 6h cache — refreshes ~4x/day
  const res = await fetch(url.toString(), { next: { revalidate: 21600 } });
  if (!res.ok) {
    console.warn(`[Adzuna] ${res.status} for "${query}"`);
    return [];
  }

  const data = await res.json();
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
