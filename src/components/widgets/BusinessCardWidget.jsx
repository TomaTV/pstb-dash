"use client";

import QRCode from "react-qr-code";
import WidgetWrapper from "@/components/WidgetWrapper";
import { useDashboard } from "@/context/DashboardContext";
import { TrendingDown, TrendingUp, Sparkles, Link2 } from "lucide-react";

export default function BusinessCardWidget({ widget, mode = "grid" }) {
  const { focusWidget } = useDashboard();
  const d = widget.data ?? {};
  const trend = d.trend ?? "down"; // "up" | "down" | "neutral"
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Sparkles;
  const trendColor = trend === "up" ? "text-emerald-400" : trend === "down" ? "text-[#FF1744]" : "text-violet";

  return (
    <WidgetWrapper widget={widget} mode={mode} onClick={() => focusWidget(widget.id)}>
      {({ mode: m }) => {
        if (m === "grid") {
          return (
            <div className="flex flex-col h-full justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TrendIcon size={14} className={trendColor} />
                  <span className="text-xs uppercase tracking-widest text-sub">{d.tag ?? "Le saviez-vous"}</span>
                </div>
                <div className={`text-3xl font-bold ${trendColor} tabular-nums leading-none mt-2`}>{d.bigStat}</div>
                <p className="text-xs text-sub mt-2 line-clamp-3">{d.question}</p>
              </div>
            </div>
          );
        }

        return (
          <div className="relative h-full w-full bg-gradient-to-br from-[#080808] via-[#0F0F1F] to-black overflow-hidden flex items-center">
            <div className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full bg-violet/12 blur-[140px]" />
            <div className="absolute -bottom-40 -right-32 w-[500px] h-[500px] rounded-full bg-fuchsia-500/8 blur-[120px]" />

            <div className="relative z-10 w-full max-w-7xl mx-auto px-20 py-14 flex items-end justify-between gap-12">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-10">
                  <TrendIcon size={24} className={trendColor} />
                  <span className={`text-sm font-bold uppercase tracking-[0.4em] ${trendColor}`}>
                    {d.tag ?? "Le saviez-vous"}
                  </span>
                </div>

                <div className={`font-black tabular-nums leading-none tracking-tighter ${trendColor}`}
                  style={{ fontSize: m === "fullscreen" ? "16rem" : "11rem" }}>
                  {d.bigStat}
                </div>

                {d.statLabel && (
                  <div className="text-xl uppercase tracking-[0.3em] text-white/55 font-semibold mt-3">
                    {d.statLabel}
                  </div>
                )}

                <h2 className="text-white font-bold leading-[1.1] tracking-tight mt-10 max-w-5xl"
                  style={{ fontSize: m === "fullscreen" ? "4rem" : "3rem" }}>
                  {d.question}
                </h2>

                {d.context && (
                  <p className="mt-6 text-white/65 leading-relaxed max-w-3xl"
                    style={{ fontSize: m === "fullscreen" ? "1.4rem" : "1.15rem" }}>
                    {d.context}
                  </p>
                )}

                <div className="mt-10 flex items-center gap-8 text-[11px] uppercase tracking-[0.35em] text-white/40 font-bold">
                  {d.source && <span>Source · {d.source}</span>}
                  {d.year && <span>{d.year}</span>}
                </div>
              </div>

              {/* QR CODE SOURCE */}
              {d.sourceUrl && (
                <div className="shrink-0 animate-in fade-in slide-in-from-right-8 duration-700">
                  <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl flex flex-col items-center">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-4">
                      <Link2 size={12} />
                      <span>Scanner la source</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl shadow-2xl">
                      <QRCode value={d.sourceUrl} size={150} />
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
