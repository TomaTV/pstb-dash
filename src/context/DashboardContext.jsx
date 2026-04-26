"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { DEFAULT_WIDGETS } from "@/lib/widgets";

const STORAGE_KEY    = "pstb:widgets:v3";
const SETTINGS_KEY   = "pstb:settings:v1";

const DEFAULT_SETTINGS = {
  autoRotate: true,
  rotateInterval: 15, // secondes — Perplexity: 12-18s pour bloc titre + contenu
  viewMode: "scene",  // "scene" | "orbit"
};

const DashboardContext = createContext(null);

export function DashboardProvider({ children }) {
  const pathname = usePathname();
  const [widgets,     setWidgets]     = useState(DEFAULT_WIDGETS);
  const [settings,    setSettings]    = useState(DEFAULT_SETTINGS);
  const [focusedId,   setFocusedId]   = useState(null);
  const [fullscreenId,setFullscreenId]= useState(null);
  const [hydrated,    setHydrated]    = useState(false);

  // ── API Sync (JSON Local DB) ──
  const saveToDB = useCallback(async (newWidgets, newSettings) => {
    try {
      await fetch("/api/dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ widgets: newWidgets, settings: newSettings })
      });
    } catch (e) {
      console.error("Dashboard save error:", e);
    }
  }, []);

  useEffect(() => {
    if (pathname === "/admin/login") {
      setHydrated(true);
      return;
    }

    let isMounted = true;
    let eventSource = null;

    const connectSSE = () => {
      eventSource = new EventSource("/api/stream");
      
      eventSource.onmessage = (event) => {
        if (!isMounted) return;
        try {
          const data = JSON.parse(event.data);
          if (Array.isArray(data.widgets)) {
            setWidgets(prev => JSON.stringify(prev) !== JSON.stringify(data.widgets) ? data.widgets : prev);
          }
          if (data.settings) {
            setSettings(prev => JSON.stringify(prev) !== JSON.stringify(data.settings) ? data.settings : prev);
          }
          setHydrated(true);
        } catch (e) {
          console.error("SSE parse error", e);
        }
      };

      eventSource.onerror = (err) => {
        console.error("SSE connection error", err);
        eventSource.close();
        if (isMounted) setTimeout(connectSSE, 3000); // Reconnect after 3s
      };
    };

    connectSSE();

    return () => {
      isMounted = false;
      if (eventSource) eventSource.close();
    };
  }, [pathname]);

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
    setWidgets(prev => {
      const next = prev.map(w => w.id === id ? { ...w, ...patch } : w);
      saveToDB(next, settings);
      return next;
    });
  }, [settings, saveToDB]);

  const updateWidgets = useCallback((updates) => {
    setWidgets(prev => {
      let next = [...prev];
      for (const update of updates) {
        next = next.map(w => w.id === update.id ? { ...w, ...update.patch } : w);
      }
      saveToDB(next, settings);
      return next;
    });
  }, [settings, saveToDB]);

  const updateWidgetData = useCallback((id, dataPatch) => {
    setWidgets(prev => {
      const next = prev.map(w => w.id === id ? { ...w, data: { ...w.data, ...dataPatch } } : w);
      saveToDB(next, settings);
      return next;
    });
  }, [settings, saveToDB]);

  const swapWidgets = useCallback((idA, idB) => {
    setWidgets(prev => {
      const a = prev.findIndex(w => w.id === idA);
      const b = prev.findIndex(w => w.id === idB);
      if (a < 0 || b < 0 || a === b) return prev;
      const next = prev.slice();
      [next[a], next[b]] = [next[b], next[a]];
      saveToDB(next, settings);
      return next;
    });
  }, [settings, saveToDB]);

  const reorderWidgets = useCallback((nextOrderIds) => {
    setWidgets(prev => {
      const map = new Map(prev.map(w => [w.id, w]));
      const next = nextOrderIds.map(id => map.get(id)).filter(Boolean);
      // append any missing (safety)
      for (const w of prev) if (!nextOrderIds.includes(w.id)) next.push(w);
      saveToDB(next, settings);
      return next;
    });
  }, [settings, saveToDB]);

  const resetWidgets = useCallback(() => {
    setWidgets(DEFAULT_WIDGETS);
    saveToDB(DEFAULT_WIDGETS, settings);
  }, [settings, saveToDB]);

  const loadPreset = useCallback((presetKey) => {
    import("../lib/widgets").then(({ PRESETS }) => {
      const preset = PRESETS[presetKey];
      if (preset) {
        // We regenerate IDs to avoid any caching issues
        const newWidgets = preset.widgets.map((w, i) => ({ ...w, id: `w-${presetKey}-${Date.now()}-${i}` }));
        setWidgets(newWidgets);
        setSettings(prev => {
          const nextSettings = { ...prev, ...preset.settings };
          saveToDB(newWidgets, nextSettings);
          return nextSettings;
        });
      }
    });
  }, [saveToDB]);

  const addWidget = useCallback((type, title, data = {}) => {
    const newWidget = {
      id: `${type}-${Date.now()}`,
      type,
      title,
      focusable: true,
      data,
    };
    setWidgets(prev => {
      const next = [...prev, newWidget];
      saveToDB(next, settings);
      return next;
    });
  }, [settings, saveToDB]);

  const deleteWidget = useCallback((id) => {
    setWidgets(prev => {
      const next = prev.filter(w => w.id !== id);
      saveToDB(next, settings);
      return next;
    });
    setFocusedId(prev => prev === id ? null : prev);
    setFullscreenId(prev => prev === id ? null : prev);
  }, [settings, saveToDB]);

  // ── Settings ──
  const updateSettings = useCallback((patch) => {
    setSettings(s => {
      const next = { ...s, ...patch };
      saveToDB(widgets, next);
      return next;
    });
  }, [widgets, saveToDB]);

  // ── Dérivés ──
  const focusableWidgets = useMemo(
    () => widgets.filter(w => w.focusable && w.status !== "pending" && (!w.expiresAt || w.expiresAt > Date.now())),
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
    updateWidgets,
    updateWidgetData,
    swapWidgets,
    reorderWidgets,
    resetWidgets,
    loadPreset,
    updateSettings,
    addWidget,
    deleteWidget,
  }), [
    widgets, settings, focusedId, fullscreenId,
    focusedWidget, fullscreenWidget, focusableWidgets,
    focusWidget, clearFocus, toggleFullscreen,
    updateWidget, updateWidgets, updateWidgetData, swapWidgets, reorderWidgets, resetWidgets, loadPreset, updateSettings,
    addWidget, deleteWidget,
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
