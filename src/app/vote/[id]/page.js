"use client";

import { useState, use, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, Lock } from "lucide-react";
import StudentAuth from "@/components/StudentAuth";

export default function VotePage({ params }) {
  const resolvedParams = use(params);
  const widgetId = resolvedParams.id;

  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [voted, setVoted] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let on = true;
    const load = async () => {
      try {
        const res = await fetch(`/api/poll/vote?widgetId=${encodeURIComponent(widgetId)}`, { cache: "no-store" });
        if (!on) return;
        if (res.status === 404) {
          setError("Sondage introuvable.");
        } else if (res.ok) {
          const data = await res.json();
          setPoll(data);
          if (data.voted) setVoted(data.voted);
        } else {
          setError("Erreur de chargement.");
        }
      } catch {
        if (on) setError("Erreur réseau.");
      } finally {
        if (on) setLoading(false);
      }
    };
    load();
    return () => { on = false; };
  }, [widgetId]);

  const handleVote = async (optionId) => {
    if (voted || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/poll/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ widgetId, optionId }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 409) {
        setVoted(optionId);
        setError("Tu as déjà voté pour ce sondage.");
      } else if (res.ok) {
        setPoll(prev => ({ ...prev, options: data.options }));
        setVoted(optionId);
      } else {
        setError(data.error || "Vote impossible.");
      }
    } catch {
      setError("Erreur réseau.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-6">
        <p className="text-sub text-sm">Chargement…</p>
      </div>
    );
  }

  if (error && !poll) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-6 text-center">
        <p className="text-sub text-lg">{error}</p>
      </div>
    );
  }

  const total = (poll.options || []).reduce((a, o) => a + o.votes, 0) || 1;
  const leader = poll.options.reduce((a, o) => (o.votes > a.votes ? o : a), poll.options[0]);
  const showResults = !!voted;

  return (
    <StudentAuth>
      <div className="min-h-screen bg-bg p-6 flex flex-col max-w-md mx-auto">
        <div className="mb-10 mt-8">
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-sub">Sondage en direct</span>
          <h1 className="font-bold text-text leading-tight mt-3 text-3xl">{poll.question}</h1>
          <p className="mt-2 text-sm text-sub font-mono">
            {Math.max(0, total - 1)} vote{total - 1 > 1 ? "s" : ""}
          </p>
        </div>

        <div className="space-y-4 flex-1">
          {poll.options.map(opt => {
            const pct = Math.round((opt.votes / total) * 100);
            const isVoted = voted === opt.id;
            const isLeader = opt.id === leader.id;

            return (
              <button
                key={opt.id}
                onClick={() => handleVote(opt.id)}
                disabled={!!voted || submitting}
                className={[
                  "relative w-full overflow-hidden rounded-2xl border text-left px-5 py-5",
                  "transition-all duration-300",
                  isVoted
                    ? "border-violet/60 bg-violet-dim shadow-[0_0_20px_rgba(139,92,246,0.15)]"
                    : "border-border bg-elevated hover:border-violet/50 disabled:opacity-80 disabled:cursor-default",
                ].join(" ")}
              >
                {showResults && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="absolute inset-y-0 left-0 bg-violet/10"
                  />
                )}
                <div className="relative flex items-center justify-between gap-4">
                  <span className={`font-semibold ${isVoted ? "text-violet" : "text-text"} text-lg flex items-center gap-2`}>
                    {isVoted && <Check size={18} className="text-violet" />}
                    {opt.label}
                  </span>
                  <div className="flex items-center gap-3 shrink-0">
                    {showResults && isLeader && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-violet">En tête</span>
                    )}
                    {showResults && (
                      <span className="font-mono tabular-nums text-text font-bold text-lg">{pct}%</span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {voted && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 text-center pb-8 space-y-2"
          >
            <div className="inline-flex items-center gap-2 text-sm text-violet font-semibold">
              <Lock size={14} />
              Vote enregistré
            </div>
            <p className="text-xs text-sub">Les résultats sont mis à jour en direct sur l&apos;écran principal.</p>
          </motion.div>
        )}

        {error && voted && (
          <p className="mt-4 text-center text-xs text-amber-400/80">{error}</p>
        )}
      </div>
    </StudentAuth>
  );
}
