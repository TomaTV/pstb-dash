"use client";

import WidgetWrapper from "@/components/WidgetWrapper";
import { useDashboard } from "@/context/DashboardContext";

export default function RssWidget({ widget, mode = "grid" }) {
  const { focusWidget } = useDashboard();
  const { data } = widget;
  const items = data.items ?? [];
  const latest = items[0];

  return (
    <WidgetWrapper widget={widget} mode={mode} onClick={() => focusWidget(widget.id)}>
      {({ mode: m }) => m === "grid" ? (

        /* ── GRID ── */
        <div className="flex flex-col h-full justify-between">
          {latest ? (
            <>
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-sub mb-3">
                  {data.source}
                </div>
                <p className="text-lg font-semibold text-text leading-snug line-clamp-3">
                  {latest.title}
                </p>
                {latest.summary && (
                  <p className="mt-2 text-sm text-sub leading-relaxed line-clamp-2">
                    {latest.summary}
                  </p>
                )}
              </div>
              <div className="mt-auto pt-4 text-xs font-mono text-sub">
                {latest.date} · {items.length} article{items.length > 1 ? "s" : ""}
              </div>
            </>
          ) : (
            <p className="text-base text-sub">Aucun article.</p>
          )}
        </div>

      ) : (

        /* ── FOCUS / FULLSCREEN ── */
        <div className={`space-y-6 ${m === "fullscreen" ? "max-w-4xl" : "max-w-2xl"}`}>
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-sub">
              {data.source}
            </span>
            <h2
              className="font-bold text-text mt-2"
              style={{ fontSize: m === "fullscreen" ? "clamp(2.5rem,5vw,4rem)" : "2rem" }}
            >
              Actualités
            </h2>
          </div>

          <div className="space-y-3">
            {items.map((it, i) => (
              <div
                key={i}
                className={[
                  "rounded-xl border bg-elevated px-5 py-4",
                  i === 0 ? "border-pink/40 border-l-2" : "border-border",
                ].join(" ")}
              >
                <div className="text-xs font-mono text-sub mb-2">{it.date}</div>
                <h3 className={`font-semibold text-text ${m === "fullscreen" ? "text-xl" : "text-base"}`}>
                  {it.title}
                </h3>
                {it.summary && (
                  <p className={`mt-1.5 text-sub leading-relaxed ${m === "fullscreen" ? "text-base" : "text-sm"}`}>
                    {it.summary}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </WidgetWrapper>
  );
}
