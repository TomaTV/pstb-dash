"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";

export default function BreakingNews({ breaking }) {
  const active = breaking?.active;
  const message = (breaking?.message || "").trim();
  const title = (breaking?.title || "Breaking News").trim();
  const accent = breaking?.accent || "red";

  const accentColor = accent === "violet" ? "#651FFF"
    : accent === "amber" ? "#F59E0B"
    : accent === "emerald" ? "#10B981"
    : "#FF1744";

  return (
    <AnimatePresence>
      {active && message && (
        <motion.div
          key="breaking"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.92)" }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at center, ${accentColor}22 0%, transparent 70%)`,
            }}
          />

          <motion.div
            initial={{ scale: 0.96, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 max-w-5xl px-16 text-center"
          >
            <div className="flex items-center justify-center gap-4 mb-10">
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                className="w-3 h-3 rounded-full"
                style={{ background: accentColor, boxShadow: `0 0 24px ${accentColor}` }}
              />
              <span
                className="text-sm font-black uppercase tracking-[0.5em]"
                style={{ color: accentColor }}
              >
                <AlertTriangle size={16} className="inline mr-3 -mt-0.5" />
                {title}
              </span>
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: 0.6 }}
                className="w-3 h-3 rounded-full"
                style={{ background: accentColor, boxShadow: `0 0 24px ${accentColor}` }}
              />
            </div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="text-white font-black leading-[1.05] tracking-tight"
              style={{ fontSize: "clamp(3rem, 7vw, 6.5rem)" }}
            >
              {message}
            </motion.h1>

            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mt-12 mx-auto h-1 rounded-full"
              style={{ background: accentColor, maxWidth: 200, transformOrigin: "center" }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
