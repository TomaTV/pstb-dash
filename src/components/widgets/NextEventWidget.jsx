"use client";

import WidgetWrapper from "@/components/WidgetWrapper";
import { useDashboard } from "@/context/DashboardContext";

function fmt(iso, opts) {
  try { return new Date(iso).toLocaleDateString("fr-FR", opts); } catch { return iso; }
}
function fmtTime(iso) {
  try { return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }); } catch { return ""; }
}

export default function NextEventWidget({ widget, mode = "grid" }) {
  const { focusWidget } = useDashboard();
  const { data } = widget;
  const d = new Date(data.date);
  const day = String(d.getDate()).padStart(2, "0");

  return (
    <WidgetWrapper widget={widget} mode={mode} onClick={() => focusWidget(widget.id)}>
      {({ mode: m }) => m === "grid" ? (

        /* ── GRID ── */
        <div className="flex flex-col h-full justify-between">
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
        </div>

      ) : (

        /* ── FOCUS / FULLSCREEN ── */
        <div className={`space-y-8 ${m === "fullscreen" ? "max-w-4xl" : "max-w-2xl"}`}>
          <div>
            <span className="text-sm font-semibold uppercase tracking-[0.3em] text-sub">
              Prochain événement
            </span>
            <h2 className="font-bold text-text leading-tight mt-3"
              style={{ fontSize: m === "fullscreen" ? "clamp(3rem,5vw,4.5rem)" : "clamp(2rem,3.5vw,2.75rem)" }}>
              {data.name}
            </h2>
            <p className={`mt-4 text-sub leading-relaxed ${m === "fullscreen" ? "text-2xl" : "text-lg"}`}>
              {data.description}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Date",     value: fmt(data.date, { weekday: "long", day: "numeric", month: "long" }) },
              { label: "Horaires", value: `${fmtTime(data.date)} — ${fmtTime(data.endDate)}` },
              { label: "Lieu",     value: data.location },
            ].map(s => (
              <div key={s.label} className="rounded-xl border border-dashed border-muted/50 p-5 bg-elevated">
                <div className="text-xs font-bold uppercase tracking-widest text-sub mb-2">{s.label}</div>
                <div className={`font-semibold text-text ${m === "fullscreen" ? "text-xl" : "text-base"}`}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Badge rouge */}
          <div className="inline-flex items-center gap-3 rounded-xl bg-red-dim border border-red/25 px-5 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-red shrink-0" />
            <span className={`font-bold text-red ${m === "fullscreen" ? "text-xl" : "text-lg"}`}>
              {fmt(data.date, { weekday: "long", day: "numeric", month: "long" })} · {fmtTime(data.date)}–{fmtTime(data.endDate)}
            </span>
          </div>

          {data.upcoming?.length > 0 && (
            <div>
              <div className="text-sm font-bold uppercase tracking-widest text-sub mb-3">À venir</div>
              <div className="divide-y divide-border border border-border rounded-xl overflow-hidden">
                {data.upcoming.map((e, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-4 bg-elevated">
                    <span className={`text-text font-medium ${m === "fullscreen" ? "text-lg" : "text-base"}`}>{e.name}</span>
                    <span className="text-base font-mono text-sub">
                      {fmt(e.date, { day: "2-digit", month: "2-digit" })} · {fmtTime(e.date)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </WidgetWrapper>
  );
}
