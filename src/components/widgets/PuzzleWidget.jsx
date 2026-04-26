"use client";

import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import WidgetWrapper from "@/components/WidgetWrapper";
import { useDashboard } from "@/context/DashboardContext";
import { Brain, Gift, Lightbulb } from "lucide-react";

export default function PuzzleWidget({ widget, mode = "grid" }) {
  const { focusWidget } = useDashboard();
  const d = widget.data ?? {};
  const [origin, setOrigin] = useState("");
  useEffect(() => { setOrigin(window.location.origin); }, []);
  const qrUrl = d.qrUrl || origin || "https://pstb.fr";

  return (
    <WidgetWrapper widget={widget} mode={mode} onClick={() => focusWidget(widget.id)}>
      {({ mode: m }) => {
        if (m === "grid") {
          return (
            <div className="flex flex-col h-full justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Brain size={14} className="text-violet" />
                  <span className="text-xs uppercase tracking-widest text-sub">{d.category ?? "Énigme du jour"}</span>
                </div>
                <p className="text-sm font-semibold text-text leading-snug line-clamp-4">{d.question}</p>
              </div>
              {d.reward && (
                <div className="text-[10px] uppercase tracking-widest text-violet font-bold mt-3 flex items-center gap-1.5">
                  <Gift size={11} /> {d.reward}
                </div>
              )}
            </div>
          );
        }

        return (
          <div className="relative h-full w-full overflow-hidden bg-gradient-to-br from-[#0A0A0A] via-[#0E0818] to-black flex">
            {/* Glows */}
            <div className="absolute -top-40 -left-20 w-[700px] h-[700px] rounded-full bg-violet/12 blur-[180px] pointer-events-none" />
            <div className="absolute -bottom-40 right-0 w-[500px] h-[500px] rounded-full bg-fuchsia-500/8 blur-[150px] pointer-events-none" />

            {/* LEFT — question */}
            <div className="relative z-10 flex-1 flex flex-col justify-center px-14 lg:px-20 min-w-0" style={{ paddingBottom: "var(--safe-bottom, 2.5rem)" }}>

              {/* Category badge */}
              <div className="flex items-center gap-3 mb-8">
                <div className="flex items-center gap-2.5 bg-violet/10 border border-violet/25 rounded-2xl px-5 py-2.5">
                  <Brain size={18} className="text-violet" strokeWidth={1.8} />
                  <span className="text-sm font-bold uppercase tracking-[0.3em] text-violet">
                    {d.category ?? "Énigme du jour"}
                  </span>
                </div>
              </div>

              {/* Question */}
              <h2 className="font-black text-white leading-[1.08] tracking-tight mb-8"
                style={{ fontSize: m === "fullscreen" ? "clamp(3rem,5.5vw,5.5rem)" : "clamp(2.2rem,4vw,3.5rem)" }}>
                {d.question}
              </h2>

              {/* Hint */}
              {d.hint && (
                <div className="flex items-start gap-4 max-w-2xl mb-8 bg-amber-400/5 border border-amber-400/15 rounded-2xl px-6 py-4">
                  <Lightbulb size={20} className="text-amber-300 mt-0.5 shrink-0" strokeWidth={1.8} />
                  <p className="text-white/65 text-lg italic leading-relaxed">{d.hint}</p>
                </div>
              )}

              {/* Reward */}
              {d.reward && (
                <div className="inline-flex items-center gap-4 bg-gradient-to-r from-violet/15 to-fuchsia-500/10 border border-violet/30 rounded-2xl px-7 py-5">
                  <Gift size={26} className="text-violet shrink-0" strokeWidth={1.8} />
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.4em] text-violet/70 font-bold mb-0.5">À gagner</div>
                    <div className="text-xl font-black text-white">{d.reward}</div>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT — QR */}
            <div className="relative z-10 w-[300px] shrink-0 flex flex-col items-center justify-center border-l border-white/[0.05] px-10">
              <div className="bg-white p-4 rounded-3xl shadow-[0_20px_70px_-10px_rgba(101,31,255,0.45)] mb-5">
                <QRCode value={qrUrl} size={m === "fullscreen" ? 210 : 170} />
              </div>
              <div className="text-center">
                <div className="text-[10px] uppercase tracking-[0.4em] text-violet font-bold mb-1">Scannez pour</div>
                <div className="text-lg font-semibold text-white">{d.cta ?? "répondre"}</div>
              </div>
            </div>

            <div className="absolute bottom-5 left-14 text-[9px] uppercase tracking-[0.4em] text-white/20 font-bold">
              Challenge · PST&B
            </div>
          </div>
        );
      }}
    </WidgetWrapper>
  );
}
