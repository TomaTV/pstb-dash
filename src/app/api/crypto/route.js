import { NextResponse } from "next/server";

let coinCache = { data: null, ts: 0 };
let stockCache = { data: null, ts: 0 };
const COIN_TTL = 60_000;
const STOCK_TTL = 5 * 60_000;

const INDICES = [
  { symbol: "^FCHI",   name: "CAC 40",     flag: "🇫🇷", currency: "EUR" },
  { symbol: "^GSPC",   name: "S&P 500",    flag: "🇺🇸", currency: "USD" },
  { symbol: "^IXIC",   name: "NASDAQ",     flag: "🇺🇸", currency: "USD" },
  { symbol: "^GDAXI",  name: "DAX",        flag: "🇩🇪", currency: "EUR" },
  { symbol: "^N225",   name: "Nikkei 225", flag: "🇯🇵", currency: "JPY" },
  { symbol: "^FTSE",   name: "FTSE 100",   flag: "🇬🇧", currency: "GBP" },
  { symbol: "^DJI",    name: "Dow Jones",  flag: "🇺🇸", currency: "USD" },
  { symbol: "^STOXX50E", name: "EURO STOXX 50", flag: "🇪🇺", currency: "EUR" },
  { symbol: "^HSI",    name: "Hang Seng",  flag: "🇭🇰", currency: "HKD" },
];

async function fetchCoins() {
  const url = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=15&page=1&sparkline=true&price_change_percentage=24h";
  const res = await fetch(url, { headers: { Accept: "application/json" }, next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
  const json = await res.json();
  return json.map(c => ({
    id: c.id,
    symbol: (c.symbol || "").toUpperCase(),
    name: c.name,
    image: c.image,
    price: c.current_price,
    change24h: c.price_change_percentage_24h,
    marketCap: c.market_cap,
    volume24h: c.total_volume,
    sparkline: c.sparkline_in_7d?.price ?? [],
  }));
}

async function fetchOneStock(idx) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(idx.symbol)}?interval=1d&range=7d`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error(`Yahoo ${res.status}`);
  const json = await res.json();
  const result = json?.chart?.result?.[0];
  const meta = result?.meta ?? {};
  const closes = result?.indicators?.quote?.[0]?.close ?? [];
  const price = meta.regularMarketPrice ?? meta.previousClose ?? null;
  const prev = meta.chartPreviousClose ?? meta.previousClose ?? null;
  const change24h = prev && price ? ((price - prev) / prev) * 100 : null;
  const sparkline = closes.filter(v => v != null);
  // 52-week range
  const low52 = meta.fiftyTwoWeekLow ?? null;
  const high52 = meta.fiftyTwoWeekHigh ?? null;
  return {
    id: idx.symbol,
    symbol: idx.symbol,
    name: idx.name,
    flag: idx.flag,
    price,
    change24h,
    sparkline,
    currency: idx.currency ?? meta.currency ?? "USD",
    marketState: meta.marketState ?? "CLOSED",
    low52,
    high52,
    volume: meta.regularMarketVolume ?? null,
  };
}

async function fetchStocks() {
  const results = await Promise.allSettled(INDICES.map(fetchOneStock));
  return results
    .filter(r => r.status === "fulfilled")
    .map(r => r.value);
}

export async function GET() {
  const now = Date.now();

  const [coins, stocks] = await Promise.all([
    (coinCache.data && now - coinCache.ts < COIN_TTL)
      ? Promise.resolve(coinCache.data)
      : fetchCoins().then(d => { coinCache = { data: d, ts: now }; return d; }).catch(() => coinCache.data ?? []),
    (stockCache.data && now - stockCache.ts < STOCK_TTL)
      ? Promise.resolve(stockCache.data)
      : fetchStocks().then(d => { stockCache = { data: d, ts: now }; return d; }).catch(() => stockCache.data ?? []),
  ]);

  return NextResponse.json({ coins, stocks });
}
