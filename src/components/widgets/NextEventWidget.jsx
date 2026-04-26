"use client";

import WidgetWrapper from "@/components/WidgetWrapper";
import { useDashboard } from "@/context/DashboardContext";
import { Calendar as CalendarIcon, MapPin, Clock, ArrowRight } from "lucide-react";

function fmt(iso, opts) {
  try { return new Date(iso).toLocaleDateString("fr-FR", opts); } catch { return iso; }
}
function fmtTime(iso) {
  try { return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }); } catch { return ""; }
}

export default function NextEventWidget({ widget, mode = "grid" }) {
  const { focusWidget } = useDashboard();
  const { data } = widget;
  const d = data.date ? new Date(data.date) : new Date();
  const day = String(d.getDate()).padStart(2, "0");

  return (
    <WidgetWrapper widget={widget} mode={mode} onClick={() => focusWidget(widget.id)}>
      {({ mode: m }) => m === "grid" ? (

        /* ── GRID ── */
        <div className="flex flex-col h-full justify-between">
          {data.mode === "list" ? (
            <div className="h-full flex flex-col justify-between">
              <div>
                <div className="text-2xl font-bold text-text leading-snug">{data.name}</div>
                <div className="mt-2 text-lg text-sub">{data.location}</div>
              </div>
              <div className="mt-auto pt-5 space-y-3">
                {(data.listText || "").split("\n").filter(Boolean).slice(0,4).map((line, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="h-2 w-2 rounded-full bg-red shrink-0 mt-2" />
                    <span className="text-lg text-text font-medium">{line}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div>
            {/* Jour — rouge PSTB, très grand */}
            <div className="font-mono font-black leading-none tabular-nums text-red"
              style={{ fontSize: "clamp(4.5rem, 6vw, 6rem)" }}>
              {day}
            </div>
            {/* Mois — 20px minimum */}
            <div className="mt-2 text-xl font-semibold uppercase tracking-widest text-sub">
              {fmt(data.date, { month: "long", year: "numeric" })}
            </div>
          </div>

          <div className="mt-auto pt-5 space-y-1">
            {/* Nom — 24px min */}
            <div className="text-2xl font-bold text-text leading-snug">
              {data.name}
            </div>
            {/* Détails — 18px, au-dessus du minimum mais acceptable pour info secondaire */}
            <div className="text-lg text-sub">
              {fmtTime(data.date)} · {data.location}
            </div>
          </div>
            </>
          )}
        </div>

      ) : (

        /* ── FOCUS / FULLSCREEN ── */
        <div className="relative h-full w-full bg-gradient-to-br from-[#0A0A0A] via-[#0D0A1A] to-black overflow-hidden flex items-center">
          {/* Ambient Glows */}
          <div className="absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full bg-violet/10 blur-[160px] pointer-events-none" />
          <div className="absolute -bottom-40 left-1/4 w-[600px] h-[600px] rounded-full bg-fuchsia-500/8 blur-[160px] pointer-events-none" />

          {data.mode === "list" ? (
            <div className="relative z-10 w-full h-full flex">
              {/* Barre gauche violette — date */}
              <div className="w-[280px] lg:w-[340px] bg-violet shrink-0 flex flex-col items-center justify-center relative">
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-40 pointer-events-none" />
                <div className="relative z-10 flex flex-col items-center px-8 text-center">
                  <div className="text-xl font-black uppercase tracking-[0.5em] text-white/80">{fmt(data.date || new Date().toISOString(), { month: "long" })}</div>
                  <div className="font-black text-white leading-[0.85] tracking-tighter my-2" style={{ fontSize: "clamp(8rem,14vw,12rem)" }}>
                    {fmt(data.date || new Date().toISOString(), { day: "numeric" })}
                  </div>
                  <div className="text-lg font-bold uppercase tracking-[0.4em] text-white/70">{fmt(data.date || new Date().toISOString(), { weekday: "long" })}</div>
                </div>
              </div>
              {/* Contenu droite */}
              <div className="flex-1 flex flex-col justify-center px-14 lg:px-20 min-w-0" style={{ paddingBottom: "var(--safe-bottom, 3rem)" }}>
                <div className="flex items-center gap-3 mb-8">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet animate-pulse" />
                  <span className="text-[11px] font-bold uppercase tracking-[0.45em] text-violet">Agenda du campus</span>
                </div>
                <div className="font-black text-white leading-none tracking-tight mb-6" style={{ fontSize: "clamp(2.5rem,4vw,3.5rem)", letterSpacing: "-0.02em" }}>
                  {data.name}
                </div>
                {(data.date || data.endDate) && (
                  <div className="flex items-center gap-3 mb-8">
                    <Clock size={16} className="text-violet shrink-0" strokeWidth={1.8} />
                    <span className="text-lg font-semibold text-white/60">
                      {data.date ? fmt(data.date, { weekday: "long", day: "numeric", month: "long" }) : ""}
                      {data.date && data.endDate ? " — " : ""}
                      {data.endDate ? fmt(data.endDate, { day: "numeric", month: "long" }) : ""}
                    </span>
                  </div>
                )}
                <div className="grid grid-cols-1 gap-3">
                  {(data.listText || "").split("\n").filter(Boolean).map((line, i) => (
                    <div key={i} className={`rounded-2xl border ${i === 0 ? "border-violet/30 bg-violet/8" : "border-white/6 bg-white/[0.02]"} px-6 py-4 flex items-center gap-4`}>
                      <span className={`h-2 w-2 rounded-full shrink-0 ${i === 0 ? "bg-violet" : "bg-white/25"}`} />
                      <span className="text-xl font-semibold text-white">{line}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="relative z-10 w-full h-full flex">
              {/* Barre gauche violette — date */}
              <div className="w-[320px] lg:w-[400px] bg-violet shrink-0 flex flex-col items-center justify-center relative shadow-[30px_0_80px_rgba(101,31,255,0.2)]">
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-40 pointer-events-none" />
                <div className="relative z-10 flex flex-col items-center px-8 text-center">
                  <div className="text-2xl font-black uppercase tracking-[0.5em] text-white/80">{fmt(data.date, { month: "long" })}</div>
                  <div className="font-black text-white leading-[0.85] tracking-tighter my-2" style={{ fontSize: "clamp(10rem,16vw,14rem)" }}>
                    {day}
                  </div>
                  <div className="text-xl font-bold uppercase tracking-[0.5em] text-white/70">{fmt(data.date, { weekday: "long" })}</div>
                </div>
              </div>

              {/* Contenu droite */}
              <div className="flex-1 flex flex-col justify-center px-14 lg:px-20 min-w-0" style={{ paddingBottom: "var(--safe-bottom, 2.5rem)" }}>
                <div className="flex items-center gap-3 mb-8">
                  <span className="h-2 w-2 rounded-full bg-violet animate-pulse shadow-[0_0_12px_rgba(101,31,255,0.7)]" />
                  <span className="text-sm font-bold uppercase tracking-[0.45em] text-white/50">Prochain Événement</span>
                </div>

                <h2 className="font-black text-white leading-[1.05] tracking-tight mb-8 max-w-3xl" style={{ fontSize: "clamp(3rem,5vw,4.5rem)" }}>
                  {data.name}
                </h2>

                <div className="flex flex-col gap-3 mb-4">
                  {(data.date && data.endDate) && (
                    <div className="flex items-center gap-3 text-white/70">
                      <Clock size={18} className="text-violet shrink-0" strokeWidth={1.8} />
                      <span className="text-xl font-semibold">{fmtTime(data.date)} — {fmtTime(data.endDate)}</span>
                    </div>
                  )}
                  {data.location && (
                    <div className="flex items-center gap-3 text-white/45">
                      <MapPin size={18} className="shrink-0" strokeWidth={1.8} />
                      <span className="text-lg font-medium">{data.location}</span>
                    </div>
                  )}
                </div>

                {data.description && (
                  <p className="text-lg text-white/35 leading-relaxed max-w-2xl">
                    {data.description}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </WidgetWrapper>
  );
}
