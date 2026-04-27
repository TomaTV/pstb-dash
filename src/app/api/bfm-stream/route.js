import { NextResponse } from "next/server";

// ─── URLs connues et stables ───────────────────────────────────────────────
const KNOWN_URLS = {
  business: "https://live-cdn-stream-euw1.bfmb.bct.nextradiotv.com/master.m3u8",
  tech:     "https://d3j4tltxbw3g7r.cloudfront.net/v1/master/3722c60a815c199d9c0ef36c5b73da68a62b09d1/cc-dfnxknhtdaupl/Tech_and_Co_FR.m3u8",
};

// ─── Cache serveur (30 min TTL) ────────────────────────────────────────────
const cache = {};
const CACHE_TTL_MS = 30 * 60 * 1000;

export async function GET(req) {
  const { searchParams } = req.nextUrl;
  const type = searchParams.get("type");
  const bust = searchParams.get("bust"); // ?bust=1 to bypass cache

  if (!type || !["business", "tech"].includes(type)) {
    return NextResponse.json(
      { error: "type doit être 'business' ou 'tech'" },
      { status: 400 }
    );
  }

  // 1. Retourner le cache s'il est encore frais (sauf si bust)
  const cached = cache[type];
  if (!bust && cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return NextResponse.json({ streamUrl: cached.url, type, source: "cache" });
  }

  // 2. Retourner immédiatement l'URL connue (plus de HEAD check qui ralentit le chargement de 5s pour rien)
  const knownUrl = KNOWN_URLS[type];
  cache[type] = { url: knownUrl, ts: Date.now() };
  return NextResponse.json({ streamUrl: knownUrl, type, source: "known" });
}
