"use client";

import { AnimatePresence, motion, useMotionValue, useTransform, animate } from "framer-motion";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { useDashboard } from "@/context/DashboardContext";
import { renderWidget } from "@/components/widgets";

export default function Dashboard() {
  const { widgets, focusedWidget, fullscreenWidget } = useDashboard();

  return (
    <div className="fixed inset-0 flex bg-bg">

      {/* Colonne gauche — safe zone: padding 48px bord extérieur */}
      <aside className="flex flex-col gap-4 shrink-0"
        style={{ width: 380, padding: "48px 12px 48px 48px" }}>
        {widgets.slice(0, 2).map(w => {
          const elevated = focusedWidget?.id === w.id || fullscreenWidget?.id === w.id;
          return (
            <div key={w.id} className="flex-1 min-h-0">
              {elevated ? <SlotGhost /> : renderWidget(w, "grid")}
            </div>
          );
        })}
      </aside>

      {/* Centre */}
      <div className="flex-1 flex flex-col min-w-0" style={{ padding: "48px 12px" }}>
        <FocusZone />
      </div>

      {/* Colonne droite — safe zone */}
      <aside className="flex flex-col gap-4 shrink-0"
        style={{ width: 380, padding: "48px 48px 48px 12px" }}>
        {widgets.slice(2, 4).map(w => {
          const elevated = focusedWidget?.id === w.id || fullscreenWidget?.id === w.id;
          return (
            <div key={w.id} className="flex-1 min-h-0">
              {elevated ? <SlotGhost /> : renderWidget(w, "grid")}
            </div>
          );
        })}
      </aside>

      {/* Watermark — dans la safe zone */}
      <div className="fixed bottom-12 right-14 pointer-events-none z-10">
        <Image src="/Logo.svg" alt="PST&B" width={72} height={32} className="opacity-[0.15]" />
      </div>

      {/* Fullscreen */}
      <AnimatePresence>
        {fullscreenWidget && (
          <motion.div
            key="fs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-bg"
          >
            {renderWidget(fullscreenWidget, "fullscreen")}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Focus Zone avec auto-rotation ── */
function FocusZone() {
  const {
    widgets, settings,
    focusedId, focusedWidget,
    focusWidget, clearFocus,
    focusableWidgets,
  } = useDashboard();

  const { autoRotate, rotateInterval } = settings;
  const progress = useMotionValue(0);
  const timerRef = useRef(null);
  const startRef = useRef(null);
  const indexRef = useRef(0);

  // ── Auto-rotation ──
  useEffect(() => {
    if (!autoRotate || focusableWidgets.length === 0) {
      progress.set(0);
      clearInterval(timerRef.current);
      return;
    }

    const ms = rotateInterval * 1000;

    const tick = () => {
      indexRef.current = (indexRef.current + 1) % focusableWidgets.length;
      focusWidget(focusableWidgets[indexRef.current].id);
    };

    // Initialise sur le premier widget focusable
    if (!focusedId) {
      focusWidget(focusableWidgets[0].id);
      indexRef.current = 0;
    } else {
      const idx = focusableWidgets.findIndex(w => w.id === focusedId);
      if (idx >= 0) indexRef.current = idx;
    }

    // Progress bar animation
    progress.set(0);
    const anim = animate(progress, 1, { duration: rotateInterval, ease: "linear" });

    timerRef.current = setInterval(() => {
      tick();
      progress.set(0);
      animate(progress, 1, { duration: rotateInterval, ease: "linear" });
    }, ms);

    return () => {
      clearInterval(timerRef.current);
      anim.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRotate, rotateInterval, focusableWidgets.length]);

  const barWidth = useTransform(progress, [0, 1], ["0%", "100%"]);

  return (
    <div className="h-full flex flex-col relative">
      <AnimatePresence mode="wait">
        {focusedWidget ? (
          <motion.div
            key={focusedWidget.id}
            className="flex-1 min-h-0"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
          >
            {renderWidget(focusedWidget, "focus")}
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center rounded-2xl border border-dashed"
            style={{ borderColor: "#2C2C2C" }}
          >
            <div className="relative flex items-center justify-center mb-10">
              <div className="absolute rounded-full border border-dashed animate-[spin_22s_linear_infinite]"
                style={{ width: 160, height: 160, borderColor: "#2C2C2C" }} />
              <div className="absolute rounded-full border border-dashed animate-[spin_13s_linear_infinite_reverse]"
                style={{ width: 96, height: 96, borderColor: "#333" }} />
              <div className="h-3 w-3 rounded-full bg-violet" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sub">Focus Zone</p>
            <h2 className="mt-3 text-4xl font-bold text-text">Sélectionnez un widget</h2>
            <p className="mt-3 text-lg text-sub max-w-sm text-center leading-relaxed">
              Cliquez sur l'un des widgets pour afficher le détail.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Barre de progression auto-rotation */}
      {autoRotate && focusedWidget && (
        <div className="mt-3 shrink-0">
          {/* Dots de navigation */}
          <div className="flex items-center justify-center gap-2 mb-2">
            {focusableWidgets.map((w, i) => (
              <button
                key={w.id}
                onClick={() => {
                  indexRef.current = i;
                  focusWidget(w.id);
                  progress.set(0);
                  animate(progress, 1, { duration: rotateInterval, ease: "linear" });
                  clearInterval(timerRef.current);
                  timerRef.current = setInterval(() => {
                    indexRef.current = (indexRef.current + 1) % focusableWidgets.length;
                    focusWidget(focusableWidgets[indexRef.current].id);
                    progress.set(0);
                    animate(progress, 1, { duration: rotateInterval, ease: "linear" });
                  }, rotateInterval * 1000);
                }}
                className={`rounded-full transition-all duration-300 ${
                  focusedWidget.id === w.id
                    ? "w-5 h-1.5 bg-violet"
                    : "w-1.5 h-1.5 bg-muted hover:bg-sub"
                }`}
              />
            ))}
          </div>
          {/* Barre de progression */}
          <div className="h-px w-full bg-elevated rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-violet rounded-full"
              style={{ width: barWidth }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function SlotGhost() {
  return (
    <div className="h-full min-h-[120px] rounded-2xl border border-dashed" style={{ borderColor: "#222" }} />
  );
}
