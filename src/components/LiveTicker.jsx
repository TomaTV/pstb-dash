"use client";

import { useMemo, useEffect, useRef } from "react";
import { Radio } from "lucide-react";

const ANIM_NAME = "pstb-ticker-scroll";

export default function LiveTicker({ ticker }) {
  const enabled = ticker?.enabled;
  const position = ticker?.position === "top" ? "top" : "bottom";
  const speed = Math.max(5, Number(ticker?.speed) || 60);
  const messages = Array.isArray(ticker?.messages)
    ? ticker.messages.filter(m => typeof m === "string" && m.trim().length > 0)
    : [];

  const accent = ticker?.accent || "violet";
  const accentColor = accent === "red" ? "#FF1744"
    : accent === "amber" ? "#F59E0B"
    : accent === "emerald" ? "#10B981"
    : "#651FFF";

  const content = useMemo(() => {
    if (messages.length === 0) return "";
    return messages.join("   •   ");
  }, [messages]);

  // Inject the keyframe once into <head> — CSS animation is GPU-smooth, no JS frame loop needed
  useEffect(() => {
    const id = "pstb-ticker-style";
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.textContent = `@keyframes ${ANIM_NAME} { from { transform: translateX(100vw); } to { transform: translateX(-100%); } }`;
    document.head.appendChild(style);
  }, []);

  if (!enabled || !content) return null;

  return (
    <div
      className="fixed left-0 right-0 z-[60] pointer-events-none select-none"
      style={{ [position]: 0, height: 44 }}
    >
      <div
        className="relative w-full h-full overflow-hidden flex items-center backdrop-blur-xl"
        style={{
          background: "rgba(10,10,10,0.88)",
          borderTop: position === "bottom" ? `2px solid ${accentColor}` : undefined,
          borderBottom: position === "top" ? `2px solid ${accentColor}` : undefined,
          boxShadow: position === "bottom"
            ? "0 -4px 20px rgba(0,0,0,0.5)"
            : "0 4px 20px rgba(0,0,0,0.5)",
        }}
      >
        {/* Brand badge */}
        <div
          className="shrink-0 flex items-center gap-2 px-5 h-full text-white font-black uppercase text-[11px] tracking-[0.3em]"
          style={{ background: `linear-gradient(90deg, ${accentColor} 0%, ${accentColor}cc 100%)` }}
        >
          <Radio size={14} className="animate-pulse" />
          <span>Live</span>
        </div>

        {/* Scrolling text — pure CSS animation, GPU-composited */}
        <div className="flex-1 overflow-hidden relative">
          <div
            className="whitespace-nowrap inline-block text-white/95 font-semibold text-[16px] tracking-wide pl-12 uppercase"
            style={{
              animation: `${ANIM_NAME} ${speed}s linear infinite`,
              willChange: "transform",
            }}
          >
            {content}
          </div>
        </div>

        {/* Right fade */}
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-24"
          style={{ background: "linear-gradient(to right, transparent, rgba(10,10,10,0.95))" }}
        />
      </div>
    </div>
  );
}
