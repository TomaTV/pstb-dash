"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
  autoWeek: {
    enabled: false,
    dayWidgetMap: { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] },
    timeRules: [],
    exceptions: [],
  },
  autoContent: {
    enabled: false,
    provider: "groq",
    refreshHour: 6,
    targets: { quote: true, word: true, puzzle: true, wordle: true },
  },
};

const DashboardContext = createContext(null);

function areWidgetsEqual(prev, next) {
  if (prev === next) return true;
  if (!Array.isArray(prev) || !Array.isArray(next)) return false;
  if (prev.length !== next.length) return false;
  for (let i = 0; i < prev.length; i += 1) {
    const a = prev[i];
    const b = next[i];
    if (
      a.id !== b.id ||
      a.type !== b.type ||
      a.title !== b.title ||
      a.status !== b.status ||
      a.focusable !== b.focusable ||
      a.duration !== b.duration ||
      JSON.stringify(a.data) !== JSON.stringify(b.data)
    ) {
      return false;
    }
  }
  return true;
}

function areSettingsEqual(prev, next) {
  if (prev === next) return true;
  if (!prev || !next) return false;
  return JSON.stringify(prev) === JSON.stringify(next);
}

function isTimeInRange(nowMinutes, start, end) {
  if (!start || !end) return true;
  const [sh, sm] = String(start).split(":").map(Number);
  const [eh, em] = String(end).split(":").map(Number);
  if (![sh, sm, eh, em].every(Number.isFinite)) return true;
  const startM = sh * 60 + sm;
  const endM = eh * 60 + em;
  if (startM === endM) return true;
  if (startM < endM) return nowMinutes >= startM && nowMinutes < endM;
  return nowMinutes >= startM || nowMinutes < endM; // overnight
}

export function DashboardProvider({ children }) {
  const pathname = usePathname();
  const reconnectTimerRef = useRef(null);
  const reconnectDelayRef = useRef(3000);
  const sseErrorCountRef = useRef(0);
  const pollingTimerRef = useRef(null);
  const usingPollingRef = useRef(false);
  const [widgets,     setWidgets]     = useState(DEFAULT_WIDGETS);
  const [settings,    setSettings]    = useState(DEFAULT_SETTINGS);
  const [focusedId,   setFocusedId]   = useState(null);
  const [fullscreenId,setFullscreenId]= useState(null);
  const [hydrated,    setHydrated]    = useState(false);

  const [activeScreenId, setActiveScreenId] = useState("main");
  const fullDbRef = useRef({});
  const hydratedRef = useRef(false);
  const pendingSaveRef = useRef(null);

  // Parse URL ?screen= param on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const s = params.get("screen");
      if (s) setActiveScreenId(s);
    }
  }, []);

  // ── API Sync (JSON Local DB) ──
  const saveToDB = useCallback(async (newWidgets, newSettings, screenId = activeScreenId) => {
    if (!hydratedRef.current) {
      // Mettre en queue jusqu'à ce que la donnée initiale soit chargée
      pendingSaveRef.current = { widgets: newWidgets, settings: newSettings, screenId };
      return;
    }
    try {
      await fetch("/api/dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ widgets: newWidgets, settings: newSettings, screenId })
      });
    } catch (e) {
      console.error("Dashboard save error:", e);
    }
  }, [activeScreenId]);

  // Sync state whenever activeScreenId changes
  useEffect(() => {
    const db = fullDbRef.current;
    if (!db || Object.keys(db).length === 0) return;
    
    const wKey = activeScreenId === "main" ? "widgets" : `widgets_${activeScreenId}`;
    const sKey = activeScreenId === "main" ? "settings" : `settings_${activeScreenId}`;
    
    setWidgets(prev => areWidgetsEqual(prev, db[wKey] || DEFAULT_WIDGETS) ? prev : (db[wKey] || DEFAULT_WIDGETS));
    setSettings(prev => areSettingsEqual(prev, db[sKey] || DEFAULT_SETTINGS) ? prev : (db[sKey] || DEFAULT_SETTINGS));
  }, [activeScreenId]);

  useEffect(() => {
    if (pathname === "/admin/login") {
      hydratedRef.current = true;
      setHydrated(true);
      return;
    }

    let isMounted = true;
    let eventSource = null;

    const clearReconnectTimer = () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    const applyDb = (db) => {
      if (!isMounted) return;
      fullDbRef.current = db;
      const wKey = activeScreenId === "main" ? "widgets" : `widgets_${activeScreenId}`;
      const sKey = activeScreenId === "main" ? "settings" : `settings_${activeScreenId}`;
      if (Array.isArray(db[wKey]) || Array.isArray(db.widgets)) {
        setWidgets(prev => (areWidgetsEqual(prev, db[wKey] || DEFAULT_WIDGETS) ? prev : (db[wKey] || DEFAULT_WIDGETS)));
      }
      if (db[sKey] || db.settings) {
        setSettings(prev => (areSettingsEqual(prev, db[sKey] || DEFAULT_SETTINGS) ? prev : (db[sKey] || DEFAULT_SETTINGS)));
      }
      hydratedRef.current = true;
      setHydrated(true);
      if (pendingSaveRef.current) {
        const p = pendingSaveRef.current;
        pendingSaveRef.current = null;
        fetch("/api/dashboard", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(p) }).catch(() => {});
      }
    };

    const startPolling = () => {
      if (usingPollingRef.current) return;
      usingPollingRef.current = true;
      const poll = () => {
        if (!isMounted) return;
        fetch("/api/dashboard")
          .then(r => r.ok ? r.json() : null)
          .then(db => { if (db) applyDb(db); })
          .catch(() => {})
          .finally(() => { if (isMounted) pollingTimerRef.current = setTimeout(poll, 5000); });
      };
      poll();
    };

    const connectSSE = () => {
      if (usingPollingRef.current) return;
      clearReconnectTimer();
      // Tizen / vieux navigateurs peuvent ne pas supporter EventSource
      if (typeof EventSource === "undefined") { startPolling(); return; }
      eventSource = new EventSource("/api/stream");
      eventSource.onopen = () => {
        reconnectDelayRef.current = 3000;
        sseErrorCountRef.current = 0;
      };

      eventSource.onmessage = (event) => {
        try {
          applyDb(JSON.parse(event.data));
        } catch (e) {
          console.error("SSE parse error", e);
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        if (!isMounted) return;
        sseErrorCountRef.current += 1;
        // Après 2 échecs consécutifs, basculer en polling (ex : Tizen)
        if (sseErrorCountRef.current >= 2) {
          console.warn("SSE unavailable, switching to polling");
          startPolling();
          return;
        }
        const jitter = Math.floor(Math.random() * 1000);
        reconnectTimerRef.current = setTimeout(connectSSE, reconnectDelayRef.current + jitter);
        reconnectDelayRef.current = Math.min(reconnectDelayRef.current * 2, 30000);
      };
    };

    connectSSE();

    return () => {
      isMounted = false;
      clearReconnectTimer();
      if (eventSource) eventSource.close();
      if (pollingTimerRef.current) { clearTimeout(pollingTimerRef.current); pollingTimerRef.current = null; }
      usingPollingRef.current = false;
    };
  }, [pathname, activeScreenId]);

  useEffect(() => {
    if (!settings?.autoContent?.enabled) return;
    const today = new Date().toISOString().slice(0, 10);
    const doneKey = `pstb:auto-content:${today}`;
    if (typeof window !== "undefined" && window.localStorage.getItem(doneKey)) return;
    fetch("/api/automation/content", { method: "POST" })
      .then(() => {
        if (typeof window !== "undefined") window.localStorage.setItem(doneKey, "1");
      })
      .catch(() => {});
  }, [settings?.autoContent?.enabled, settings?.autoContent?.refreshHour]);

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
      id: `${type}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
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
    return newWidget.id;
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
  const focusableWidgets = useMemo(() => {
    const now = new Date();
    const dow = now.getDay();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const todayStr = now.toISOString().slice(0, 10);
    const autoWeek = settings?.autoWeek;

    // Check calendar exceptions first
    const exceptions = autoWeek?.exceptions || [];
    const todayException = exceptions.find(e => e.date === todayStr);
    if (todayException && autoWeek?.enabled) {
      if (todayException.type === "holiday") {
        return []; // No widgets on holidays
      }
      if (todayException.type === "event" && Array.isArray(todayException.widgetIds) && todayException.widgetIds.length > 0) {
        return widgets.filter(w => w.focusable && w.status !== "pending" && todayException.widgetIds.includes(w.id));
      }
    }

    // rawDayIds = null means "not configured for this day" → no filter
    // rawDayIds = [] means "explicitly configured to 0 widgets" → block all
    const rawDayIds = autoWeek?.dayWidgetMap?.[dow];
    const dayAllowedIds = Array.isArray(rawDayIds) ? rawDayIds : null;
    const hasDayConfig = autoWeek?.enabled && dayAllowedIds !== null;

    return widgets.filter((w) => {
      if (!w.focusable || w.status === "pending" || (w.expiresAt && w.expiresAt <= now.getTime())) return false;
      if (!autoWeek?.enabled) return true;

      // If the day is configured: empty array = block all; non-empty = filter to allowed IDs
      if (hasDayConfig && !dayAllowedIds.includes(w.id)) return false;

      const rules = (autoWeek.timeRules || []).filter(
        (r) => r?.enabled !== false && r?.widgetId === w.id && Array.isArray(r.days) && r.days.includes(dow)
      );
      if (!rules.length) return true;
      return rules.some((r) => isTimeInRange(nowMinutes, r.start, r.end));
    });
  }, [widgets, settings]);

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
    activeScreenId,
    setActiveScreenId,
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
    widgets, settings, activeScreenId, focusedId, fullscreenId,
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
