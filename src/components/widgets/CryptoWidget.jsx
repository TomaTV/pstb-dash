"use client";

import { useEffect, useState, useMemo } from "react";
import WidgetWrapper from "@/components/WidgetWrapper";
import { useDashboard } from "@/context/DashboardContext";
import { TrendingUp, TrendingDown, Activity, BarChart2 } from "lucide-react";

/* ── formatters ── */
function fmtPrice(p, currency) {
  if (p == null) return "—";
  const sym = currency === "EUR" ? "€" : "$";
  if (p >= 10000) return `${sym}${p.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  if (p >= 1) return `${sym}${p.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  if (p >= 0.01) return `${sym}${p.toLocaleString("en-US", { maximumFractionDigits: 4 })}`;
  return `${sym}${p.toLocaleString("en-US", { maximumFractionDigits: 6 })}`;
}

function fmtMC(v) {
  if (v == null) return "—";
  if (v >= 1e12) return `${(v / 1e12).toFixed(2)}T`;
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
  return v.toLocaleString();
}

function fmtVol(v) {
  if (v == null) return "—";
  if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
  return String(v);
}

function fmtChange(n) {
  if (n == null) return "—";
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

/* ── sparkline ── */
function Sparkline({ points, up, width = 120, height = 36 }) {
  const path = useMemo(() => {
    if (!points || points.length < 2) return "";
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;
    const step = width / (points.length - 1);
    return points
      .map((v, i) => {
        const x = i * step;
        const y = height - ((v - min) / range) * height;
        return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(" ");
  }, [points, width, height]);
  const color = up ? "#10B981" : "#EF4444";
  if (!path) return <div style={{ width, height }} />;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id={`sg-${up ? "up" : "dn"}-${width}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${path} L${width},${height} L0,${height} Z`} fill={`url(#sg-${up ? "up" : "dn"}-${width})`} />
      <path d={path} stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── crypto row ── */
function CoinRow({ coin }) {
  const up = (coin.change24h ?? 0) >= 0;
  return (
    <div className="grid items-center border-b border-white/[0.04] py-3.5 px-5 hover:bg-white/[0.015] transition-colors"
      style={{ gridTemplateColumns: "auto 1fr auto auto auto" }}>
      <div className="flex items-center gap-3 min-w-[200px]">
        {coin.image && <img src={coin.image} alt="" className="w-6 h-6" />}
        <div>
          <div className="text-sm font-black text-white">{coin.symbol}</div>
          <div className="text-[10px] text-white/35 uppercase tracking-wider truncate">{coin.name}</div>
        </div>
      </div>
      <div className="px-4">
        <Sparkline points={coin.sparkline} up={up} width={130} height={28} />
      </div>
      <div className="text-right tabular-nums font-mono text-white text-sm font-semibold">
        {fmtPrice(coin.price)}
      </div>
      <div className={`text-right tabular-nums font-mono font-bold text-sm px-5 ${up ? "text-emerald-400" : "text-red-400"}`}>
        <span className="inline-flex items-center gap-1">
          {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {fmtChange(coin.change24h)}
        </span>
      </div>
      <div className="text-right tabular-nums font-mono text-xs text-white/30 min-w-[70px]">
        {fmtMC(coin.marketCap)}
      </div>
    </div>
  );
}

/* ── index (bourse) row — enriched ── */
function IndexRow({ idx }) {
  const up = (idx.change24h ?? 0) >= 0;
  const isOpen = idx.marketState === "REGULAR";
  // 52-week position as percentage
  const rangePos = (idx.low52 != null && idx.high52 != null && idx.price != null)
    ? Math.min(100, Math.max(0, ((idx.price - idx.low52) / (idx.high52 - idx.low52)) * 100))
    : null;
  return (
    <div className="grid items-center border-b border-white/[0.04] py-3 px-5 hover:bg-white/[0.015] transition-colors"
      style={{ gridTemplateColumns: "auto 1fr auto 140px auto" }}>
      <div className="flex items-center gap-3 min-w-[180px]">
        <span className="text-xl">{idx.flag}</span>
        <div>
          <div className="text-sm font-black text-white">{idx.name}</div>
          <div className="flex items-center gap-1.5">
            <span className={`w-1 h-1 rounded-full ${isOpen ? "bg-emerald-400" : "bg-white/20"}`} />
            <span className="text-[10px] text-white/35 uppercase tracking-wider">{isOpen ? "Ouvert" : "Fermé"}</span>
          </div>
        </div>
      </div>
      <div className="px-4">
        <Sparkline points={idx.sparkline} up={up} width={110} height={26} />
      </div>
      <div className="text-right tabular-nums font-mono text-white text-sm font-semibold pr-5">
        {fmtPrice(idx.price, idx.currency)}
      </div>
      {/* 52-week range bar */}
      {rangePos != null ? (
        <div className="flex flex-col gap-1">
          <div className="relative h-1 w-full bg-white/10 rounded-full overflow-hidden">
            <div
              className={`absolute top-0 left-0 h-full w-1.5 rounded-full ${up ? "bg-emerald-400" : "bg-red-400"}`}
              style={{ left: `calc(${rangePos}% - 3px)` }}
            />
          </div>
          <div className="flex justify-between text-[9px] text-white/25 font-mono tabular-nums">
            <span>{fmtPrice(idx.low52, idx.currency)}</span>
            <span>{fmtPrice(idx.high52, idx.currency)}</span>
          </div>
        </div>
      ) : <div />}
      <div className={`text-right tabular-nums font-mono font-bold text-sm pl-4 ${up ? "text-emerald-400" : "text-red-400"}`}>
        <span className="inline-flex items-center gap-1">
          {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {fmtChange(idx.change24h)}
        </span>
      </div>
    </div>
  );
}

const COL_HEADS_CRYPTO = (
  <div className="grid items-center px-5 py-2 border-b border-white/8 text-[9px] uppercase tracking-widest text-white/30 font-bold"
    style={{ gridTemplateColumns: "auto 1fr auto auto auto" }}>
    <div className="min-w-[200px]">Asset</div>
    <div className="px-4">7j</div>
    <div className="text-right">Prix</div>
    <div className="text-right px-5">24h</div>
    <div className="text-right min-w-[70px]">MCap</div>
  </div>
);

const COL_HEADS_STOCKS = (
  <div className="grid items-center px-5 py-2 border-b border-white/8 text-[9px] uppercase tracking-widest text-white/30 font-bold"
    style={{ gridTemplateColumns: "auto 1fr auto 140px auto" }}>
    <div className="min-w-[180px]">Indice</div>
    <div className="px-4">7j</div>
    <div className="text-right pr-5">Clôture</div>
    <div>52 semaines</div>
    <div className="text-right pl-4">Var.</div>
  </div>
);

let cachedCrypto = { coins: [], stocks: [], time: 0 };

export default function CryptoWidget({ widget, mode = "grid" }) {
  const { focusWidget } = useDashboard();
  const [coins, setCoins] = useState(cachedCrypto.coins);
  const [stocks, setStocks] = useState(cachedCrypto.stocks);
  const [updatedAt, setUpdatedAt] = useState(cachedCrypto.time ? new Date(cachedCrypto.time) : null);
  const [tab, setTab] = useState("crypto"); // "crypto" | "stocks" — auto-rotated

  useEffect(() => {
    let on = true;
    const load = async () => {
      if (cachedCrypto.time && Date.now() - cachedCrypto.time < 60_000) {
        if (on) {
          setCoins(cachedCrypto.coins);
          setStocks(cachedCrypto.stocks);
          setUpdatedAt(new Date(cachedCrypto.time));
        }
        return;
      }
      try {
        const res = await fetch("/api/crypto", { cache: "no-store" });
        const json = await res.json();
        if (on) {
          if (json.coins?.length) { setCoins(json.coins); cachedCrypto.coins = json.coins; }
          if (json.stocks?.length) { setStocks(json.stocks); cachedCrypto.stocks = json.stocks; }
          const now = new Date();
          setUpdatedAt(now);
          cachedCrypto.time = now.getTime();
        }
      } catch (e) {
        console.error("[CryptoWidget]", e);
      }
    };
    load();
    const dataId = setInterval(load, 60_000);
    // Auto-rotate between crypto and stocks every 15s
    const tabId = setInterval(() => setTab(t => t === "crypto" ? "stocks" : "crypto"), 15_000);
    return () => { on = false; clearInterval(dataId); clearInterval(tabId); };
  }, []);

  const top = coins[0];
  const topStocks = stocks.slice(0, 3);
  const topCoins = coins.slice(0, 4);

  return (
    <WidgetWrapper widget={widget} mode={mode} onClick={() => focusWidget(widget.id)}>
      {({ mode: m }) => {
        /* ── GRID ── */
        if (m === "grid") {
          const items = tab === "crypto" ? topCoins : topStocks;
          return (
            <div className="flex flex-col h-full gap-2">
              <div className="flex items-center gap-1.5">
                <Activity size={12} className="text-amber-400" />
                <span className="text-[10px] uppercase tracking-widest text-amber-400 font-bold">
                  {tab === "crypto" ? "Crypto" : "Bourses"}
                </span>
              </div>
              <div className="flex-1 space-y-1">
                {items.map(item => {
                  const up = (item.change24h ?? 0) >= 0;
                  return (
                    <div key={item.id || item.symbol} className="flex items-center justify-between gap-2 bg-white/[0.02] rounded-md px-2 py-1.5">
                      <div className="flex items-center gap-1.5">
                        {item.image && <img src={item.image} alt="" className="w-4 h-4" />}
                        {item.flag && <span className="text-sm">{item.flag}</span>}
                        <span className="text-[11px] font-black text-white">{item.symbol?.replace("^", "")}</span>
                      </div>
                      <span className={`text-[10px] font-mono font-bold ${up ? "text-emerald-400" : "text-red-400"}`}>
                        {fmtChange(item.change24h)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }

        /* ── FOCUS — 2 panneaux côte à côte ── */
        const cryptoLeft = coins.slice(1, 7);
        const cryptoRight = coins.slice(7, 12);

        return (
          <div className="relative h-full w-full overflow-hidden bg-[#050505] text-white">
            <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-emerald-500/5 blur-[120px]" />
            <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-blue-500/5 blur-[120px]" />

            <div className="relative h-full flex flex-col px-10 pt-8" style={{ paddingBottom: "var(--safe-bottom, 2rem)" }}>
              {/* Header */}
              <div className="flex items-center justify-between mb-5 shrink-0">
                <div className="flex items-end gap-6">
                  <div className="flex items-center gap-3">
                    <Activity size={22} className="text-amber-400" />
                    <h1 className="text-3xl font-black tracking-tight">MARCHÉS FINANCIERS</h1>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-white/30 font-mono mb-1.5">
                    <span>Crypto · CoinGecko</span>
                    <span className="text-white/10">·</span>
                    <span>Indices · Yahoo Finance</span>
                    {updatedAt && <span className="text-white/10">· {updatedAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-white/60">
                    <span className={tab === "crypto" ? "text-amber-400" : "text-white/25"}>Crypto</span>
                    <span className="text-white/20">·</span>
                    <span className={tab === "stocks" ? "text-blue-400" : "text-white/25"}>Bourses</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Live</span>
                  </div>
                </div>
              </div>

              {/* ── CRYPTO TAB ── */}
              {tab === "crypto" && (
                <div className="flex-1 min-h-0 flex flex-col gap-4">
                  {/* Hero BTC */}
                  {top && (
                    <div className="rounded-2xl bg-gradient-to-br from-white/[0.04] to-transparent border border-white/8 p-5 shrink-0">
                      <div className="flex items-center gap-6">
                        {top.image && <img src={top.image} alt="" className="w-12 h-12" />}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-3">
                            <span className="text-2xl font-black">{top.symbol}</span>
                            <span className="text-sm text-white/40 uppercase tracking-wider">{top.name}</span>
                          </div>
                          <div className="text-4xl font-black tabular-nums font-mono mt-0.5">
                            {fmtPrice(top.price)}
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <div className={`text-2xl font-black tabular-nums font-mono ${(top.change24h ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                            {fmtChange(top.change24h)}
                          </div>
                          <div className="text-[10px] uppercase tracking-widest text-white/40 mt-0.5">24h</div>
                        </div>
                        <Sparkline points={top.sparkline} up={(top.change24h ?? 0) >= 0} width={180} height={50} />
                      </div>
                    </div>
                  )}
                  {/* Table split */}
                  <div className="flex-1 min-h-0 grid grid-cols-2 gap-4 overflow-hidden">
                    <div className="rounded-xl bg-white/[0.015] border border-white/5 overflow-hidden flex flex-col">
                      {COL_HEADS_CRYPTO}
                      <div className="overflow-y-auto flex-1">
                        {cryptoLeft.map(c => <CoinRow key={c.id} coin={c} />)}
                      </div>
                    </div>
                    <div className="rounded-xl bg-white/[0.015] border border-white/5 overflow-hidden flex flex-col">
                      {COL_HEADS_CRYPTO}
                      <div className="overflow-y-auto flex-1">
                        {cryptoRight.map(c => <CoinRow key={c.id} coin={c} />)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── BOURSES TAB ── */}
              {tab === "stocks" && (
                <div className="flex-1 min-h-0 flex flex-col gap-4">
                  {/* Hero cards — top 3 (CAC, S&P, NASDAQ) */}
                  <div className="grid grid-cols-3 gap-3 shrink-0">
                    {stocks.slice(0, 3).map(idx => {
                      const up = (idx.change24h ?? 0) >= 0;
                      const rangePos = (idx.low52 != null && idx.high52 != null && idx.price != null)
                        ? Math.min(100, Math.max(0, ((idx.price - idx.low52) / (idx.high52 - idx.low52)) * 100))
                        : null;
                      return (
                        <div key={idx.id} className="rounded-2xl border border-white/8 bg-gradient-to-br from-white/[0.04] to-transparent p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{idx.flag}</span>
                              <div>
                                <div className="text-sm font-black text-white">{idx.name}</div>
                                <div className="flex items-center gap-1.5">
                                  <span className={`w-1 h-1 rounded-full ${idx.marketState === "REGULAR" ? "bg-emerald-400" : "bg-white/20"}`} />
                                  <span className="text-[9px] text-white/40">{idx.marketState === "REGULAR" ? "Ouvert" : "Fermé"}</span>
                                </div>
                              </div>
                            </div>
                            <Sparkline points={idx.sparkline} up={up} width={80} height={32} />
                          </div>
                          <div className="text-2xl font-black tabular-nums font-mono text-white">
                            {fmtPrice(idx.price, idx.currency)}
                          </div>
                          <div className={`text-sm font-bold tabular-nums font-mono mt-0.5 flex items-center gap-1 ${up ? "text-emerald-400" : "text-red-400"}`}>
                            {up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                            {fmtChange(idx.change24h)}
                          </div>
                          {/* 52-week mini bar */}
                          {rangePos != null && (
                            <div className="mt-2.5">
                              <div className="relative h-1 w-full bg-white/10 rounded-full">
                                <div
                                  className={`absolute top-0 h-full w-1.5 rounded-full ${up ? "bg-emerald-400" : "bg-red-400"}`}
                                  style={{ left: `calc(${rangePos}% - 3px)` }}
                                />
                              </div>
                              <div className="flex justify-between text-[8px] text-white/20 font-mono mt-0.5">
                                <span>{fmtPrice(idx.low52, idx.currency)}</span>
                                <span className="text-white/30 text-[8px]">52 sem.</span>
                                <span>{fmtPrice(idx.high52, idx.currency)}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {/* Full table — remaining indices */}
                  <div className="flex-1 min-h-0 rounded-xl bg-white/[0.015] border border-white/5 overflow-hidden flex flex-col">
                    {COL_HEADS_STOCKS}
                    <div className="overflow-y-auto flex-1">
                      {stocks.slice(3).map(idx => <IndexRow key={idx.id} idx={idx} />)}
                    </div>
                  </div>
                </div>
              )}


            </div>
          </div>
        );
      }}
    </WidgetWrapper>
  );
}
