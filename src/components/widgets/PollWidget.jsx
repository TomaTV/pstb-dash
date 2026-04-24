"use client";

import { useMemo, useState } from "react";
import WidgetWrapper from "@/components/WidgetWrapper";
import { useDashboard } from "@/context/DashboardContext";

export default function PollWidget({ widget, mode = "grid" }) {
  const { focusWidget, updateWidgetData } = useDashboard();
  const { data } = widget;
  const [voted, setVoted] = useState(null);

  const total = useMemo(() => data.options.reduce((a, o) => a + o.votes, 0) || 1, [data.options]);

  const vote = (id, e) => {
    e.stopPropagation();
    if (voted) return;
    updateWidgetData(widget.id, {
      options: data.options.map(o => o.id === id ? { ...o, votes: o.votes + 1 } : o),
    });
    setVoted(id);
  };

  const leader = data.options.reduce((a, o) => o.votes > a.votes ? o : a, data.options[0]);
  const leaderPct = Math.round(leader.votes / total * 100);

  return (
    <WidgetWrapper widget={widget} mode={mode} onClick={() => focusWidget(widget.id)}>
      {({ mode: m }) => m === "grid" ? (

        /* ── GRID ── */
        <div className="flex flex-col h-full justify-between">
          {/* Question — lisible de loin */}
          <p className="text-lg font-semibold text-text leading-snug">
            {data.question}
          </p>

          <div className="mt-auto pt-5">
            {/* Résultat en tête */}
            <div className="flex justify-between items-baseline gap-2 mb-2">
              <span className="text-sm text-sub truncate">{leader.label}</span>
              <span className="font-mono text-base font-bold text-text shrink-0">{leaderPct}%</span>
            </div>
            <div className="h-1.5 w-full bg-elevated rounded-full overflow-hidden">
              <div
                className="h-full bg-violet rounded-full transition-all duration-700"
                style={{ width: `${leaderPct}%` }}
              />
            </div>
            <div className="mt-2.5 text-xs text-sub font-mono">
              {total - 1} vote{total - 1 > 1 ? "s" : ""}
            </div>
          </div>
        </div>

      ) : (

        /* ── FOCUS / FULLSCREEN ── */
        <div className={`space-y-8 ${m === "fullscreen" ? "max-w-3xl" : "max-w-2xl"}`}>
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-sub">Sondage</span>
            <h2
              className="font-bold text-text leading-tight mt-3"
              style={{ fontSize: m === "fullscreen" ? "clamp(2.5rem,5vw,4rem)" : "clamp(1.75rem,3vw,2.5rem)" }}
            >
              {data.question}
            </h2>
            <p className="mt-2 text-sm text-sub font-mono">{total - 1} vote{total - 1 > 1 ? "s" : ""}</p>
          </div>

          <div className="space-y-3">
            {data.options.map(opt => {
              const pct = Math.round(opt.votes / total * 100);
              const isVoted = voted === opt.id;
              const isLeader = opt.id === leader.id;
              return (
                <button
                  key={opt.id}
                  onClick={e => vote(opt.id, e)}
                  disabled={!!voted}
                  className={[
                    "relative w-full overflow-hidden rounded-xl border text-left px-5 py-4",
                    "transition-all duration-150",
                    isVoted
                      ? "border-violet/60 bg-violet-dim"
                      : "border-border bg-elevated hover:border-violet/50 disabled:cursor-default",
                  ].join(" ")}
                >
                  {/* barre de résultat */}
                  {voted && (
                    <div
                      className="absolute inset-y-0 left-0 bg-violet/8 transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  )}
                  <div className="relative flex items-center justify-between gap-4">
                    <span className={`font-semibold text-text ${m === "fullscreen" ? "text-xl" : "text-base"}`}>
                      {opt.label}
                    </span>
                    <div className="flex items-center gap-3 shrink-0">
                      {voted && isLeader && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-violet">En tête</span>
                      )}
                      <span className={`font-mono tabular-nums ${voted ? "text-text font-bold" : "text-sub"} ${m === "fullscreen" ? "text-lg" : "text-base"}`}>
                        {voted ? `${pct}%` : opt.votes}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {data.history?.length > 0 && (
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-sub mb-3">Précédents</div>
              <div className="divide-y divide-border border border-border rounded-xl overflow-hidden">
                {data.history.map((h, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-3.5 bg-elevated">
                    <span className={`text-text ${m === "fullscreen" ? "text-base" : "text-sm"}`}>{h.question}</span>
                    <span className="text-sm text-sub">
                      <span className="text-violet font-medium">{h.winner}</span> · {h.votes}
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
