"use client";

import { AnimatePresence, motion, useMotionValue, useTransform, animate } from "framer-motion";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useDashboard } from "@/context/DashboardContext";
import { renderWidget } from "@/components/widgets";
import LiveTicker from "@/components/LiveTicker";
import BreakingNews from "@/components/BreakingNews";
import { Calendar, BarChart3, Clock, Newspaper, Sparkles, FileText, Quote as QuoteIcon } from "lucide-react";

const WIDGET_META = {
  "next-event": { icon: Calendar, tone: "from-violet/20 to-violet/5", label: "Événement" },
  poll: { icon: BarChart3, tone: "from-pink-500/20 to-pink-500/5", label: "Sondage" },
  clock: { icon: Clock, tone: "from-blue-500/20 to-blue-500/5", label: "Horloge" },
  rss: { icon: Newspaper, tone: "from-amber-500/20 to-amber-500/5", label: "Actualités" },
  showcase: { icon: Sparkles, tone: "from-violet/25 to-fuchsia-500/10", label: "Visuel" },
  iframe: { icon: FileText, tone: "from-emerald-500/20 to-emerald-500/5", label: "Document" },
  quote: { icon: QuoteIcon, tone: "from-fuchsia-500/20 to-violet/10", label: "Citation" },
  crypto: { icon: BarChart3, tone: "from-amber-500/20 to-amber-500/5", label: "Crypto" },
  countdown: { icon: Clock, tone: "from-violet/20 to-violet/5", label: "Countdown" },
  "github-trending": { icon: Sparkles, tone: "from-amber-500/20 to-violet/5", label: "GitHub" },
  hub: { icon: Sparkles, tone: "from-violet/25 to-pink-500/10", label: "Hub" },
};

/* ── Horloge persistante bas-gauche ── */
function PersistentClock() {
  const [now, setNow] = useState(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const time = now
    ? now.toLocaleTimeString("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit" })
    : "--:--";
  const secs = now
    ? now.toLocaleTimeString("fr-FR", { timeZone: "Europe/Paris", second: "2-digit" })
    : "--";
  const dateStr = now 
    ? now.toLocaleDateString("fr-FR", { timeZone: "Europe/Paris", weekday: "long", day: "numeric", month: "long" })
    : "---";

  return (
    <div className="flex flex-col items-end select-none drop-shadow-xl">
      <div className="flex items-baseline gap-1.5 tabular-nums font-mono">
        <span className="text-3xl font-black text-white">{time}</span>
        <span className="text-lg font-bold text-violet">{secs}</span>
      </div>
      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60 mt-0.5">
        {dateStr}
      </div>
    </div>
  );
}

/* ── Preview scalée — div, jamais button (pas de nesting HTML invalide) ── */
function WidgetPreview({ widget, width = 218 }) {
  const W = 1280;
  const SCALE = width / W;
  const H = Math.round((width / 16) * 9 / SCALE); // ratio 16:9
  return (
    <div className="relative overflow-hidden" style={{ width, height: Math.round(width * 9 / 16) }}>
      <div
        style={{
          transform: `scale(${SCALE})`,
          transformOrigin: "top left",
          width: W,
          height: H,
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        {renderWidget(widget, "focus")}
      </div>
    </div>
  );
}

/* ── Carte satellite (mode Orbite) — preview scalée + meta ── */
function SatelliteCard({ widget, onFocus, isActive = false }) {
  const meta = WIDGET_META[widget.type] ?? WIDGET_META.showcase;
  const Icon = meta.icon;
  return (
    <motion.div
      onClick={onFocus}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === "Enter" && onFocus()}
      className={[
        "rounded-2xl overflow-hidden border cursor-pointer group transition-all relative flex flex-col",
        isActive
          ? "border-violet/70 shadow-[0_0_0_1px_rgba(101,31,255,0.5),0_12px_40px_-8px_rgba(101,31,255,0.55)]"
          : "border-white/8 hover:border-violet/35",
      ].join(" ")}
      whileHover={{ scale: 1.015, y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.18 }}
      layout
    >
      {/* Mini preview scalée du widget */}
      <div className="relative bg-bg overflow-hidden">
        <WidgetPreview widget={widget} width={300} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />
        <span className="absolute top-2 left-3 inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-white/80">
          <Icon size={10} strokeWidth={2} />
          {meta.label}
        </span>
        {isActive && (
          <span className="absolute top-2 right-3 flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.2em] text-violet bg-violet/15 px-2 py-0.5 rounded-full backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-violet animate-pulse" />
            En cours
          </span>
        )}
      </div>
      {/* Label */}
      <div className="px-3 py-2 bg-surface/85 backdrop-blur-sm border-t border-white/5">
        <span className="text-[12px] font-semibold text-white/90 group-hover:text-white transition-colors leading-tight line-clamp-1">
          {widget.title}
        </span>
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const { fullscreenWidget, settings } = useDashboard();
  const viewMode = settings.viewMode ?? "scene";

  return (
    <div className="fixed inset-0 bg-bg text-text overflow-hidden">
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 20% 110%, rgba(101,31,255,0.18) 0%, transparent 60%), radial-gradient(ellipse 80% 50% at 80% 110%, rgba(255,23,68,0.12) 0%, transparent 60%)",
        }}
      />
      <div className="absolute inset-0 z-10">
        <FocusZone viewMode={viewMode} />
      </div>
      <AnimatePresence>
        {fullscreenWidget && (
          <motion.div
            key="fs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 bg-bg"
          >
            {renderWidget(fullscreenWidget, "fullscreen")}
          </motion.div>
        )}
      </AnimatePresence>
      <LiveTicker ticker={settings.ticker} />
      <BreakingNews breaking={settings.breaking} />
    </div>
  );
}

/* ══════════════════════════════════════════
   FocusZone
══════════════════════════════════════════ */
function FocusZone({ viewMode }) {
  const {
    focusedWidget, focusableWidgets,
    focusedId, focusWidget, settings, widgets
  } = useDashboard();
  const tickerBottom = settings?.ticker?.enabled && (settings?.ticker?.position ?? "bottom") === "bottom";
  const tickerTop = settings?.ticker?.enabled && settings?.ticker?.position === "top";
  const bottomOffset = tickerBottom ? 56 : 24; // 44px ticker + 12px breathing room
  const topOffset = tickerTop ? 56 : 24;

  const { autoRotate, rotateInterval } = settings;
  const progress = useMotionValue(0);
  const timerRef = useRef(null);
  const indexRef = useRef(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setCurrentIndex(indexRef.current);
  }, [focusedId]);

  useEffect(() => {
    const isFocusedValid = focusableWidgets.some(w => w.id === focusedId);

    if (!autoRotate || focusableWidgets.length <= 1) {
      progress.set(0);
      clearTimeout(timerRef.current);
      if (focusableWidgets.length >= 1 && !isFocusedValid) {
        focusWidget(focusableWidgets[0].id);
      } else if (focusableWidgets.length === 0 && focusedId !== null) {
        focusWidget(null);
      }
      return;
    }
    
    if (!isFocusedValid) {
      focusWidget(focusableWidgets[0].id);
      indexRef.current = 0; setCurrentIndex(0);
      return;
    } else {
      const idx = focusableWidgets.findIndex(w => w.id === focusedId);
      if (idx >= 0) { indexRef.current = idx; setCurrentIndex(idx); }
    }

    const currentWidget = focusableWidgets[indexRef.current];
    let durationSec = rotateInterval;
    
    if (currentWidget) {
      if (currentWidget.duration) {
        durationSec = currentWidget.duration;
      } else {
        // Smart defaults based on widget type (best practices)
        switch (currentWidget.type) {
          case "quote":
          case "word":
            durationSec = 6; break;
          case "showcase":
          case "image":
          case "news":
          case "business":
          case "spo":
          case "iframe":
          case "gallery":
          case "transport":
          case "social":
            durationSec = 10; break;
          case "poll":
          case "jobs":
          case "student":
            durationSec = 18; break;
          case "wordle":
            durationSec = 22; break;
        }
      }
    }

    const ms = durationSec * 1000;
    const advance = () => {
      indexRef.current = (indexRef.current + 1) % focusableWidgets.length;
      setCurrentIndex(indexRef.current);
      focusWidget(focusableWidgets[indexRef.current].id);
      setTick(t => t + 1);
    };

    progress.set(0);
    const anim = animate(progress, 1, { duration: durationSec, ease: "linear" });
    
    timerRef.current = setTimeout(() => {
      advance();
    }, ms);
    
    return () => { clearTimeout(timerRef.current); anim.stop(); };
  }, [autoRotate, rotateInterval, focusableWidgets, focusedId, focusWidget, progress]);

  const barWidth = useTransform(progress, [0, 1], ["0%", "100%"]);
  const n = focusableWidgets.length;
  const nextIndex = (currentIndex + 1) % n;
  const nextWidget = n > 1 ? focusableWidgets[nextIndex] : null;

  /* ── Overlay commun aux deux modes ── */
  const SharedOverlay = (
    <>
      {/* Gradients adaptatifs */}
      {viewMode === "orbit" ? (
        <div
          className="absolute top-0 left-0 right-0 z-20 pointer-events-none transition-all duration-500"
          style={{
            background: "linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, transparent 100%)",
            height: 120,
          }}
        />
      ) : (
        <>
          {/* Gradient bas-gauche → Logo lisible */}
          <div
            className="absolute left-0 z-20 pointer-events-none transition-all duration-500"
            style={{
              bottom: tickerBottom ? 44 : 0,
              width: 380,
              height: 150,
              background: "radial-gradient(ellipse at 0% 100%, rgba(0,0,0,0.85) 0%, transparent 70%)",
            }}
          />
          {/* Gradient bas-droite → Horloge lisible */}
          <div
            className="absolute right-0 z-20 pointer-events-none transition-all duration-500"
            style={{
              bottom: tickerBottom ? 44 : 0,
              width: 380,
              height: 150,
              background: "radial-gradient(ellipse at 100% 100%, rgba(0,0,0,0.85) 0%, transparent 70%)",
            }}
          />
        </>
      )}

      {/* Header/Logo (Bas-gauche en Scene, Haut-gauche en Orbit) */}
      <div className={`absolute z-30 flex items-center pointer-events-none transition-all duration-500
        ${viewMode === 'orbit' ? 'left-6 scale-90 origin-top-left' : 'left-8'}`}
        style={viewMode === 'orbit' ? { top: topOffset } : { bottom: bottomOffset }}>
        <div className="flex items-center gap-3 pointer-events-auto drop-shadow-xl">
          <Image
            src="/Logo.svg"
            alt="PST&B"
            width={100}
            height={40}
            className="opacity-75"
          />
          <div className="h-4 w-px bg-white/15" />
          <span className="text-[10px] font-semibold tracking-[0.3em] uppercase text-white/35">
            Campus Paris
          </span>
        </div>
      </div>

      {/* Horloge (Bas-droite en Scene, Haut-droite en Orbit) */}
      <div className={`absolute z-30 pointer-events-none transition-all duration-500
        ${viewMode === 'orbit' ? 'right-6 scale-90 origin-top-right' : 'right-8'}`}
        style={viewMode === 'orbit' ? { top: topOffset } : { bottom: bottomOffset }}>
        <PersistentClock />
      </div>
      {/* Progress bar */}
      {autoRotate && focusableWidgets.length > 1 && (
        <div
          className="absolute left-0 right-0 h-[3px] bg-white/5 z-30 overflow-hidden backdrop-blur-sm"
          style={{ bottom: tickerBottom ? 44 : 0 }}
        >
          <motion.div
            className="h-full rounded-r-full"
            style={{
              width: barWidth,
              background: "#FF1744",
              boxShadow: "0 0 12px rgba(255,23,68,0.6)"
            }}
          />
        </div>
      )}
    </>
  );

  /* ══════════════════
     MODE SCÈNE
  ══════════════════ */
  if (viewMode === "scene") {
    // We pass --safe-bottom so widgets can apply internal padding at the bottom 
    // to avoid overlapping the logo/clock, without shrinking their background.
    const safeBottom = `${bottomOffset + 80}px`;

    return (
      <div className="absolute inset-0">
        <AnimatePresence mode="wait">
          {focusedWidget ? (
            <motion.div
              key={focusedWidget.id}
              className="absolute left-0 right-0"
              style={{
                top: tickerTop ? 44 : 0,
                bottom: tickerBottom ? 44 : 0,
                "--safe-bottom": safeBottom,
              }}
              initial={{ opacity: 0, filter: "blur(16px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, filter: "blur(10px)", transition: { duration: 0.18 } }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              {renderWidget(focusedWidget, "focus")}
            </motion.div>
          ) : (
            <motion.div 
              key="empty-scene"
              className="absolute inset-0 flex flex-col items-center justify-center"
              style={{ top: tickerTop ? 44 : 0, bottom: tickerBottom ? 44 : 0 }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="flex flex-col items-center gap-6">
                <div className="w-32 h-32 rounded-full bg-white/[0.015] border border-white/[0.05] flex items-center justify-center relative">
                  <div className="absolute inset-0 rounded-full border border-violet/20 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite]" />
                  <Sparkles size={40} className="text-white/10" strokeWidth={1.5} />
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-black text-white/40 tracking-tight">PST&B Campus Paris</h3>
                  <p className="text-[11px] text-white/20 uppercase tracking-[0.3em] font-bold mt-2">Séquence vide</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Preview "À suivre" — div (jamais button) pour éviter le nesting */}
        <AnimatePresence>
          {nextWidget && (
            <motion.div
              key={nextWidget.id}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === "Enter" && focusWidget(nextWidget.id)}
              className="absolute right-6 z-30 cursor-pointer group"
              style={{ top: tickerTop ? 44 + 8 : 24 }}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 0.88, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              whileHover={{ opacity: 1, scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              onClick={() => focusWidget(nextWidget.id)}
            >
              <div className="border border-dashed border-white/25 group-hover:border-white/45 bg-black/45 backdrop-blur-xl rounded-xl overflow-hidden transition-colors duration-200">
                <div className="opacity-90 group-hover:opacity-100 transition-opacity duration-200">
                  <WidgetPreview widget={nextWidget} />
                </div>
                <div className="px-3 py-2 border-t border-dashed border-white/15 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[8px] font-bold uppercase tracking-[0.25em] text-violet/85">À suivre</p>
                    <p className="text-[11px] font-semibold text-white/85 truncate max-w-[160px]">{nextWidget.title}</p>
                  </div>
                  <span className="text-white/45 text-xs group-hover:text-violet transition-colors">→</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {SharedOverlay}
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════
     MODE ORBITE — gros widget central + 4 satellites configurables
     Chaque slot satellite a son propre pool qui défile avec le tick global.
  ══════════════════════════════════════════════════════ */
  const orbitSlots = settings.orbitSlots?.satellites ?? [[], [], [], []];
  const widgetById = (id) => widgets.find(w => w.id === id);

  const satelliteSlots = [0, 1, 2, 3].map(i => {
    const pool = (orbitSlots[i] ?? []).map(widgetById).filter(Boolean);
    if (pool.length === 0) return null;
    return pool[tick % pool.length];
  });

  // Fallback : si aucun slot configuré, on prend les widgets focusables suivants
  const hasConfig = satelliteSlots.some(s => s !== null);
  const autoSatellites = !hasConfig
    ? focusableWidgets.filter(w => w.id !== focusedId).slice(0, 4)
    : satelliteSlots.filter(Boolean);

  const finalSatellites = hasConfig ? satelliteSlots : autoSatellites;

  return (
    <div className="absolute inset-0">
      <div className="absolute left-0 right-0 flex gap-4 px-6 pb-12"
        style={{ top: tickerTop ? 44 + 36 : 80, bottom: tickerBottom ? 44 + 12 : 48 }}>
        {/* Widget central (gros) */}
        <div className="flex-1 min-w-0 relative">
          <AnimatePresence mode="wait">
            {focusedWidget ? (
              <motion.div
                key={focusedWidget.id}
                className="absolute inset-0 rounded-3xl overflow-hidden border border-white/10 bg-bg shadow-[0_0_80px_-15px_rgba(255,23,68,0.15)] ring-1 ring-white/5"
                initial={{ opacity: 0, scale: 0.95, filter: "blur(15px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)", transition: { duration: 0.3 } }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              >
                {renderWidget(focusedWidget, "focus")}
              </motion.div>
            ) : (
              <motion.div
                key="empty-orbit"
                className="absolute inset-0 rounded-3xl border border-dashed border-white/10 flex flex-col items-center justify-center bg-white/[0.01]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="w-24 h-24 rounded-full bg-white/[0.02] flex items-center justify-center relative mb-6 border border-white/5">
                  <div className="absolute inset-0 rounded-full border border-violet/20 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite]" />
                  <Sparkles size={28} className="text-white/10" strokeWidth={1.5} />
                </div>
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white/30">Aucun widget principal</h3>
              </motion.div>
            )}
          </AnimatePresence>
          {focusedWidget && (
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
              <div className="flex items-center gap-2 bg-black/55 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10">
                <span className="h-1.5 w-1.5 rounded-full bg-violet shrink-0 animate-pulse" />
                <span className="text-[11px] font-semibold tracking-wide text-white/80">{focusedWidget.title}</span>
              </div>
            </div>
          )}
        </div>

        {/* Colonne satellites droite */}
        {finalSatellites.some(Boolean) && (
          <motion.div
            className="w-[320px] shrink-0 flex flex-col gap-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/35 px-1">
              Satellites
            </div>
            <div className="flex-1 flex flex-col gap-3 min-h-0">
              {finalSatellites.map((w, i) => (
                w ? (
                  <SatelliteCard key={`slot-${i}-${w.id}`} widget={w} isActive={false} onFocus={() => focusWidget(w.id)} />
                ) : (
                  <div key={`slot-${i}-empty`} className="flex-1 rounded-2xl border border-dashed border-white/10" />
                )
              ))}
            </div>
          </motion.div>
        )}
      </div>
      {SharedOverlay}
    </div>
  );
}
