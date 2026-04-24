"use client";

import { motion } from "framer-motion";
import { Maximize2, Minimize2, X } from "lucide-react";
import { useDashboard } from "@/context/DashboardContext";

export default function WidgetWrapper({ widget, mode = "grid", onClick, children, className = "" }) {
  const { clearFocus, toggleFullscreen } = useDashboard();
  const clickable = mode === "grid" && widget.focusable;

  return (
    <motion.div
      layoutId={`widget-${widget.id}`}
      onClick={clickable ? onClick : undefined}
      transition={{ type: "spring", stiffness: 280, damping: 30, mass: 0.9 }}
      className={[
        "relative flex flex-col overflow-hidden h-full",
        "bg-surface rounded-2xl",
        mode === "grid"
          ? "border border-border cursor-pointer group hover:border-violet/60 transition-colors duration-200"
          : "border border-border",
        mode === "fullscreen" ? "fixed inset-0 z-50 rounded-none border-0" : "",
        className,
      ].join(" ")}
    >
      {/* Label — petit, discret, en haut */}
      <motion.div
        layout="position"
        className="flex items-center justify-between px-5 pt-4 pb-0 shrink-0"
      >
        <div className="flex items-center gap-2">
          <span className="block h-1.5 w-1.5 rounded-full bg-violet shrink-0" />
          <span className="text-[13px] font-semibold uppercase tracking-[0.2em] text-sub">
            {widget.title}
          </span>
        </div>

        {mode !== "grid" ? (
          <div className="flex items-center gap-0.5">
            <button
              onClick={e => { e.stopPropagation(); toggleFullscreen(widget.id); }}
              className="rounded-md p-1.5 text-sub hover:text-text hover:bg-elevated transition-colors"
            >
              {mode === "fullscreen" ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>
            <button
              onClick={e => { e.stopPropagation(); clearFocus(); }}
              className="rounded-md p-1.5 text-sub hover:text-text hover:bg-elevated transition-colors"
            >
              <X size={15} />
            </button>
          </div>
        ) : (
          /* Indicateur hover discret */
          <span className="text-[10px] uppercase tracking-widest text-violet/0 group-hover:text-violet/60 transition-colors">
            ↗
          </span>
        )}
      </motion.div>

      {/* Contenu */}
      <motion.div
        layout="position"
        className={[
          "flex-1 min-h-0 overflow-auto",
          mode === "grid"       ? "px-5 pt-3 pb-5" : "",
          mode === "focus"      ? "p-8"             : "",
          mode === "fullscreen" ? "p-14"            : "",
        ].join(" ")}
      >
        {typeof children === "function" ? children({ mode }) : children}
      </motion.div>
    </motion.div>
  );
}
