"use client";

import WidgetWrapper from "@/components/WidgetWrapper";
import { useDashboard } from "@/context/DashboardContext";

function fmtDate(iso) {
  if (!iso) return { day: "—", month: "—", weekday: "—", time: "—" };
  const d = new Date(iso);
  return {
    day: String(d.getDate()).padStart(2, "0"),
    month: d.toLocaleDateString("fr-FR", { month: "long" }),
    weekday: d.toLocaleDateString("fr-FR", { weekday: "long" }),
    time: d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
  };
}

export default function SpoWidget({ widget, mode = "grid" }) {
  const { focusWidget } = useDashboard();
  const d = widget.data ?? {};
  const dt = fmtDate(d.date);

  return (
    <WidgetWrapper widget={widget} mode={mode} onClick={() => focusWidget(widget.id)}>
      {({ mode: m }) => {
        if (m === "grid") {
          return (
            <div className="flex flex-col h-full justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-violet font-bold mb-2">SPO · Portes ouvertes</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-text tabular-nums">{dt.day}</span>
                  <span className="text-sm uppercase tracking-widest text-sub">{dt.month}</span>
                </div>
                <p className="text-xs text-sub mt-2 line-clamp-2">{d.title ?? "Soirée portes ouvertes"}</p>
              </div>
              <div className="text-[10px] text-sub font-mono">{dt.time}</div>
            </div>
          );
        }

        return (
          <div className="relative h-full w-full overflow-hidden" style={{ background: "linear-gradient(120deg, #F90050 0%, #A000FF 45%, #2B00FF 100%)" }}>

            {/* Texture overlay subtile */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-black/30 z-10 pointer-events-none" />

            {/* Glow accent */}
            <div className="absolute top-0 left-0 w-[60%] h-[50%] rounded-full bg-white/5 blur-[120px] pointer-events-none z-10" />

            {/* Right half image */}
            {d.heroImage && (
              <div className="absolute inset-y-0 right-0 w-[45%] z-20">
                <img src={d.heroImage} alt="" className="h-full w-full object-cover object-top" />
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#2B00FF]/80 to-transparent" />
                <div className="absolute inset-y-0 left-0 w-48 bg-gradient-to-r from-[#8000CC] to-transparent" />
              </div>
            )}

            {/* Content layer */}
            <div className="relative z-30 h-full flex flex-col px-16 py-12" style={{ paddingBottom: "var(--safe-bottom, 3rem)" }}>

              {/* Logo */}
              <div className="shrink-0">
                <img src="/Logo.svg" alt="PST&amp;B" className="brightness-0 invert drop-shadow-2xl"
                  style={{ height: m === "fullscreen" ? "8rem" : "3.5rem" }} />
              </div>

              {/* Content bottom-aligned */}
              <div className="flex-1 flex flex-col justify-end" style={{ maxWidth: "60%" }}>

                {/* Eyebrow */}
                <div className="flex items-center gap-3 mb-5">
                  <span className="h-1.5 w-8 rounded-full bg-white/60" />
                  <span className="text-[11px] font-bold uppercase tracking-[0.5em] text-white/70">Portes Ouvertes</span>
                </div>

                {/* Titre — whitespace-nowrap + clamp responsive */}
                <h1 className="font-black text-white leading-none tracking-tight mb-5"
                    style={{ fontSize: "clamp(2.5rem, 4.8vw, 6rem)", whiteSpace: "nowrap" }}>
                  {d.title ?? "Soirée Portes Ouvertes"}
                </h1>

                {/* Date */}
                <div className="flex items-baseline gap-3 mb-8">
                  <span className="font-black text-white tabular-nums" style={{ fontSize: "clamp(2rem, 3vw, 3.5rem)" }}>
                    {dt.day}
                  </span>
                  <span className="font-semibold text-white/80 uppercase tracking-widest" style={{ fontSize: "clamp(1rem, 1.4vw, 1.5rem)" }}>
                    {dt.month} {d.date ? new Date(d.date).getFullYear() : ""}
                  </span>
                  <span className="ml-1 font-medium text-white/50 capitalize" style={{ fontSize: "clamp(0.85rem, 1.2vw, 1.2rem)" }}>
                    &middot; {dt.time}
                  </span>
                </div>

              </div>
            </div>
          </div>
        );
      }}
    </WidgetWrapper>
  );
}
