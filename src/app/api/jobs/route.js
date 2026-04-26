import { NextResponse } from "next/server";

/*
 * Adzuna API — Alternances Tech & Marketing à Paris
 * Free tier · https://developer.adzuna.com/docs/search
 */
const APP_ID = process.env.ADZUNA_APP_ID ?? "";
const APP_KEY = process.env.ADZUNA_APP_KEY ?? "";

const SEARCHES = [
  { query: "alternance développeur", category: "it-jobs", count: 4 },
  { query: "alternance data", category: "it-jobs", count: 3 },
  { query: "alternance cybersécurité", category: "it-jobs", count: 2 },
  { query: "alternance marketing", count: 4 },
  { query: "alternance communication digitale", count: 3 },
  { query: "alternance commerce", count: 2 },
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
      // Multiple predefined searches for variety
      for (const search of SEARCHES) {
        const offers = await fetchOffers(
          search.query,
          "Paris",
          search.count ?? 2,
          search.category
        );
        allOffers.push(...offers);
      }
    }

    // Deduplicate by title
    const seen = new Set();
    const unique = allOffers.filter(o => {
      const key = o.title.toLowerCase().slice(0, 40);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return NextResponse.json({ offers: unique, total: unique.length });
  } catch (e) {
    console.error("[Jobs API]", e.message);
    return NextResponse.json({ error: e.message, offers: [] });
  }
}

async function fetchOffers(query, location, count, category) {
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

  const isTech = category === "it-jobs" || query.includes("développeur") || query.includes("data") || query.includes("cyber");

  const data = await res.json();
  return (data.results ?? []).map(job => ({
    title: cleanTitle(job.title ?? ""),
    company: job.company?.display_name ?? "Entreprise",
    location: shortenLocation(job.location?.display_name ?? location),
    contract: "Alternance",
    description: cleanHtml(job.description ?? "").slice(0, 150),
    url: shortenUrl(job.redirect_url ?? ""),
    salary: job.salary_min ? `${Math.round(job.salary_min)}€/an` : "",
    postedAt: job.created ? new Date(job.created).toLocaleDateString("fr-FR") : "",
    category: isTech ? "tech" : "marketing",
  }));
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
