import { NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import path from "path";

// Cache en mémoire : évite de re-fetcher/re-parser à chaque requête widget
let _cache = { data: null, builtAt: 0, ttlMs: 10 * 60 * 1000 };

// ─── Parser ICS minimal (RFC 5545) ────────────────────────────────────────────
// Pas de dépendance externe — on parse uniquement les champs utiles pour les salles

function parseIcs(raw) {
  const events = [];
  const lines = raw.replace(/\r\n[ \t]/g, "").replace(/\r\n/g, "\n").split("\n");
  let current = null;

  for (const line of lines) {
    if (line === "BEGIN:VEVENT") { current = {}; continue; }
    if (line === "END:VEVENT" && current) { events.push(current); current = null; continue; }
    if (!current) continue;

    // Gère les paramètres type DTSTART;TZID=Europe/Paris:20250428T083000
    const sep = line.indexOf(":");
    if (sep === -1) continue;
    const keyRaw = line.slice(0, sep).split(";")[0].toUpperCase();
    const val = line.slice(sep + 1).trim();

    if (keyRaw === "DTSTART") current.start = parseIcsDate(val);
    else if (keyRaw === "DTEND")   current.end   = parseIcsDate(val);
    else if (keyRaw === "SUMMARY") current.title  = val;
    else if (keyRaw === "LOCATION") current.location = val;
    else if (keyRaw === "UID") current.uid = val;
  }

  return events.filter(e => e.start && e.end);
}

function parseIcsDate(val) {
  // Formats : 20250428T083000Z  ou  20250428T083000  ou  20250428
  const s = val.replace("Z", "");
  if (s.length === 8) {
    return new Date(`${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}T00:00:00`);
  }
  return new Date(
    `${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}T${s.slice(9,11)}:${s.slice(11,13)}:${s.slice(13,15)}`
  );
}

// ─── Matching de salle multi-format ──────────────────────────────────────────
// Gère les 3 logiciels : Hyperplanning, TimEdit, Timespice/Genesis
//
// Hyperplanning : "Salle A101 - Bâtiment Nord", "A101", "Amphi B"
// TimEdit       : "A101", "Campus > Bâtiment A > A101", "Salle A101 (30 places)"
// Timespice     : "PST&B - Salle A101", "SA101", "Genesis::A101"

function extractRoomTokens(str) {
  if (!str) return [];
  return str
    // Retire les préfixes campus/établissement communs
    .replace(/pst&?b\s*[-–>:]+\s*/gi, "")
    .replace(/genesis\s*:+\s*/gi, "")
    .replace(/campus\s*[-–>]+\s*/gi, "")
    // Découpe sur les séparateurs courants
    .split(/[\s\-–>:()|,\/\\]+/)
    .map(t => t.toLowerCase().replace(/[^a-z0-9]/g, ""))
    .filter(t => t.length >= 2);
}

function roomMatches(locationStr, roomId) {
  const locTokens = extractRoomTokens(locationStr);
  const idTokens  = extractRoomTokens(roomId);

  // Match si tous les tokens de l'ID se retrouvent dans les tokens du LOCATION
  // ex: roomId "A101" → token ["a101"] doit apparaître dans locTokens
  // ex: roomId "INFO1" → token ["info1"] doit apparaître
  return idTokens.every(t => locTokens.some(l => l === t || l.endsWith(t) || t.endsWith(l)));
}

// ─── Extraction des salles libres ─────────────────────────────────────────────

function computeRoomStatus(events, roomMap) {
  const now = new Date();
  const todayStart = new Date(now); todayStart.setHours(0,0,0,0);
  const todayEnd   = new Date(now); todayEnd.setHours(23,59,59,999);

  const todayEvents = events.filter(e =>
    e.location && e.start <= todayEnd && e.end >= todayStart
  );

  return Object.entries(roomMap).map(([roomId, label]) => {
    const busy = todayEvents
      .filter(e => roomMatches(e.location, roomId))
      .sort((a, b) => a.start - b.start);

    const currentEvent = busy.find(e => e.start <= now && e.end > now);
    const isFree = !currentEvent;

    // Prochaine occupation (si libre) ou fin de l'occupation en cours
    let nextChange = null;
    if (isFree) {
      const next = busy.find(e => e.start > now);
      nextChange = next ? next.start : null;
    } else {
      nextChange = currentEvent.end;
    }

    const nextBusy = isFree ? busy.find(e => e.start > now) : null;

    return {
      id: roomId,
      label,
      free: isFree,
      freeUntil: isFree && nextChange ? fmtTime(nextChange) : null,
      busyUntil: !isFree && nextChange ? fmtTime(nextChange) : null,
      currentEvent: currentEvent ? { title: currentEvent.title, end: fmtTime(currentEvent.end) } : null,
      nextEvent: nextBusy ? { title: nextBusy.title, start: fmtTime(nextBusy.start) } : null,
      schedule: busy.map(e => ({
        title: e.title,
        start: fmtTime(e.start),
        end: fmtTime(e.end),
      })),
    };
  });
}

function fmtTime(date) {
  return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });
}

// ─── Chargement ICS (URL ou fichier) ─────────────────────────────────────────

async function loadIcsRaw(src) {
  if (!src) {
    // Mode fichier : public/calendrier.ics
    const filePath = path.join(process.cwd(), "public", "calendrier.ics");
    if (!existsSync(filePath)) return null;
    return readFileSync(filePath, "utf-8");
  }
  // Mode URL : fetch direct
  const res = await fetch(src, { next: { revalidate: 0 }, signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`ICS fetch failed: ${res.status}`);
  return res.text();
}

// ─── Mapping salles — à personnaliser avec ton schéma ─────────────────────────
// Clé = identifiant normalisé qui doit matcher le champ LOCATION du ICS
// Valeur = label affiché dans le widget

// IDs à ajuster selon ce que retourne ?debug=1 avec ton ICS réel
const ROOM_MAP = {
  "SALLE1":     "Salle 1",
  "SALLE2":     "Salle 2",
  "SALLE3":     "Salle 3",
  "SALLE4":     "Salle 4",
  "SALLE5":     "Salle 5",
  "AMPHI":      "Amphithéâtre",
  "COWORKING":  "Coworking",
};

// ─── Handler GET ──────────────────────────────────────────────────────────────

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const src = searchParams.get("src") || null; // URL ICS optionnelle
    const bust = searchParams.get("bust");       // ?bust=1 pour forcer le refresh

    const now = Date.now();
    if (!bust && _cache.data && now - _cache.builtAt < _cache.ttlMs) {
      return NextResponse.json(_cache.data);
    }

    const raw = await loadIcsRaw(src);
    if (!raw) {
      return NextResponse.json({ error: "Aucun fichier ICS trouvé. Dépose public/calendrier.ics ou passe ?src=URL" }, { status: 404 });
    }

    const events = parseIcs(raw);

    // ?debug=1 → retourne les LOCATION bruts pour diagnostiquer le format
    if (searchParams.get("debug")) {
      const locations = [...new Set(events.map(e => e.location).filter(Boolean))].sort();
      return NextResponse.json({ totalEvents: events.length, locations });
    }

    const rooms = computeRoomStatus(events, ROOM_MAP);

    const data = {
      updatedAt: new Date().toISOString(),
      source: src ? "url" : "file",
      totalEvents: events.length,
      rooms,
    };

    _cache = { data, builtAt: now, ttlMs: 10 * 60 * 1000 };
    return NextResponse.json(data);
  } catch (err) {
    console.error("[campus-calendar]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── Handler POST — upload direct d'un .ics ──────────────────────────────────
// Permet de poster le contenu brut du fichier ICS depuis l'admin

export async function POST(req) {
  try {
    const body = await req.text();
    if (!body.includes("BEGIN:VCALENDAR")) {
      return NextResponse.json({ error: "Contenu ICS invalide" }, { status: 400 });
    }

    const events = parseIcs(body);
    const rooms = computeRoomStatus(events, ROOM_MAP);

    const data = {
      updatedAt: new Date().toISOString(),
      source: "upload",
      totalEvents: events.length,
      rooms,
    };

    _cache = { data, builtAt: Date.now(), ttlMs: 10 * 60 * 1000 };
    return NextResponse.json({ ok: true, ...data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
