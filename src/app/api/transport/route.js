import { NextResponse } from "next/server";
import { getStore, setStore } from "@/lib/db";

const ALL_LINES = {
  rer: [
    { id: "A", color: "#E2231A", textColor: "#FFF" },
    { id: "B", color: "#5291CE", textColor: "#FFF" },
    { id: "C", color: "#FFCD00", textColor: "#000" },
    { id: "D", color: "#00814F", textColor: "#FFF" },
    { id: "E", color: "#BD76A1", textColor: "#FFF" },
    { id: "H", color: "#837902", textColor: "#FFF" },
    { id: "J", color: "#CEDC00", textColor: "#000" },
    { id: "K", color: "#C9910D", textColor: "#000" },
    { id: "L", color: "#6E6E6E", textColor: "#FFF" },
    { id: "N", color: "#00814F", textColor: "#FFF" },
    { id: "P", color: "#F0A400", textColor: "#000" },
    { id: "R", color: "#E19BDF", textColor: "#000" },
    { id: "U", color: "#E2231A", textColor: "#FFF" },
  ],
  metro: [
    { id: "1",  color: "#FFCD00", textColor: "#000" },
    { id: "2",  color: "#003CA6", textColor: "#FFF" },
    { id: "3",  color: "#837902", textColor: "#FFF" },
    { id: "3b", color: "#6EC4E8", textColor: "#000" },
    { id: "4",  color: "#CF009E", textColor: "#FFF" },
    { id: "5",  color: "#FF7E2E", textColor: "#000" },
    { id: "6",  color: "#6ECA97", textColor: "#000" },
    { id: "7",  color: "#FA9ABA", textColor: "#000" },
    { id: "7b", color: "#6ECA97", textColor: "#000" },
    { id: "8",  color: "#E19BDF", textColor: "#000" },
    { id: "9",  color: "#B6BD00", textColor: "#000" },
    { id: "10", color: "#C9910D", textColor: "#000" },
    { id: "11", color: "#704B1C", textColor: "#FFF" },
    { id: "12", color: "#007852", textColor: "#FFF" },
    { id: "13", color: "#6EC4E8", textColor: "#000" },
    { id: "14", color: "#62259D", textColor: "#FFF" },
  ],
  tram: [
    { id: "T1",  color: "#003CA6", textColor: "#FFF" },
    { id: "T2",  color: "#CF009E", textColor: "#FFF" },
    { id: "T3a", color: "#FF7E2E", textColor: "#000" },
    { id: "T3b", color: "#00814F", textColor: "#FFF" },
    { id: "T4",  color: "#FFCD00", textColor: "#000" },
    { id: "T5",  color: "#62259D", textColor: "#FFF" },
    { id: "T6",  color: "#E2231A", textColor: "#FFF" },
    { id: "T7",  color: "#704B1C", textColor: "#FFF" },
    { id: "T8",  color: "#837902", textColor: "#FFF" },
    { id: "T9",  color: "#003CA6", textColor: "#FFF" },
    { id: "T10", color: "#CF009E", textColor: "#FFF" },
    { id: "T11", color: "#FF7E2E", textColor: "#000" },
  ],
};

let liveCache = { map: null, ts: 0 };
const CACHE_TTL = 3 * 60_000; // 3 minutes

// Helper to get current time in Navitia format: YYYYMMDDTHHMMSS
function getNowNavitiaString() {
  // Assuming server is in Paris timezone (or close enough)
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

// Decode basic HTML entities
function decodeHtmlEntities(text) {
  return text
    .replace(/&#(\d+);/g, (m, dec) => String.fromCharCode(dec))
    .replace(/&eacute;/gi, "é")
    .replace(/&egrave;/gi, "è")
    .replace(/&agrave;/gi, "à")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&nbsp;/gi, " ");
}

/**
 * Fetch live disruptions from Navitia via IDFM PRIM (fr-idf coverage).
 * Returns a Map<lineCode, { status, message }>
 */
async function fetchNavitiaDisruptions() {
  const key = process.env.PRIM_API_KEY;
  if (!key) throw new Error("No PRIM_API_KEY");

  // Fetch only relevant commercial modes to bypass global 1000 items pagination which hides trains behind buses
  const endpoints = [
    "commercial_modes/commercial_mode:RapidTransit/disruptions", // RER
    "commercial_modes/commercial_mode:LocalTrain/disruptions", // Transilien
    "commercial_modes/commercial_mode:Metro/disruptions", // Metro
    "commercial_modes/commercial_mode:Tramway/disruptions" // Tram
  ];

  const results = await Promise.all(
    endpoints.map(ep =>
      fetch(`https://prim.iledefrance-mobilites.fr/marketplace/v2/navitia/${ep}?count=1000`, {
        headers: { apikey: key, Accept: "application/json" },
        cache: "no-store",
      }).then(r => r.json())
    )
  );

  const allDisruptions = results.flatMap(r => r.disruptions ?? []);
  const lineStatus = new Map();

  for (const disruption of allDisruptions) {
    // Only process currently active disruptions
    if (disruption.status !== "active") continue;

    const effect = disruption.severity?.effect ?? "";

    const raw = disruption.messages?.[0]?.text ?? disruption.severity?.name ?? "";
    // Decode HTML entities, then strip remaining HTML tags
    const cleanText = decodeHtmlEntities(raw).replace(/<[^>]*>/g, "").trim();
    const message = cleanText.slice(0, 140);
    
    const isTravaux = /travaux/i.test(message) || disruption.cause === "travaux";
    const isInterrupted = ["NO_SERVICE", "SUSPENDED"].includes(effect) || /interrompu|supprimé|aucun train/i.test(message);
    const isPerturbed = effect === "SIGNIFICANT_DELAYS" || /perturbé|ralentissement/i.test(message);

    let status;
    if (isInterrupted) {
      status = "critical";
    } else if (isTravaux || (isPerturbed && disruption.cause === "perturbation")) {
      status = "disrupted";
    } else {
      // Ignore minor modifications
      continue;
    }

    for (const obj of disruption.impacted_objects ?? []) {
      if (obj.pt_object?.embedded_type !== "line") continue;
      const line = obj.pt_object.line;
      if (!line) continue;

      // Navitia line.code gives us "A", "1", "T1", "H", etc.
      const code = (line.code || line.name || "").trim().toUpperCase();
      if (!code) continue;

      // Keep the most severe status for each line
      const existing = lineStatus.get(code);
      if (!existing || (status === "critical" && existing.status === "disrupted")) {
        lineStatus.set(code, { status, message });
      }
    }
  }

  return lineStatus;
}

function buildLines(liveMap = new Map(), adminList = []) {
  // Admin overrides take priority over live PRIM data
  const adminMap = new Map(adminList.map(d => [d.lineId, { status: d.status, message: d.message }]));

  const result = {};
  for (const [type, lines] of Object.entries(ALL_LINES)) {
    result[type] = lines.map(l => {
      const override = adminMap.get(l.id);
      const live = liveMap.get(l.id.toUpperCase());
      const source = override ?? live;
      return { ...l, status: source?.status ?? "ok", message: source?.message ?? "" };
    });
  }
  return result;
}

export const dynamic = "force-dynamic";

export async function GET() {
  const now = Date.now();
  let liveMap = liveCache.map;

  if (!liveMap || now - liveCache.ts > CACHE_TTL) {
    try {
      liveMap = await fetchNavitiaDisruptions();
      liveCache = { map: liveMap, ts: now };
      console.log(`[transport] PRIM Navitia OK — ${liveMap.size} disrupted lines:`, [...liveMap.keys()].join(", "));
    } catch (e) {
      if (!e.message.startsWith("No PRIM_API_KEY")) {
        console.warn("[transport] PRIM Navitia error:", e.message);
      }
      liveMap = liveCache.map ?? new Map();
    }
  }

  const adminList = (await getStore("transport_disruptions")) ?? [];
  const lines = buildLines(liveMap, adminList);
  const allFlat = Object.values(lines).flat();
  const disruptedCount = allFlat.filter(l => l.status !== "ok").length;

  return NextResponse.json({
    lines,
    updatedAt: new Date().toISOString(),
    source: process.env.PRIM_API_KEY ? "prim-navitia" : "admin",
    disruptions: disruptedCount,
  });
}

export async function POST(req) {
  try {
    const { disruptions } = await req.json();
    if (!Array.isArray(disruptions)) {
      return NextResponse.json({ error: "disruptions must be an array" }, { status: 400 });
    }
    await setStore("transport_disruptions", disruptions);
    liveCache = { map: null, ts: 0 }; // force refresh on next GET
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }
}
