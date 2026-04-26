"use client";

import WidgetWrapper from "@/components/WidgetWrapper";
import { useDashboard } from "@/context/DashboardContext";

export default function RssWidget({ widget, mode = "grid" }) {
  const { focusWidget } = useDashboard();
  const { data } = widget;
  const items = data.items ?? [];
  const [featured, ...rest] = items;

  return (
    <WidgetWrapper widget={widget} mode={mode} onClick={() => focusWidget(widget.id)}>
      {({ mode: m }) => m === "grid" ? (

        /* ── GRID ── */
        <div className="flex flex-col h-full justify-between">
          {featured ? (
            <>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-sub mb-3">
                  {data.source}
                </div>
                <p className="text-lg font-semibold text-text leading-snug line-clamp-3">
                  {featured.title}
                </p>
                {featured.summary && (
                  <p className="mt-2 text-sm text-sub leading-relaxed line-clamp-2">
                    {featured.summary}
                  </p>
                )}
              </div>
              <div className="mt-auto pt-4 text-[11px] font-mono text-sub">
                {featured.date} · {items.length} article{items.length > 1 ? "s" : ""}
              </div>
            </>
          ) : (
            <p className="text-base text-sub">Aucun article.</p>
          )}
        </div>

      ) : (

        /* ── FOCUS / FULLSCREEN ── layout éditorial premium ── */
        <div className="relative h-full w-full overflow-hidden bg-gradient-to-br from-[#0A0A0A] via-[#0D0A10] to-black">
          {/* Glows */}
          <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-amber-500/6 blur-[150px] pointer-events-none" />
          <div className="absolute -bottom-32 left-1/4 w-[400px] h-[400px] rounded-full bg-violet/6 blur-[130px] pointer-events-none" />

          <div className="relative z-10 h-full w-full flex flex-col px-14 pt-8" style={{ paddingBottom: "var(--safe-bottom, 2rem)" }}>

            {/* Header compact */}
            <div className="flex items-center gap-3 mb-6 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.7)] animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-[0.45em] text-amber-400/80">Flux · {data.source}</span>
              <div className="h-px flex-1 bg-white/6" />
              <span className="text-[10px] font-mono text-white/20">{items.length} article{items.length > 1 ? "s" : ""}</span>
            </div>

            {/* Article à la une — prend toute la place si seul */}
            {featured && (
              <div className={`shrink-0 rounded-3xl border border-amber-400/20 bg-amber-400/[0.04] overflow-hidden relative ${rest.length === 0 ? "flex-1 flex flex-col justify-center" : "mb-4"}`}>
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-amber-400 to-amber-600" />
                <div className={`pl-10 pr-8 ${rest.length === 0 ? "py-12" : "py-7"}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-[9px] font-bold uppercase tracking-[0.45em] text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full">À la une</span>
                    {featured.date && <span className="text-[10px] font-mono text-white/25">{featured.date}</span>}
                  </div>
                  <h2 className="font-black text-white leading-[1.05] mb-3"
                    style={{ fontSize: rest.length === 0
                      ? "clamp(2.5rem, 5vw, 4.5rem)"
                      : "clamp(1.8rem, 3vw, 2.8rem)" }}>
                    {featured.title}
                  </h2>
                  {featured.summary && (
                    <p className="text-white/55 leading-relaxed"
                      style={{
                        fontSize: rest.length === 0 ? "1.1rem" : "0.95rem",
                        WebkitLineClamp: rest.length === 0 ? 4 : 2,
                        display: "-webkit-box",
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}>
                      {featured.summary}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Articles suivants */}
            {rest.length > 0 && (
              <div className="flex-1 flex flex-col gap-2 overflow-hidden">
                {rest.slice(0, m === "fullscreen" ? 6 : 4).map((it, i) => (
                  <div key={i} className="flex items-start gap-5 px-6 py-3.5 rounded-2xl border border-white/[0.05] bg-white/[0.015] flex-1 min-h-0">
                    <span className="shrink-0 font-mono text-[10px] text-white/20 mt-1 w-14">{it.date || `#${i + 2}`}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white/80 leading-snug line-clamp-1"
                        style={{ fontSize: "1rem" }}>
                        {it.title}
                      </p>
                      {it.summary && (
                        <p className="mt-0.5 text-white/35 text-xs line-clamp-1">{it.summary}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!featured && (
              <div className="flex-1 flex items-center justify-center text-white/30 text-lg">Aucun article.</div>
            )}
          </div>
        </div>
      )}
    </WidgetWrapper>
  );
}
