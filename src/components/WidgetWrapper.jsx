"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Minimize2, X } from "lucide-react";
import { useDashboard } from "@/context/DashboardContext";
import { isTizen } from "@/lib/tizen";

export default function WidgetWrapper({ widget, mode = "grid", onClick, children, className = "" }) {
  const { clearFocus, toggleFullscreen } = useDashboard();
  const tizen = useRef(false);
  useEffect(() => { tizen.current = isTizen(); }, []);
  const clickable = mode === "grid" && widget.focusable;

  /* ── Focus : plein écran sans chrome (bouton fullscreen géré en admin) ── */
  if (mode === "focus") {
    return (
      <div className="relative h-full w-full overflow-hidden bg-bg">
        <div className="h-full w-full">
          {typeof children === "function" ? children({ mode }) : children}
        </div>
      </div>
    );
  }

  /* ── Fullscreen & Preview ── */
  if (mode === "fullscreen" || mode === "preview") {
    return (
      <div className={`${mode === "preview" ? "absolute inset-0" : "fixed inset-0 z-50"} bg-surface flex flex-col overflow-hidden`}>
        {mode === "fullscreen" && (
          <div className="flex items-center justify-end px-5 pt-4 pb-0 shrink-0 gap-0.5">
            <button
              onClick={e => { e.stopPropagation(); toggleFullscreen(widget.id); }}
              className="rounded-md p-1.5 text-sub hover:text-text hover:bg-elevated transition-colors"
            >
              <Minimize2 size={15} />
            </button>
            <button
              onClick={e => { e.stopPropagation(); clearFocus(); }}
              className="rounded-md p-1.5 text-sub hover:text-text hover:bg-elevated transition-colors"
            >
              <X size={15} />
            </button>
          </div>
        )}
        <div className="flex-1 min-h-0 overflow-auto p-14">
          {typeof children === "function" ? children({ mode: "fullscreen" }) : children}
        </div>
      </div>
    );
  }

  /* ── Grid ── */
  // Sur Tizen on désactive layoutId (animations de layout très coûteuses)
  const motionProps = tizen.current
    ? { onClick: clickable ? onClick : undefined }
    : { layoutId: `widget-${widget.id}`, onClick: clickable ? onClick : undefined, transition: { type: "spring", stiffness: 280, damping: 30, mass: 0.9 } };

  return (
    <motion.div
      {...motionProps}
      className={[
        "relative flex flex-col overflow-hidden h-full",
        "bg-surface rounded-2xl",
        "border border-border cursor-pointer group hover:border-violet/60 transition-colors duration-200",
        className,
      ].join(" ")}
    >
      <div className="flex items-center justify-between px-5 pt-4 pb-0 shrink-0">
        <div className="flex items-center gap-2">
          <span className="block h-1.5 w-1.5 rounded-full bg-violet shrink-0" />
          <span className="text-[13px] font-semibold uppercase tracking-[0.2em] text-sub">
            {widget.title}
          </span>
        </div>
        <span className="text-[10px] uppercase tracking-widest text-violet/0 group-hover:text-violet/60 transition-colors">
          ↗
        </span>
      </div>
      <div className="flex-1 min-h-0 overflow-auto px-5 pt-3 pb-5">
        {typeof children === "function" ? children({ mode }) : children}
      </div>
    </motion.div>
  );
}
