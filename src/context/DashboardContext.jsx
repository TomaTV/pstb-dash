"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { DEFAULT_WIDGETS } from "@/lib/widgets";

const STORAGE_KEY    = "pstb:widgets:v2";
const SETTINGS_KEY   = "pstb:settings:v1";

const DEFAULT_SETTINGS = {
  autoRotate: true,
  rotateInterval: 15, // secondes — Perplexity: 12-18s pour bloc titre + contenu
};

const DashboardContext = createContext(null);

export function DashboardProvider({ children }) {
  const [widgets,     setWidgets]     = useState(DEFAULT_WIDGETS);
  const [settings,    setSettings]    = useState(DEFAULT_SETTINGS);
  const [focusedId,   setFocusedId]   = useState(null);
  const [fullscreenId,setFullscreenId]= useState(null);
  const [hydrated,    setHydrated]    = useState(false);

  // ── Hydratation localStorage ──
  useEffect(() => {
    try {
      const rawW = localStorage.getItem(STORAGE_KEY);
      if (rawW) {
        const p = JSON.parse(rawW);
        if (Array.isArray(p) && p.length > 0) setWidgets(p);
      }
      const rawS = localStorage.getItem(SETTINGS_KEY);
      if (rawS) setSettings(s => ({ ...s, ...JSON.parse(rawS) }));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets)); } catch {}
  }, [widgets, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch {}
  }, [settings, hydrated]);

  // ── Focus / Fullscreen ──
  const focusWidget = useCallback((id) => {
    setFocusedId(prev => prev === id ? null : id);
    setFullscreenId(null);
  }, []);

  const clearFocus = useCallback(() => {
    setFocusedId(null);
    setFullscreenId(null);
  }, []);

  const toggleFullscreen = useCallback((id) => {
    setFullscreenId(prev => prev === id ? null : id);
  }, []);

  // ── CRUD widgets ──
  const updateWidget = useCallback((id, patch) => {
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, ...patch } : w));
  }, []);

  const updateWidgetData = useCallback((id, dataPatch) => {
    setWidgets(prev =>
      prev.map(w => w.id === id ? { ...w, data: { ...w.data, ...dataPatch } } : w),
    );
  }, []);

  const swapWidgets = useCallback((idA, idB) => {
    setWidgets(prev => {
      const a = prev.findIndex(w => w.id === idA);
      const b = prev.findIndex(w => w.id === idB);
      if (a < 0 || b < 0 || a === b) return prev;
      const next = prev.slice();
      [next[a], next[b]] = [next[b], next[a]];
      return next;
    });
  }, []);

  const resetWidgets = useCallback(() => setWidgets(DEFAULT_WIDGETS), []);

  // ── Settings ──
  const updateSettings = useCallback((patch) => {
    setSettings(s => ({ ...s, ...patch }));
  }, []);

  // ── Dérivés ──
  const focusableWidgets = useMemo(
    () => widgets.filter(w => w.focusable),
    [widgets],
  );

  const focusedWidget = useMemo(
    () => widgets.find(w => w.id === focusedId) ?? null,
    [widgets, focusedId],
  );

  const fullscreenWidget = useMemo(
    () => widgets.find(w => w.id === fullscreenId) ?? null,
    [widgets, fullscreenId],
  );

  const value = useMemo(() => ({
    widgets,
    settings,
    focusedId,
    fullscreenId,
    focusedWidget,
    fullscreenWidget,
    focusableWidgets,
    focusWidget,
    clearFocus,
    toggleFullscreen,
    updateWidget,
    updateWidgetData,
    swapWidgets,
    resetWidgets,
    updateSettings,
  }), [
    widgets, settings, focusedId, fullscreenId,
    focusedWidget, fullscreenWidget, focusableWidgets,
    focusWidget, clearFocus, toggleFullscreen,
    updateWidget, updateWidgetData, swapWidgets, resetWidgets, updateSettings,
  ]);

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used inside <DashboardProvider>");
  return ctx;
}
