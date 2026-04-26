"use client";

import { useEffect, useMemo, useState } from "react";
import WidgetWrapper from "@/components/WidgetWrapper";
import { useDashboard } from "@/context/DashboardContext";
import {
  Sun, Cloud, CloudRain, CloudSnow, CloudLightning, CloudDrizzle, CloudFog,
  Calendar, Clock as ClockIcon, MapPin, Sparkles,
} from "lucide-react";

const CODE_MAP = {
  0: { label: "Ciel clair", Icon: Sun },
  1: { label: "Peu nuageux", Icon: Sun },
  2: { label: "Partiellement nuageux", Icon: Cloud },
  3: { label: "Couvert", Icon: Cloud },
  45: { label: "Brouillard", Icon: CloudFog },
  48: { label: "Brouillard givrant", Icon: CloudFog },
  51: { label: "Bruine", Icon: CloudDrizzle },
  53: { label: "Bruine", Icon: CloudDrizzle },
  55: { label: "Bruine forte", Icon: CloudDrizzle },
  61: { label: "Pluie faible", Icon: CloudRain },
  63: { label: "Pluie", Icon: CloudRain },
  65: { label: "Forte pluie", Icon: CloudRain },
  71: { label: "Neige", Icon: CloudSnow },
  73: { label: "Neige", Icon: CloudSnow },
  75: { label: "Forte neige", Icon: CloudSnow },
  80: { label: "Averses", Icon: CloudRain },
  81: { label: "Averses fortes", Icon: CloudRain },
  82: { label: "Orages d'averses", Icon: CloudLightning },
  95: { label: "Orage", Icon: CloudLightning },
};

function pick(code) { return CODE_MAP[code] ?? { label: "—", Icon: Cloud }; }

function useNow() {
  const [now, setNow] = useState(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function useWeather(lat, lon) {
  const [data, setData] = useState(null);
  useEffect(() => {
    let on = true;
    const load = async () => {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=Europe%2FParis`;
        const res = await fetch(url);
        const json = await res.json();
        if (on) setData(json);
      } catch {}
    };
    load();
    const id = setInterval(load, 30 * 60 * 1000);
    return () => { on = false; clearInterval(id); };
  }, [lat, lon]);
  return data;
}

function timeUntil(target) {
  if (!target) return null;
  const t = new Date(target).getTime();
  const ms = t - Date.now();
  if (ms <= 0) return null;
  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms % 86_400_000) / 3_600_000);
  if (days > 0) return `J-${days}`;
  return `${hours}h`;
}

export default function HubWidget({ widget, mode = "grid" }) {
  const { focusWidget, widgets, settings } = useDashboard();
  const { data } = widget;
  const lat = data?.lat ?? 48.8566;
  const lon = data?.lon ?? 2.3522;
  const campus = data?.campus || "Campus Paris";

  const now = useNow();
  const weather = useWeather(lat, lon);

  // Manual override from Hub settings takes priority, then fallback to next-event widgets
  const nextEvent = useMemo(() => {
    const manual = data?.nextEvent;
    if (manual?.name && manual?.date) {
      const t = new Date(manual.date).getTime();
      if (t > Date.now()) {
        return {
          t,
          name: manual.name,
          location: manual.location || "",
          date: manual.date,
          source: "hub",
        };
      }
    }

    const evWidgets = widgets.filter(w => w.type === "next-event");
    let best = null;
    for (const w of evWidgets) {
      const dt = w.data?.date;
      if (!dt) continue;
      const t = new Date(dt).getTime();
      if (t > Date.now() && (!best || t < best.t)) {
        best = { t, name: w.data.name, location: w.data.location, date: dt, source: "next-event" };
      }
    }
    return best;
  }, [widgets, now, data?.nextEvent?.name, data?.nextEvent?.date, data?.nextEvent?.location]);

  const tickerMessages = (settings?.ticker?.messages || []).filter(m => m && m.trim());
  const tickerEnabled = settings?.ticker?.enabled;

  const cur = weather?.current;
  const Cur = cur ? pick(cur.weather_code).Icon : Cloud;
  const curLabel = cur ? pick(cur.weather_code).label : "—";

  const time = now
    ? now.toLocaleTimeString("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit" })
    : "--:--";
  const dateStr = now
    ? now.toLocaleDateString("fr-FR", { timeZone: "Europe/Paris", weekday: "long", day: "numeric", month: "long" })
    : "";

  return (
    <WidgetWrapper widget={widget} mode={mode} onClick={() => focusWidget(widget.id)}>
      {({ mode: m }) => {
        if (m === "grid") {
          return (
            <div className="flex flex-col h-full justify-between">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold text-violet">
                <Sparkles size={12} /> Maintenant
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-black text-white tabular-nums font-mono">{time}</span>
                {cur && <span className="text-base font-bold text-white/70 tabular-nums">{Math.round(cur.temperature_2m)}°</span>}
              </div>
              <div className="text-[11px] text-white/55 mt-auto">
                {nextEvent ? <>Prochain · <span className="text-violet font-semibold">{timeUntil(nextEvent.date)}</span></> : "Pas d'événement"}
              </div>
            </div>
          );
        }

        // Focus mode — premium hub layout
        return (
          <div className="relative h-full w-full overflow-hidden bg-[#0a0a0a] text-white">
            {/* Gradient PSTB en overlay réduit */}
            <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(135deg, rgba(249,0,80,0.04) 0%, rgba(160,0,255,0.05) 50%, rgba(43,0,255,0.04) 100%)" }} />
            <div className="absolute -top-60 -right-60 w-[700px] h-[700px] rounded-full bg-violet/12 blur-[160px]" />
            <div className="absolute -bottom-60 -left-60 w-[700px] h-[700px] rounded-full bg-pink-500/8 blur-[160px]" />

            <div className="relative h-full w-full grid grid-cols-[1.4fr_1fr] gap-10 px-16 pt-14"
              style={{ paddingBottom: "var(--safe-bottom, 3.5rem)" }}>
              {/* LEFT — Time + welcome */}
              <div className="flex flex-col justify-center min-w-0">
                <div className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.5em] text-violet mb-6">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet animate-pulse" />
                  <span>Bienvenue à PST&B</span>
                  <div className="h-px flex-1 bg-violet/20 max-w-[120px]" />
                </div>

                <div className="font-black text-white tabular-nums leading-[0.9]"
                  style={{ fontSize: "clamp(7rem, 14vw, 13rem)" }}>
                  {time}
                </div>

                <div className="text-2xl font-medium text-white/80 mt-4 capitalize">{dateStr}</div>

                <div className="flex items-center gap-2 mt-6 text-sm text-white/45 uppercase tracking-[0.3em] font-bold">
                  <MapPin size={14} />
                  <span>{campus}</span>
                </div>
              </div>

              {/* RIGHT — Cards stack */}
              <div className="flex flex-col gap-4 justify-center min-w-0">
                {/* Weather card */}
                <div className="rounded-3xl border border-white/8 bg-gradient-to-br from-blue-500/[0.06] to-transparent p-6 backdrop-blur-xl">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-blue-400/80 mb-3">
                    <Cur size={12} />
                    <span>Météo · {campus.replace(/^Campus\s*/i, "")}</span>
                  </div>
                  {cur ? (
                    <div className="flex items-center gap-5">
                      <Cur size={70} className="text-blue-300" strokeWidth={1.4} />
                      <div className="flex-1 min-w-0">
                        <div className="font-black text-white tabular-nums leading-none" style={{ fontSize: "4.5rem" }}>
                          {Math.round(cur.temperature_2m)}°
                        </div>
                        <div className="text-base text-white/65 mt-1 truncate">{curLabel}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-white/40">Chargement…</div>
                  )}
                </div>

                {/* Next event */}
                <div className="rounded-3xl border border-white/8 bg-gradient-to-br from-violet/[0.08] to-transparent p-6 backdrop-blur-xl">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-violet mb-3">
                    <Calendar size={12} />
                    <span>Prochain événement</span>
                    {nextEvent?.source === "hub" && (
                      <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/65 text-[9px] font-semibold tracking-wider">
                        Hub
                      </span>
                    )}
                    {nextEvent && (
                      <span className="ml-auto px-2 py-0.5 rounded-full bg-violet/20 text-violet text-[10px] font-mono">
                        {timeUntil(nextEvent.date)}
                      </span>
                    )}
                  </div>
                  {nextEvent ? (
                    <>
                      <div className="text-2xl font-black text-white leading-tight line-clamp-2">{nextEvent.name}</div>
                      {nextEvent.location && (
                        <div className="text-xs text-white/50 mt-2 flex items-center gap-1.5">
                          <MapPin size={11} /> {nextEvent.location}
                        </div>
                      )}
                      <div className="text-xs text-white/40 mt-1 font-mono">
                        {new Date(nextEvent.date).toLocaleDateString("fr-FR", {
                          weekday: "short", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit"
                        })}
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-white/40 italic">Aucun événement à venir</div>
                  )}
                </div>

                {/* Live ticker preview */}
                {tickerEnabled && tickerMessages.length > 0 && (
                  <div className="rounded-3xl border border-white/8 bg-white/[0.02] p-6 backdrop-blur-xl">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-emerald-400 mb-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>À la une</span>
                    </div>
                    <div className="text-base text-white/85 leading-relaxed line-clamp-2">
                      {tickerMessages[0]}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      }}
    </WidgetWrapper>
  );
}
