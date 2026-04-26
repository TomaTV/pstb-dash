"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import WidgetWrapper from "@/components/WidgetWrapper";
import { useDashboard } from "@/context/DashboardContext";
import { Train, RefreshCw, AlertTriangle, CheckCircle2 } from "lucide-react";

/* ─── Status overlay icon (top-right of badge) ─── */
function StatusOverlay({ status }) {
  if (status === "ok") return null;
  const color = status === "disrupted" ? "#F59E0B" : "#EF4444";
  const icon = status === "disrupted" ? "△" : "!";
  return (
    <div className="absolute -top-1.5 -right-1.5 w-[18px] h-[18px] rounded-full flex items-center justify-center text-[9px] font-black text-white z-10 shadow-md"
      style={{ background: color }}>
      {icon}
    </div>
  );
}

/* ─── Single line badge ─── */
function LineBadge({ id, color, textColor, status }) {
  const isLong = id.length > 2;
  return (
    <div className="relative">
      <div
        className={`flex items-center justify-center font-black select-none shadow-md ${isLong ? "rounded-lg" : "rounded-full"}`}
        style={{
          background: color,
          color: textColor,
          width: isLong ? "auto" : "3.2rem",
          height: "3.2rem",
          minWidth: isLong ? "3.6rem" : undefined,
          paddingLeft: isLong ? "0.6rem" : undefined,
          paddingRight: isLong ? "0.6rem" : undefined,
          fontSize: id.length > 2 ? "0.9rem" : id.length > 1 ? "1.1rem" : "1.45rem",
          boxShadow: status !== "ok" ? `0 0 16px ${color}55` : undefined,
        }}
      >
        {id}
      </div>
      <StatusOverlay status={status} />
    </div>
  );
}

/* ─── Type icon (not emoji) ─── */
function TypeIcon({ type }) {
  if (type === "rer") return <Train className="w-4 h-4 text-white/40 inline-block" />;
  if (type === "metro") return (
    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full border-2 border-white/40 text-[10px] font-black text-white/40">M</span>
  );
  // tram
  return (
    <span className="inline-flex items-center justify-center text-[11px] font-bold text-white/40 tracking-wider">
      <svg className="w-4 h-4 text-white/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 18V9a8 8 0 0 1 16 0v9" /><path d="M4 18h16" /><path d="M8 22l-2-4" /><path d="M16 22l2-4" /><line x1="12" y1="2" x2="12" y2="4" />
      </svg>
    </span>
  );
}

/* ─── Section labels ─── */
const SECTION_LABELS = {
  rer: "TRAIN / RER",
  metro: "MÉTRO",
  tram: "TRAM",
};

/* ─── Disruption detail row ─── */
function DisruptionRow({ group }) {
  return (
    <div className="flex items-start gap-3 px-5 py-3.5 bg-white/[0.02] rounded-2xl border border-white/[0.04]">
      <div className="shrink-0 mt-0.5 flex flex-wrap gap-1.5">
        {group.lines.map(line => {
          const isLong = line.id.length > 2;
          return (
            <div
              key={line.id}
              className={`flex items-center justify-center font-black select-none ${isLong ? "rounded-md" : "rounded-full"} shadow-sm`}
              style={{
                background: line.color, color: line.textColor,
                width: isLong ? "auto" : "1.6rem", height: "1.6rem",
                minWidth: isLong ? "2rem" : undefined,
                paddingInline: isLong ? "0.3rem" : undefined,
                fontSize: "0.7rem",
              }}
            >
              {line.id}
            </div>
          );
        })}
      </div>
      <div className="flex-1 min-w-0 pr-2">
        <div className={`text-[13px] font-black mb-1 tracking-wide uppercase ${group.status === "critical" ? "text-red-400" : "text-amber-400"}`}>
          {group.status === "critical" ? "Trafic interrompu" : "Trafic perturbé"}
        </div>
        <div className="text-xs text-white/60 leading-relaxed font-medium line-clamp-2">{group.message || "Perturbation signalée."}</div>
      </div>
      <div className={`shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full ${group.status === "critical" ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" : "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]"} animate-pulse`} />
    </div>
  );
}

export default function TransportWidget({ widget, mode = "grid" }) {
  const { focusWidget } = useDashboard();
  const [data, setData] = useState(null);
  const scrollRef = useRef(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/transport");
      if (!res.ok) throw new Error("fetch failed");
      setData(await res.json());
    } catch (e) {
      console.error("[TransportWidget]", e);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 120_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const lines = data?.lines ?? {};
  const allLines = [...(lines.rer ?? []), ...(lines.metro ?? []), ...(lines.tram ?? [])];
  const disruptions = allLines.filter(l => l.status !== "ok");

  // Group identical messages
  const groupedDisruptions = [];
  const msgMap = new Map();
  for (const l of disruptions) {
    const msg = l.message || "Perturbation signalée.";
    if (!msgMap.has(msg)) {
      msgMap.set(msg, { lines: [l], status: l.status, message: msg });
      groupedDisruptions.push(msgMap.get(msg));
    } else {
      const g = msgMap.get(msg);
      g.lines.push(l);
      if (l.status === "critical") g.status = "critical";
    }
  }

  // Auto-scroll logic for TV display
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || groupedDisruptions.length <= 5) return;

    let animationFrameId;
    let scrollTop = 0;

    const scroll = () => {
      scrollTop += 0.15; // Extremely slow, readable scrolling speed
      if (scrollTop >= el.scrollHeight / 2) {
        scrollTop = 0; // Seamless loop
      }
      el.scrollTop = scrollTop;
      animationFrameId = requestAnimationFrame(scroll);
    };

    const timeoutId = setTimeout(() => {
      animationFrameId = requestAnimationFrame(scroll);
    }, 3000);

    return () => {
      clearTimeout(timeoutId);
      cancelAnimationFrame(animationFrameId);
    };
  }, [groupedDisruptions.length]);

  return (
    <WidgetWrapper widget={widget} mode={mode} onClick={() => focusWidget(widget.id)}>
      {({ mode: m }) => {
        if (m === "grid") {
          return (
            <div className="flex flex-col h-full justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-violet font-bold mb-2 flex items-center gap-1.5">
                  <Train className="w-3 h-3" /> Info trafic
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(lines.metro ?? []).slice(0, 8).map(l => (
                    <div key={l.id} className="relative">
                      <div className="flex items-center justify-center font-black rounded-full text-[9px]"
                        style={{ background: l.color, color: l.textColor, width: "1.4rem", height: "1.4rem" }}>
                        {l.id}
                      </div>
                      {l.status !== "ok" && (
                        <div className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${l.status === "critical" ? "bg-red-500" : "bg-amber-400"}`} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="text-[10px] text-sub font-mono mt-1">
                {disruptions.length === 0 ? "Trafic normal" : `${disruptions.length} perturbation${disruptions.length > 1 ? "s" : ""}`}
              </div>
            </div>
          );
        }

        // ═══════ FULLSCREEN / FOCUS ═══════
        const hasDisruptions = disruptions.length > 0;

        return (
          <div className="relative h-full w-full overflow-hidden bg-gradient-to-br from-[#0A0A0A] via-[#0A0E18] to-black">
            {/* Glows */}
            <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-blue-500/6 blur-[160px] pointer-events-none" />
            <div className="absolute -bottom-40 right-1/3 w-[500px] h-[500px] rounded-full bg-violet/5 blur-[140px] pointer-events-none" />

            <div className="h-full w-full flex">

              {/* LEFT: All lines */}
              <div className={`${hasDisruptions ? "w-[46%]" : "w-full"} h-full flex flex-col px-10 pt-8 relative z-10`}
                style={{ paddingBottom: "var(--safe-bottom, 2rem)" }}>

                {/* Header */}
                <div className="flex flex-col gap-3 mb-8 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/8">
                      <Train className="w-6 h-6 text-white/60" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/35 mb-0.5">Île-de-France</div>
                      <h1 className="text-3xl font-black text-white tracking-tight leading-none">Info Trafic</h1>
                    </div>
                  </div>
                  <div className={`self-start flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border ${
                    disruptions.length === 0
                      ? "bg-emerald-500/8 text-emerald-400 border-emerald-500/20"
                      : "bg-amber-500/8 text-amber-400 border-amber-500/20"
                  }`}>
                    {disruptions.length === 0
                      ? <><CheckCircle2 className="w-3.5 h-3.5" /> Trafic normal</>
                      : <><AlertTriangle className="w-3.5 h-3.5" /> {disruptions.length} perturbation{disruptions.length > 1 ? "s" : ""}</>
                    }
                  </div>
                </div>

                {/* Line sections */}
                <div className="flex-1 flex flex-col justify-center gap-4">
                  {["rer", "metro", "tram"].map(type => {
                    const sectionLines = lines[type] ?? [];
                    if (sectionLines.length === 0) return null;
                    return (
                      <div key={type} className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <TypeIcon type={type} />
                          <span className="text-xs font-bold uppercase tracking-[0.3em] text-white/40">{SECTION_LABELS[type]}</span>
                          <div className="flex-1 h-px bg-white/[0.06] ml-2" />
                          <span className="text-[10px] text-white/20 font-mono">{sectionLines.length} lignes</span>
                        </div>
                        <div className="flex flex-wrap gap-2.5">
                          {sectionLines.map(l => <LineBadge key={l.id} {...l} />)}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer */}
                <div className="flex items-center gap-2 text-[10px] text-white/15 mt-5 shrink-0">
                  <RefreshCw className="w-3 h-3" />
                  <span>data.ratp.fr · {data?.updatedAt && new Date(data.updatedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              </div>

              {/* RIGHT: Disruption panel */}
              {hasDisruptions && (
                <div className="flex-1 h-full border-l border-white/[0.06] bg-white/[0.01] flex flex-col pl-20 pr-14 pt-10"
                  style={{ paddingBottom: "var(--safe-bottom, 2.5rem)" }}>
                  <div className="flex items-center gap-2.5 mb-6 shrink-0">
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                    <span className="text-base font-bold text-white">Perturbations en cours</span>
                  </div>
                  <div 
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto space-y-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                    style={{ maskImage: "linear-gradient(to bottom, black 90%, transparent 100%)" }}
                  >
                    {groupedDisruptions.map((g, i) => <DisruptionRow key={i} group={g} />)}
                    {/* Duplicate list for seamless infinite scroll if there are many disruptions */}
                    {groupedDisruptions.length > 5 && groupedDisruptions.map((g, i) => <DisruptionRow key={`dup-${i}`} group={g} />)}
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
