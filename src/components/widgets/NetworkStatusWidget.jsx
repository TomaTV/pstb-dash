"use client";

import { useEffect, useMemo, useState } from "react";
import WidgetWrapper from "@/components/WidgetWrapper";
import { useDashboard } from "@/context/DashboardContext";
import { Wifi, Globe, Server, AlertTriangle, CheckCircle2, RefreshCw, Activity, Gauge } from "lucide-react";

function statusTone(status) {
  if (status === "online") return "text-emerald-400 bg-emerald-500/15 border-emerald-400/35";
  if (status === "degraded") return "text-amber-300 bg-amber-500/15 border-amber-400/35";
  return "text-red-400 bg-red-500/15 border-red-400/35";
}

function StatusDot({ status }) {
  const cls =
    status === "online"
      ? "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.7)]"
      : status === "degraded"
        ? "bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.7)]"
        : "bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.7)]";
  return <span className={`inline-flex w-2 h-2 rounded-full ${cls}`} />;
}

function TargetIcon({ id }) {
  if (id === "wifi-gateway") return <Wifi size={16} className="text-violet/80" />;
  if (id === "pstb-site") return <Globe size={16} className="text-violet/80" />;
  return <Server size={16} className="text-violet/80" />;
}

function qualityTone(quality) {
  if (quality === "excellent") return "text-emerald-400";
  if (quality === "good") return "text-emerald-300";
  if (quality === "fair") return "text-amber-300";
  return "text-red-400";
}

function formatDetail(detail) {
  if (!detail) return "—";
  if (detail.includes("ENOTFOUND")) return "Hôte introuvable (IP/nom invalide ou inaccessible)";
  if (detail.includes("timeout")) return "Timeout réseau";
  return detail;
}

export default function NetworkStatusWidget({ widget, mode = "grid" }) {
  const { focusWidget } = useDashboard();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let on = true;
    const load = async () => {
      try {
        const res = await fetch("/api/network-status", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        let json = await res.json();
        
        // --- Client-side checks ---
        if (json.targets) {
          let updated = false;
          for (const target of json.targets) {
            if (target.kind === "client-fetch" && target.url) {
              const start = Date.now();
              try {
                // Use no-cors to avoid CORS errors. If the IP is reachable, it will not throw.
                // We add a cache buster to avoid browser caching.
                await fetch(`${target.url}?_cb=${start}`, { mode: "no-cors", cache: "no-store", signal: AbortSignal.timeout(3000) });
                target.status = "online";
                target.latencyMs = Date.now() - start;
                target.detail = "Ping local réussi (TV)";
              } catch (err) {
                target.status = "offline";
                target.latencyMs = null;
                target.detail = "Inaccessible depuis la TV";
              }
              updated = true;
            }
          }
          // Re-evaluate global status if we updated client targets
          if (updated) {
            if (json.targets.some((r) => r.status === "offline")) json.status = "offline";
            else if (json.targets.some((r) => r.status === "degraded")) json.status = "degraded";
            else json.status = "online";
          }
        }
        
        if (on) {
          setData(json);
          setLoading(false);
        }
      } catch {
        if (on) setLoading(false);
      }
    };

    load();
    const id = setInterval(load, 30_000);
    return () => {
      on = false;
      clearInterval(id);
    };
  }, []);

  const targets = data?.targets ?? [];
  const globalStatus = data?.status ?? "offline";
  const uptime = data?.uptime ?? null;
  const quality = data?.quality ?? null;
  const updatedAt = useMemo(() => {
    if (!data?.updatedAt) return "—";
    return new Date(data.updatedAt).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }, [data?.updatedAt]);

  return (
    <WidgetWrapper widget={widget} mode={mode} onClick={() => focusWidget(widget.id)}>
      {({ mode: m }) => {
        if (m === "grid") {
          return (
            <div className="flex flex-col h-full justify-between">
              <div className="flex items-center justify-between gap-2">
                <div className="text-[10px] uppercase tracking-widest font-bold text-violet">Réseau campus</div>
                {loading ? <RefreshCw size={13} className="text-white/45 animate-spin" /> : <StatusDot status={globalStatus} />}
              </div>
              <div className="mt-2 text-white/80 text-sm font-semibold grid grid-cols-2 gap-2">
                <div>
                  <div>{targets.length} test{targets.length > 1 ? "s" : ""}</div>
                  <div className="text-[10px] text-white/45">cibles réseau</div>
                </div>
                <div>
                  <div>{uptime?.uptime24h ?? "--"}%</div>
                  <div className="text-[10px] text-white/45">uptime 24h</div>
                </div>
              </div>
              <div className="text-[10px] text-white/45 font-mono">Maj {updatedAt}</div>
            </div>
          );
        }

        return (
          <div className="relative h-full w-full overflow-hidden bg-gradient-to-br from-[#0A0A0A] via-[#0A101D] to-black text-white">
            <div className="absolute -top-40 -left-20 w-[420px] h-[420px] rounded-full bg-violet/10 blur-[120px]" />
            <div className="absolute -bottom-40 right-0 w-[380px] h-[380px] rounded-full bg-emerald-500/8 blur-[120px]" />

            <div className="relative h-full w-full px-12 pt-10" style={{ paddingBottom: "calc(var(--safe-bottom, 2.5rem) + 1rem)" }}>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.4em] text-violet/85">Network Monitor</div>
                  <h3 className="text-4xl font-black tracking-tight mt-2">État réseau campus</h3>
                </div>
                <div className={`px-4 py-2 rounded-full border text-sm font-bold uppercase tracking-wider ${statusTone(globalStatus)}`}>
                  <span className="inline-flex items-center gap-2">
                    <StatusDot status={globalStatus} />
                    {globalStatus}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {targets.map((target) => (
                  <div key={target.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <TargetIcon id={target.id} />
                        <div>
                          <div className="text-sm font-bold text-white">{target.label}</div>
                          <div className="text-[11px] text-white/45 uppercase tracking-wider">{target.kind}</div>
                        </div>
                      </div>
                      <div className={`px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${statusTone(target.status)}`}>
                        {target.status}
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-sm">
                      <div className="text-white/65">{formatDetail(target.detail)}</div>
                      <div className="font-mono text-white/85">
                        {typeof target.latencyMs === "number" ? `${target.latencyMs} ms` : "—"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-white/45 font-bold mb-3">
                    <Activity size={14} />
                    Uptime monitor
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-white/40">1h</div>
                      <div className="text-3xl font-black">{uptime?.uptime1h ?? "--"}%</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-white/40">24h</div>
                      <div className="text-3xl font-black">{uptime?.uptime24h ?? "--"}%</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-12 gap-1">
                    {(uptime?.timeline ?? []).map((status, idx) => (
                      <span
                        key={`${status}-${idx}`}
                        className={`h-2 rounded-sm ${status === "online" ? "bg-emerald-400/90" : status === "degraded" ? "bg-amber-400/90" : "bg-red-500/90"}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-white/45 font-bold mb-3">
                    <Gauge size={14} />
                    Internet quality
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-white/40">Latence</div>
                      <div className="text-xl font-black tabular-nums">{quality?.avgLatency ?? "--"}ms</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-white/40">Jitter</div>
                      <div className="text-xl font-black tabular-nums">{quality?.jitterMs ?? "--"}ms</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-white/40">Loss</div>
                      <div className="text-xl font-black tabular-nums">{quality?.packetLoss ?? "--"}%</div>
                    </div>
                  </div>
                  <div className={`mt-3 text-sm font-bold uppercase tracking-wider ${qualityTone(quality?.quality)}`}>
                    {quality?.quality ?? "—"}
                  </div>
                </div>
              </div>

              {!targets.length && (
                <div className="mt-8 rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-amber-200 text-sm inline-flex items-center gap-2">
                  <AlertTriangle size={16} />
                  Aucune cible configurée. Configure `NETWORK_WIFI_IP` et/ou `NETWORK_PUBLIC_URL`.
                </div>
              )}

              <div className="mt-5 flex items-center justify-between text-[10px] uppercase tracking-[0.25em] text-white/35 font-bold">
                <span className="inline-flex items-center gap-2">
                  {globalStatus === "online" ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                  Dernière mise à jour · {updatedAt}
                </span>
                <span className="text-white/30">Compatible footer TV</span>
              </div>
            </div>
          </div>
        );
      }}
    </WidgetWrapper>
  );
}
