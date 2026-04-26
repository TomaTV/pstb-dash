"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import WidgetWrapper from "@/components/WidgetWrapper";
import { useDashboard } from "@/context/DashboardContext";

export default function ClockWidget({ widget, mode = "grid" }) {
  const { focusWidget } = useDashboard();
  const [now, setNow] = useState(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const tz = widget.data.timezone;
  const time = now
    ? now.toLocaleTimeString("fr-FR", { timeZone: tz, hour: "2-digit", minute: "2-digit" })
    : "--:--";
  const secs = now
    ? now.toLocaleTimeString("fr-FR", { timeZone: tz, second: "2-digit" })
    : "--";
  const date = now
    ? now.toLocaleDateString("fr-FR", { timeZone: tz, weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : "";

  if (mode === "sticky") {
    return (
      <div className="flex items-center gap-3 tabular-nums font-mono">
        <span className="text-xl font-bold text-text">{time}</span>
        <span className="text-sm font-semibold text-violet">{secs}</span>
      </div>
    );
  }

  return (
    <WidgetWrapper widget={widget} mode={mode} onClick={() => focusWidget(widget.id)}>
      {({ mode: m }) => {
        /* ── GRID ── */
        if (m === "grid") {
          return (
            <div className="flex flex-col h-full justify-between">
              <div
                className="font-mono font-black text-text tabular-nums leading-none"
                style={{ fontSize: "clamp(3.5rem, 5.5vw, 5.5rem)" }}
              >
                {time}
              </div>
              <div className="text-sm capitalize text-sub">{date}</div>
            </div>
          );
        }

        /* ── FULLSCREEN ── */
        if (m === "fullscreen") {
          return (
            <div className="flex flex-col items-center justify-center h-full gap-8">
              <div className="flex items-baseline gap-4 tabular-nums font-mono">
                <span
                  className="font-black text-text leading-none"
                  style={{ fontSize: "clamp(10rem, 22vw, 20rem)" }}
                >
                  {time}
                </span>
                <span className="font-bold text-violet" style={{ fontSize: "clamp(3rem, 5vw, 5rem)" }}>
                  {secs}
                </span>
              </div>
              <div className="text-3xl capitalize text-sub tracking-widest">{date}</div>
            </div>
          );
        }

        /* ── FOCUS — centré, dramatique ── */
        return (
          <div className="relative flex flex-col items-center justify-center h-full select-none overflow-hidden bg-gradient-to-br from-[#0A0A0A] via-[#0A0A14] to-black">
            {/* Glows ambiants */}
            <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full bg-violet/8 blur-[160px] pointer-events-none" />
            <div className="absolute -bottom-40 left-1/4 w-[500px] h-[500px] rounded-full bg-fuchsia-500/6 blur-[140px] pointer-events-none" />
            <div className="absolute -bottom-20 right-1/4 w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />

            {/* Heure massive */}
            <div className="relative z-10 flex items-baseline tabular-nums font-mono leading-none">
              <span
                className="font-black text-white drop-shadow-2xl"
                style={{ fontSize: "clamp(7rem, 18vw, 16rem)" }}
              >
                {time}
              </span>
              <span
                className="font-bold text-violet ml-4 drop-shadow-lg"
                style={{ fontSize: "clamp(2rem, 4vw, 4.5rem)" }}
              >
                {secs}
              </span>
            </div>

            {/* Séparateur décoratif */}
            <div className="relative z-10 flex items-center gap-4 mt-6 mb-5" style={{ width: "clamp(12rem, 20vw, 20rem)" }}>
              <div className="flex-1 h-px bg-white/12" />
              <div className="h-1.5 w-1.5 rounded-full bg-violet shadow-[0_0_10px_rgba(101,31,255,0.7)]" />
              <div className="flex-1 h-px bg-white/12" />
            </div>

            {/* Date */}
            <div
              className="relative z-10 capitalize text-white/45 tracking-[0.25em] uppercase font-medium"
              style={{ fontSize: "clamp(0.9rem, 1.6vw, 1.4rem)" }}
            >
              {date}
            </div>
          </div>
        );
      }}
    </WidgetWrapper>
  );
}
