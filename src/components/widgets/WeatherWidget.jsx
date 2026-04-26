"use client";

import { useEffect, useState, useRef } from "react";
import WidgetWrapper from "@/components/WidgetWrapper";
import { useDashboard } from "@/context/DashboardContext";
import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning, CloudDrizzle, CloudFog, Wind } from "lucide-react";

const CODE_MAP = {
  0: { label: "Ciel clair", Icon: Sun },
  1: { label: "Peu nuageux", Icon: Sun },
  2: { label: "Partiellement nuageux", Icon: Cloud },
  3: { label: "Couvert", Icon: Cloud },
  45: { label: "Brouillard", Icon: CloudFog },
  48: { label: "Brouillard givrant", Icon: CloudFog },
  51: { label: "Bruine légère", Icon: CloudDrizzle },
  53: { label: "Bruine", Icon: CloudDrizzle },
  55: { label: "Bruine forte", Icon: CloudDrizzle },
  61: { label: "Pluie faible", Icon: CloudRain },
  63: { label: "Pluie", Icon: CloudRain },
  65: { label: "Forte pluie", Icon: CloudRain },
  71: { label: "Neige légère", Icon: CloudSnow },
  73: { label: "Neige", Icon: CloudSnow },
  75: { label: "Forte neige", Icon: CloudSnow },
  80: { label: "Averses", Icon: CloudRain },
  81: { label: "Averses fortes", Icon: CloudRain },
  82: { label: "Orages d'averses", Icon: CloudLightning },
  95: { label: "Orage", Icon: CloudLightning },
  96: { label: "Orage de grêle", Icon: CloudLightning },
  99: { label: "Orage violent", Icon: CloudLightning },
};

export const PSTB_CAMPUSES = [
  { id: "paris", name: "Paris", lat: 48.8566, lon: 2.3522 },
  { id: "republique", name: "République", lat: 48.8676, lon: 2.3631 },
  { id: "griset", name: "Griset", lat: 48.866433, lon: 2.379022 },
];

function pick(code) {
  return CODE_MAP[code] ?? { label: "—", Icon: Cloud };
}

function dayLabel(iso, idx) {
  if (idx === 0) return "Aujourd'hui";
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { weekday: "long" });
}

function useForecast(lat, lon) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(false);
  useEffect(() => {
    let on = true;
    const fetchW = async () => {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Europe%2FParis&forecast_days=4`;
        const res = await fetch(url);
        const json = await res.json();
        if (on) setData(json);
      } catch { if (on) setErr(true); }
    };
    fetchW();
    const id = setInterval(fetchW, 30 * 60 * 1000);
    return () => { on = false; clearInterval(id); };
  }, [lat, lon]);
  return { data, err };
}

function SingleCampusFocus({ city, data, err }) {
  const cur = data?.current;
  const days = data?.daily?.time?.slice(0, 4) ?? [];
  const Cur = cur ? pick(cur.weather_code).Icon : Cloud;
  const curLabel = cur ? pick(cur.weather_code).label : "Chargement…";

  return (
    <div className="relative h-full w-full bg-gradient-to-br from-[#0A0A0A] via-[#0A1428] to-black overflow-hidden flex items-center">
      <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-blue-500/10 blur-[120px]" />
      <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full bg-violet/10 blur-[120px]" />

      <div className="relative z-10 w-full max-w-6xl mx-auto px-16 pt-10"
        style={{ paddingBottom: "var(--safe-bottom, 2.5rem)" }}>
        <div className="text-[11px] font-bold uppercase tracking-[0.4em] text-blue-400/80 mb-4">Météo · {city}</div>
        {err && <div className="text-red-400">Erreur de chargement</div>}

        {cur && (
          <div className="flex items-end gap-10 mb-12">
            <div className="flex items-center gap-8">
              <Cur size={140} className="text-blue-300" strokeWidth={1.3} />
              <div>
                <div className="font-bold text-white tabular-nums leading-none" style={{ fontSize: "10rem" }}>
                  {Math.round(cur.temperature_2m)}°
                </div>
                <div className="text-2xl font-medium text-white/85 mt-2">{curLabel}</div>
                <div className="text-sm uppercase tracking-widest text-white/45 mt-2 flex items-center gap-2">
                  <Wind size={14} /> {Math.round(cur.wind_speed_10m)} km/h
                </div>
              </div>
            </div>
          </div>
        )}

        {days.length > 0 && (
          <div className="grid grid-cols-4 gap-4">
            {days.map((iso, i) => {
              const code = data.daily.weather_code[i];
              const tmax = data.daily.temperature_2m_max[i];
              const tmin = data.daily.temperature_2m_min[i];
              const { Icon, label } = pick(code);
              return (
                <div key={iso} className={`rounded-2xl border ${i === 0 ? "border-blue-400/40 bg-blue-500/10" : "border-white/8 bg-white/[0.02]"} p-5`}>
                  <div className="text-xs uppercase tracking-widest text-white/55 mb-3 capitalize">{dayLabel(iso, i)}</div>
                  <Icon size={42} className="text-white/85 mb-3" strokeWidth={1.5} />
                  <div className="text-sm text-white/70 mb-2 truncate">{label}</div>
                  <div className="flex items-baseline gap-2 tabular-nums">
                    <span className="text-2xl font-bold text-white">{Math.round(tmax)}°</span>
                    <span className="text-sm text-white/40">{Math.round(tmin)}°</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="absolute bottom-6 right-12 text-[10px] uppercase tracking-[0.4em] text-white/25 font-bold">
          Données · open-meteo
        </div>
      </div>
    </div>
  );
}

function CampusCard({ campus, data }) {
  const cur = data?.current;
  const days = data?.daily?.time?.slice(0, 3) ?? [];
  const Cur = cur ? pick(cur.weather_code).Icon : Cloud;
  const curLabel = cur ? pick(cur.weather_code).label : "—";

  return (
    <div className="rounded-3xl border border-white/8 bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-7 flex flex-col h-full backdrop-blur-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-blue-400/70">Campus</div>
          <div className="text-xl font-black text-white mt-1">{campus.name}</div>
        </div>
        <Cur size={56} className="text-blue-300" strokeWidth={1.3} />
      </div>

      {cur ? (
        <>
          <div className="font-black text-white tabular-nums leading-none" style={{ fontSize: "5.5rem" }}>
            {Math.round(cur.temperature_2m)}°
          </div>
          <div className="text-base font-medium text-white/80 mt-1">{curLabel}</div>
          <div className="text-xs uppercase tracking-widest text-white/40 mt-2 flex items-center gap-2">
            <Wind size={12} /> {Math.round(cur.wind_speed_10m)} km/h
          </div>
        </>
      ) : (
        <div className="text-sm text-white/40">Chargement…</div>
      )}

      {days.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mt-auto pt-5">
          {days.map((iso, i) => {
            const code = data.daily.weather_code[i];
            const tmax = data.daily.temperature_2m_max[i];
            const tmin = data.daily.temperature_2m_min[i];
            const { Icon } = pick(code);
            return (
              <div key={iso} className={`rounded-xl border ${i === 0 ? "border-blue-400/30 bg-blue-500/5" : "border-white/5 bg-white/[0.015]"} px-3 py-2`}>
                <div className="text-[9px] uppercase tracking-wider text-white/45 capitalize truncate">{dayLabel(iso, i)}</div>
                <Icon size={20} className="text-white/70 my-1" strokeWidth={1.5} />
                <div className="flex items-baseline gap-1 tabular-nums">
                  <span className="text-sm font-bold text-white">{Math.round(tmax)}°</span>
                  <span className="text-[10px] text-white/35">{Math.round(tmin)}°</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MultiCampusFocus() {
  const r0 = useForecast(PSTB_CAMPUSES[0].lat, PSTB_CAMPUSES[0].lon);
  const r1 = useForecast(PSTB_CAMPUSES[1].lat, PSTB_CAMPUSES[1].lon);
  const r2 = useForecast(PSTB_CAMPUSES[2].lat, PSTB_CAMPUSES[2].lon);
  const all = [r0, r1, r2];

  return (
    <div className="relative h-full w-full bg-gradient-to-br from-[#0A0A0A] via-[#0A1428] to-black overflow-hidden flex items-center">
      <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-blue-500/10 blur-[120px]" />
      <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full bg-violet/10 blur-[120px]" />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-12 pt-10"
        style={{ paddingBottom: "var(--safe-bottom, 2.5rem)" }}>
        <div className="flex items-center gap-3 mb-8">
          <span className="text-[11px] font-bold uppercase tracking-[0.4em] text-blue-400/80">Météo · 3 Campus PST&B</span>
          <div className="h-px flex-1 bg-white/8" />
        </div>

        <div className="grid grid-cols-3 gap-5 h-[70vh]">
          {PSTB_CAMPUSES.map((c, i) => (
            <CampusCard key={c.id} campus={c} data={all[i].data} />
          ))}
        </div>

        <div className="absolute bottom-6 right-12 text-[10px] uppercase tracking-[0.4em] text-white/25 font-bold">
          Données · open-meteo
        </div>
      </div>
    </div>
  );
}

export default function WeatherWidget({ widget, mode = "grid" }) {
  const { focusWidget } = useDashboard();
  const { city = "Paris", lat = 48.8566, lon = 2.3522, multiCampus = false } = widget.data ?? {};
  const single = useForecast(lat, lon);

  return (
    <WidgetWrapper widget={widget} mode={mode} onClick={() => focusWidget(widget.id)}>
      {({ mode: m }) => {
        const isCompact = m === "grid";
        if (isCompact) {
          const cur = single.data?.current;
          const Cur = cur ? pick(cur.weather_code).Icon : Cloud;
          const curLabel = cur ? pick(cur.weather_code).label : "Chargement…";
          return (
            <div className="flex flex-col h-full justify-between">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-widest text-sub mb-1">
                    {multiCampus ? "3 campus" : city}
                  </div>
                  <div className="text-4xl font-bold text-text">{cur ? Math.round(cur.temperature_2m) : "—"}°</div>
                  <div className="text-xs text-sub mt-1">{curLabel}</div>
                </div>
                <Cur size={48} className="text-violet/85" strokeWidth={1.5} />
              </div>
            </div>
          );
        }
        return multiCampus
          ? <MultiCampusFocus />
          : <SingleCampusFocus city={city} data={single.data} err={single.err} />;
      }}
    </WidgetWrapper>
  );
}
