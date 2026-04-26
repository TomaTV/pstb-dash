import { NextResponse } from "next/server";

let cache = { data: null, ts: 0 };
const CACHE_MS = 30 * 60 * 1000; // 30 min — GitHub search is rate-limited

export async function GET() {
  const now = Date.now();
  if (cache.data && now - cache.ts < CACHE_MS) {
    return NextResponse.json({ repos: cache.data, cached: true });
  }

  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    // Approximation of "trending today" — repos created/updated recently and gaining stars
    const url = `https://api.github.com/search/repositories?q=created:>${since}&sort=stars&order=desc&per_page=10`;
    const res = await fetch(url, {
      headers: { Accept: "application/vnd.github+json" },
      next: { revalidate: 1800 },
    });
    if (!res.ok) throw new Error(`GitHub ${res.status}`);
    const json = await res.json();
    const repos = (json.items ?? []).slice(0, 10).map(r => ({
      id: r.id,
      name: r.name,
      fullName: r.full_name,
      owner: r.owner?.login,
      avatar: r.owner?.avatar_url,
      description: r.description,
      url: r.html_url,
      language: r.language,
      stars: r.stargazers_count,
      forks: r.forks_count,
      createdAt: r.created_at,
    }));
    cache = { data: repos, ts: now };
    return NextResponse.json({ repos, cached: false });
  } catch (e) {
    console.error("[api/github-trending]", e);
    if (cache.data) return NextResponse.json({ repos: cache.data, cached: true, stale: true });
    return NextResponse.json({ error: "fetch failed", repos: [] }, { status: 502 });
  }
}
