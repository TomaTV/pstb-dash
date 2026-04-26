"use client";

import { useEffect, useState } from "react";
import WidgetWrapper from "@/components/WidgetWrapper";
import { useDashboard } from "@/context/DashboardContext";
import { CalendarClock } from "lucide-react";

function diff(target) {
  const t = new Date(target).getTime();
  const now = Date.now();
  let ms = Math.max(0, t - now);
  const days = Math.floor(ms / 86_400_000); ms -= days * 86_400_000;
  const hours = Math.floor(ms / 3_600_000); ms -= hours * 3_600_000;
  const minutes = Math.floor(ms / 60_000); ms -= minutes * 60_000;
  const seconds = Math.floor(ms / 1000);
  return { total: t - Date.now(), days, hours, minutes, seconds };
}

function Box({ value, label, big = false }) {
  return (
    <div className={`flex flex-col items-center bg-white/[0.025] border border-white/8 rounded-3xl ${big ? "px-8 py-7 min-w-[160px]" : "px-4 py-3 min-w-[80px]"}`}>
      <span
        className="font-black text-white tabular-nums leading-none"
        style={{ fontSize: big ? "clamp(4rem, 8vw, 7rem)" : "2.4rem" }}
      >
        {String(value).padStart(2, "0")}
      </span>
      <span className={`uppercase tracking-[0.3em] text-white/45 mt-2 font-bold ${big ? "text-xs" : "text-[9px]"}`}>{label}</span>
    </div>
  );
}

export default function CountdownWidget({ widget, mode = "grid" }) {
  const { focusWidget } = useDashboard();
  const { data } = widget;
  const target = data?.date;
  const title = data?.title || "Compte à rebours";
  const subtitle = data?.subtitle || "";
  const accent = data?.accent || "violet";
  const accentColor = accent === "red" ? "#FF1744"
    : accent === "amber" ? "#F59E0B"
    : accent === "emerald" ? "#10B981"
    : "#651FFF";

  const [t, setT] = useState(() => target ? diff(target) : null);

  useEffect(() => {
    if (!target) return;
    setT(diff(target));
    const id = setInterval(() => setT(diff(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  const isPast = t && t.total < 0;

  return (
    <WidgetWrapper widget={widget} mode={mode} onClick={() => focusWidget(widget.id)}>
      {({ mode: m }) => {
        if (m === "grid") {
          return (
            <div className="flex flex-col h-full justify-between">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold" style={{ color: accentColor }}>
                <CalendarClock size={12} /> Countdown
              </div>
              <div className="text-sm text-white font-semibold leading-tight line-clamp-2 mt-1">{title}</div>
              {t && !isPast ? (
                <div className="flex items-baseline gap-1.5 tabular-nums mt-auto">
                  <span className="text-3xl font-black text-white">{t.days}</span>
                  <span className="text-xs text-white/45 uppercase tracking-widest">jours</span>
                  <span className="text-base font-mono text-white/60 ml-1">
                    {String(t.hours).padStart(2,"0")}:{String(t.minutes).padStart(2,"0")}
                  </span>
                </div>
              ) : (
                <div className="text-xs text-white/40 mt-auto">{isPast ? "Terminé" : "—"}</div>
              )}
            </div>
          );
        }

        // Focus mode
        return (
          <div className="relative h-full w-full overflow-hidden bg-[#0a0a0a] flex items-center justify-center">
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: `radial-gradient(ellipse at center, ${accentColor}15 0%, transparent 70%)` }}
            />

            <div className="relative z-10 max-w-6xl w-full px-16 text-center">
              <div className="flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-[0.5em] mb-6" style={{ color: accentColor }}>
                <CalendarClock size={14} />
                <span>Compte à rebours</span>
              </div>

              <h1
                className="font-black text-white leading-[1.05] tracking-tight"
                style={{ fontSize: "clamp(2.5rem, 5vw, 5rem)" }}
              >
                {title}
              </h1>
              {subtitle && (
                <p className="mt-4 text-lg text-white/55 max-w-3xl mx-auto leading-relaxed">{subtitle}</p>
              )}

              {t && !isPast && (
                <div className="mt-14 flex items-center justify-center gap-4 flex-wrap">
                  <Box value={t.days} label="Jours" big />
                  <Box value={t.hours} label="Heures" big />
                  <Box value={t.minutes} label="Min" big />
                  <Box value={t.seconds} label="Sec" big />
                </div>
              )}

              {isPast && (
                <div className="mt-14 inline-block px-10 py-6 rounded-3xl border border-white/10 bg-white/5 text-3xl font-black text-white">
                  C&apos;est arrivé !
                </div>
              )}

              {target && (
                <div className="mt-10 text-sm text-white/35 uppercase tracking-[0.3em] font-bold">
                  {new Date(target).toLocaleDateString("fr-FR", {
                    weekday: "long", day: "numeric", month: "long", year: "numeric",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </div>
              )}
            </div>
          </div>
        );
      }}
    </WidgetWrapper>
  );
}
