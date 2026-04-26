"use client";

import { useMemo, useState, useEffect } from "react";
import QRCode from "react-qr-code";
import WidgetWrapper from "@/components/WidgetWrapper";
import { useDashboard } from "@/context/DashboardContext";
import { Trophy, ScanLine } from "lucide-react";

export default function PollWidget({ widget, mode = "grid" }) {
  const { focusWidget } = useDashboard();
  const { data } = widget;

  const total = useMemo(
    () => data.options.reduce((a, o) => a + o.votes, 0) || 1,
    [data.options]
  );
  const realTotal = total - 1;
  const leader = data.options?.length > 0
    ? data.options.reduce((a, o) => (o.votes > a.votes ? o : a), data.options[0])
    : null;
  const leaderPct = leader ? Math.round((leader.votes / total) * 100) : 0;

  const [origin, setOrigin] = useState("");
  useEffect(() => { setOrigin(window.location.origin); }, []);
  const pollUrl = data.url || (origin ? `${origin}/vote/${widget.id}` : `https://pstb.fr/vote/${widget.id}`);

  return (
    <WidgetWrapper widget={widget} mode={mode} onClick={() => focusWidget(widget.id)}>
      {({ mode: m }) => m === "grid" ? (
        /* ── GRID ── */
        <div className="flex flex-col h-full justify-between">
          <p className="text-lg font-semibold text-text leading-snug">
            {data.question}
          </p>
          <div className="mt-auto pt-5">
            {leader ? (
              <div className="flex justify-between items-baseline gap-2 mb-2">
                <span className="text-sm text-sub truncate">{leader.label}</span>
                <span className="font-mono text-base font-bold text-text shrink-0">{leaderPct}%</span>
              </div>
            ) : (
              <div className="flex justify-between items-baseline gap-2 mb-2">
                <span className="text-sm text-sub truncate">Aucune option</span>
              </div>
            )}
            <div className="h-1.5 w-full bg-elevated rounded-full overflow-hidden">
              <div
                className="h-full bg-violet rounded-full transition-all duration-700"
                style={{ width: `${leaderPct}%` }}
              />
            </div>
            <div className="mt-2.5 text-xs text-sub font-mono">
              {realTotal} vote{realTotal > 1 ? "s" : ""}
            </div>
          </div>
        </div>
      ) : (
        /* ── FOCUS / FULLSCREEN ── */
        <div className="relative h-full w-full overflow-hidden bg-gradient-to-br from-[#0A0A0A] via-[#0E0A18] to-black">
          <div className="absolute -top-40 right-0 w-[600px] h-[600px] rounded-full bg-violet/10 blur-[160px] pointer-events-none" />
          <div className="absolute -bottom-40 -left-20 w-[500px] h-[500px] rounded-full bg-fuchsia-500/8 blur-[140px] pointer-events-none" />

          <div className="relative h-full w-full flex gap-0">
            {/* LEFT — question + options */}
            <div className="flex-1 flex flex-col px-14 pt-12 min-w-0" style={{ paddingBottom: "var(--safe-bottom, 2.5rem)" }}>
              {/* Header */}
              <div className="flex items-center gap-3 mb-8 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-violet animate-pulse shadow-[0_0_10px_rgba(101,31,255,0.8)]" />
                <span className="text-[11px] font-bold uppercase tracking-[0.45em] text-violet">Sondage en direct</span>
                <div className="h-px flex-1 bg-violet/15" />
                <span className="text-[10px] font-mono text-white/30">{realTotal} vote{realTotal > 1 ? "s" : ""}</span>
              </div>

              {/* Question */}
              <h2 className="font-black text-white leading-[1.05] tracking-tight mb-8 shrink-0"
                style={{ fontSize: "clamp(2.2rem, 4vw, 4rem)" }}>
                {data.question}
              </h2>

              {/* Options */}
              <div className="flex-1 flex flex-col gap-3 overflow-hidden">
                {data.options.map((opt) => {
                  const pct = realTotal > 0 ? Math.round((opt.votes / total) * 100) : 0;
                  const isLeader = leader ? opt.id === leader.id : false;
                  return (
                    <div key={opt.id} className="flex-1 min-h-0 relative overflow-hidden rounded-2xl border transition-all duration-500"
                      style={{
                        borderColor: isLeader && realTotal > 0 ? "rgba(101,31,255,0.5)" : "rgba(255,255,255,0.06)",
                        background: isLeader && realTotal > 0 ? "rgba(101,31,255,0.07)" : "rgba(255,255,255,0.015)",
                        minHeight: "5rem",
                      }}>
                      {/* Fill bar */}
                      <div className="absolute inset-y-0 left-0 rounded-2xl transition-all duration-700"
                        style={{
                          width: `${pct}%`,
                          background: isLeader ? "rgba(101,31,255,0.25)" : "rgba(255,255,255,0.05)",
                        }} />
                      {/* Content */}
                      <div className="relative h-full flex items-center justify-between px-8 gap-6">
                        <span className="font-bold text-white flex items-center gap-3 flex-1 min-w-0 truncate"
                          style={{ fontSize: "clamp(1.3rem, 2vw, 2rem)" }}>
                          {isLeader && realTotal > 0 && (
                            <Trophy size={22} className="text-violet shrink-0" />
                          )}
                          {opt.label}
                        </span>
                        <span className="font-black tabular-nums shrink-0 transition-colors"
                          style={{
                            fontSize: "clamp(2.2rem, 4vw, 4rem)",
                            lineHeight: 1,
                            color: isLeader && realTotal > 0 ? "rgba(161,92,255,1)" : "rgba(255,255,255,0.25)",
                          }}>
                          {pct}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT — QR card */}
            <div className="w-[320px] shrink-0 flex flex-col items-center justify-center px-8 border-l border-white/[0.05]">
              <div className="w-full flex flex-col items-center bg-white/[0.03] border border-white/8 rounded-3xl px-6 py-8 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-violet mb-6 whitespace-nowrap">
                  <ScanLine size={12} />
                  <span>Scanner pour voter</span>
                </div>
                <div className="bg-white p-3.5 rounded-2xl shadow-[0_15px_50px_rgba(101,31,255,0.3)]">
                  <QRCode value={pollUrl} size={200} />
                </div>
                <div className="mt-6 text-center">
                  <div className="text-sm font-bold text-white mb-1">Pointe ton appareil photo</div>
                  <div className="text-[11px] text-white/35 leading-relaxed">Vote en 1 clic · 1 vote/pers.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </WidgetWrapper>
  );
}
