"use client";

import { Map } from "lucide-react";
import WidgetWrapper from "@/components/WidgetWrapper";
import { useDashboard } from "@/context/DashboardContext";
import { useState, useEffect } from "react";

// Correspondance roomId → clé interne SVG
const ROOM_IDS = ["salle1", "salle2", "salle3", "salle4", "salle5", "amphi", "coworking"];

// Statut par défaut quand aucun ICS n'est disponible : toutes libres
const DEFAULT_STATUS = Object.fromEntries(ROOM_IDS.map(id => [id, { free: true }]));

function parseApiRooms(apiRooms) {
  // Mappe les IDs de l'API (ROOM_MAP de campus-calendar) vers les clés SVG
  const aliases = {
    "SALLE1": "salle1", "SALLE 1": "salle1", "S1": "salle1",
    "SALLE2": "salle2", "SALLE 2": "salle2", "S2": "salle2",
    "SALLE3": "salle3", "SALLE 3": "salle3", "S3": "salle3",
    "SALLE4": "salle4", "SALLE 4": "salle4", "S4": "salle4",
    "SALLE5": "salle5", "SALLE 5": "salle5", "S5": "salle5",
    "AMPHI": "amphi", "AMPHITHEATRE": "amphi", "AMPHITHÉÂTRE": "amphi",
    "COWORKING": "coworking", "COW": "coworking",
  };

  const result = { ...DEFAULT_STATUS };
  for (const room of apiRooms) {
    const key = aliases[room.id.toUpperCase()] || aliases[room.label.toUpperCase()] || null;
    if (key) result[key] = room;
  }
  return result;
}

export default function CampusMapWidget({ widget, mode = "grid" }) {
  const { focusWidget } = useDashboard();
  const [rooms, setRooms] = useState(DEFAULT_STATUS);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [hasIcs, setHasIcs] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchRooms() {
      try {
        const res = await fetch("/api/campus-calendar");
        if (!res.ok) return; // pas de ICS → garde DEFAULT_STATUS
        const data = await res.json();
        if (cancelled || !data.rooms) return;
        setRooms(parseApiRooms(data.rooms));
        setUpdatedAt(data.updatedAt);
        setHasIcs(true);
      } catch {
        // silencieux — affiche les données par défaut
      }
    }

    fetchRooms();
    const interval = setInterval(fetchRooms, 5 * 60 * 1000); // refresh toutes les 5 min
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const color = (key) =>
    rooms[key]?.free === false
      ? "#ef4444"
      : "#10b981";

  const statusClass = (key) =>
    rooms[key]?.free === false
      ? "bg-red-500/80 border-red-400 text-white"
      : "bg-emerald-500/80 border-emerald-400 text-white";

  const statusLabel = (key) => {
    const r = rooms[key];
    if (!r || r.free === true) return "Libre";
    if (r.busyUntil) return `Occupé → ${r.busyUntil}`;
    return "Occupé";
  };

  return (
    <WidgetWrapper widget={widget} mode={mode} onClick={() => focusWidget(widget.id)}>
      {({ mode: m }) => {
        if (m === "grid") {
          return (
            <div className="flex flex-col h-full justify-between">
              <div>
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-emerald-400 font-bold mb-2">
                  <Map size={12} /> Salles Disponibles
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  {["salle1","salle2","salle3","coworking"].map(k => (
                    <div key={k} className={`p-1.5 rounded text-[10px] text-center font-bold border ${statusClass(k)}`}>
                      {k === "coworking" ? "COW." : k.replace("salle","S")}
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-[10px] text-sub">
                {hasIcs ? `Mis à jour ${updatedAt ? new Date(updatedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : ""}` : "Aucun ICS — données simulées"}
              </p>
            </div>
          );
        }

        // FULLSCREEN MODE
        return (
          <div className="h-full w-full bg-transparent flex flex-col p-12 relative overflow-hidden">
            <div className="flex items-center gap-4 mb-8 z-10">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                <Map size={24} className="text-emerald-400" />
              </div>
              <div>
                <div className="text-sm font-bold uppercase tracking-[0.4em] text-emerald-400/50">Campus PST&B</div>
                <h1 className="text-4xl font-black text-white tracking-tight">Disponibilité des Salles</h1>
              </div>
              <div className="ml-auto flex items-center gap-6">
                {!hasIcs && (
                  <span className="text-xs text-white/30 italic">Aucun ICS connecté</span>
                )}
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
                  <span className="text-white/70 font-medium">Libre</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]"></div>
                  <span className="text-white/70 font-medium">Occupé</span>
                </div>
              </div>
            </div>

            <div className="flex-1 relative bg-transparent overflow-hidden p-6 z-10 flex items-center justify-center">
              <svg viewBox="0 20 1100 600" className="w-full max-w-5xl h-auto drop-shadow-2xl">

                <rect x="280" y="250" width="380" height="400" fill="transparent" />
                <text x="470" y="450" fill="rgba(255, 255, 255, 0.15)" fontSize="20" fontWeight="bold" textAnchor="middle">ATRIUM / PATIO</text>

                <g>
                  <g className="transition-all duration-700">
                    <path d="M 30 30 L 300 30 L 300 230 L 30 230 Z" fill={color("salle3")} />
                    <text x="165" y="120" fill="white" fontSize="24" fontWeight="900" textAnchor="middle">SALLE 3</text>
                    <text x="165" y="148" fill="rgba(255,255,255,0.7)" fontSize="13" textAnchor="middle">{statusLabel("salle3")}</text>
                  </g>

                  <g className="transition-all duration-700">
                    <path d="M 320 30 L 480 30 L 480 230 L 320 230 Z" fill={color("salle2")} />
                    <text x="400" y="120" fill="white" fontSize="24" fontWeight="900" textAnchor="middle">SALLE 2</text>
                    <text x="400" y="148" fill="rgba(255,255,255,0.7)" fontSize="13" textAnchor="middle">{statusLabel("salle2")}</text>
                  </g>

                  <g className="transition-all duration-700">
                    <path d="M 500 30 L 660 30 L 660 230 L 500 230 Z" fill={color("salle1")} />
                    <text x="580" y="120" fill="white" fontSize="24" fontWeight="900" textAnchor="middle">SALLE 1</text>
                    <text x="580" y="148" fill="rgba(255,255,255,0.7)" fontSize="13" textAnchor="middle">{statusLabel("salle1")}</text>
                  </g>

                  <g className="transition-all duration-700">
                    <path d="M 30 250 L 200 250 L 260 310 L 260 430 L 30 430 Z" fill={color("salle4")} />
                    <text x="135" y="330" fill="white" fontSize="24" fontWeight="900" textAnchor="middle">SALLE 4</text>
                    <text x="135" y="358" fill="rgba(255,255,255,0.7)" fontSize="13" textAnchor="middle">{statusLabel("salle4")}</text>
                  </g>

                  <g className="transition-all duration-700">
                    <path d="M 30 450 L 260 450 L 260 620 L 30 620 Z" fill={color("salle5")} />
                    <text x="145" y="520" fill="white" fontSize="24" fontWeight="900" textAnchor="middle">SALLE 5</text>
                    <text x="145" y="548" fill="rgba(255,255,255,0.7)" fontSize="13" textAnchor="middle">{statusLabel("salle5")}</text>
                  </g>

                  <g className="transition-all duration-700">
                    <path d="M 680 180 L 840 180 L 980 430 L 680 430 Z" fill={color("coworking")} />
                    <text x="790" y="295" fill="white" fontSize="22" fontWeight="900" textAnchor="middle">COWORKING</text>
                    <text x="790" y="323" fill="rgba(255,255,255,0.7)" fontSize="13" textAnchor="middle">{statusLabel("coworking")}</text>
                  </g>

                  <g>
                    <path d="M 660 450 L 760 450 L 760 620 L 660 620 Z" fill="#c084fc" />
                    <text x="710" y="535" fill="white" fontSize="16" fontWeight="900" textAnchor="middle" transform="rotate(-90 710,535)">SCOLARITÉ</text>
                  </g>

                  <g className="transition-all duration-700">
                    <path d="M 780 450 L 990 450 L 1070 560 L 1070 620 L 780 620 Z" fill={color("amphi")} />
                    <text x="890" y="520" fill="white" fontSize="24" fontWeight="900" textAnchor="middle">AMPHITHÉÂTRE</text>
                    <text x="890" y="548" fill="rgba(255,255,255,0.7)" fontSize="13" textAnchor="middle">{statusLabel("amphi")}</text>
                  </g>
                </g>

                <g fill="#0F0F0F">
                  <rect x="250" y="220" width="40" height="20" />
                  <rect x="330" y="220" width="40" height="20" />
                  <rect x="510" y="220" width="40" height="20" />
                  <rect x="250" y="370" width="20" height="40" />
                  <rect x="250" y="470" width="20" height="40" />
                  <rect x="670" y="200" width="20" height="40" />
                  <rect x="670" y="370" width="20" height="40" />
                  <rect x="680" y="440" width="40" height="20" />
                  <rect x="770" y="470" width="20" height="40" />
                  <rect x="800" y="440" width="40" height="20" />
                </g>

              </svg>
            </div>

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/5 blur-[150px] rounded-full pointer-events-none" />
          </div>
        );
      }}
    </WidgetWrapper>
  );
}
