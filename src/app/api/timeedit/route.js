import { NextResponse } from "next/server";

// TimeEdit public planning URL (ICS export)
const TIMEEDIT_ICS_URL = "https://cloud.timeedit.net/fr_gge/web/public/ri1Q59.ics";
const TIMEEDIT_HTML_URL = "https://cloud.timeedit.net/fr_gge/web/public/ri1Q59.html";

let _cache = { data: null, builtAt: 0, ttlMs: 5 * 60 * 1000 }; // 5 min cache

// ── ICS parser ────────────────────────────────────────────────────────────────

function parseIcs(raw) {
  const events = [];
  // Unfold RFC 5545 long lines
  const unfolded = raw.replace(/\r\n[ \t]/g, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = unfolded.split("\n");
  let current = null;

  for (const line of lines) {
    if (line.startsWith("BEGIN:VEVENT")) { current = {}; continue; }
    if (line.startsWith("END:VEVENT") && current) { events.push(current); current = null; continue; }
    if (!current) continue;

    const sep = line.indexOf(":");
    if (sep === -1) continue;
    const keyRaw = line.slice(0, sep).split(";")[0].toUpperCase();
    const val = line.slice(sep + 1).trim();

    if (keyRaw === "DTSTART") current.start = parseIcsDate(val);
    else if (keyRaw === "DTEND") current.end = parseIcsDate(val);
    else if (keyRaw === "SUMMARY") current.title = decodeIcsText(val);
    else if (keyRaw === "LOCATION") current.location = decodeIcsText(val);
    else if (keyRaw === "DESCRIPTION") current.description = decodeIcsText(val);
  }

  return events.filter(e => e.start && e.end);
}

function parseIcsDate(val) {
  const isUtc = val.endsWith("Z");
  const s = val.replace("Z", "");
  if (s.length === 8) {
    return new Date(`${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}T00:00:00`);
  }
  const iso = `${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}T${s.slice(9,11)}:${s.slice(11,13)}:${s.slice(13,15)}`;
  return new Date(isUtc ? iso + "Z" : iso);
}

function decodeIcsText(val) {
  return val
    .replace(/\\n/g, " ")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\")
    .trim();
}

function fmtTime(date) {
  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  });
}

// ── Room extraction ───────────────────────────────────────────────────────────
// TimeEdit LOCATION field: "CHANZY Salle 01 INFO, CHANZY Salle 05" (comma-separated)

function extractRoomsFromLocation(location) {
  if (!location) return [];
  // TimeEdit sépare les salles par virgule OU double espace
  return location.split(/,|\s{2,}/).map(s => s.trim()).filter(Boolean);
}

function computeRoomStatus(events) {
  const now = new Date();
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);

  // Gather all unique rooms from today's events
  const todayEvents = events.filter(e =>
    e.location && e.start <= todayEnd && e.end >= todayStart
  );

  const allRooms = new Set();
  for (const e of todayEvents) {
    for (const r of extractRoomsFromLocation(e.location)) {
      allRooms.add(r);
    }
  }

  // Compute status per room
  const roomList = [];
  for (const roomName of [...allRooms].sort()) {
    const busy = todayEvents
      .filter(e => extractRoomsFromLocation(e.location).includes(roomName))
      .sort((a, b) => a.start - b.start);

    const currentEvent = busy.find(e => e.start <= now && e.end > now);
    const isFree = !currentEvent;

    const nextBusy = isFree ? busy.find(e => e.start > now) : null;
    const nextChange = isFree
      ? (nextBusy ? nextBusy.start : null)
      : currentEvent.end;

    // Short display name: remove "CHANZY " prefix
    const label = roomName.replace(/^CHANZY\s*/i, "").trim();

    roomList.push({
      id: roomName,
      label,
      free: isFree,
      freeUntil: isFree && nextChange ? fmtTime(nextChange) : null,
      busyUntil: !isFree && nextChange ? fmtTime(nextChange) : null,
      currentEvent: currentEvent
        ? { title: currentEvent.title, end: fmtTime(currentEvent.end) }
        : null,
      nextEvent: nextBusy
        ? { title: nextBusy.title, start: fmtTime(nextBusy.start) }
        : null,
      schedule: busy.map(e => ({
        title: e.title,
        start: fmtTime(e.start),
        end: fmtTime(e.end),
      })),
    });
  }

  return roomList;
}

// ── GET handler ───────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const bust = searchParams.get("bust");
    const debug = searchParams.get("debug");

    const now = Date.now();
    if (!bust && !debug && _cache.data && now - _cache.builtAt < _cache.ttlMs) {
      return NextResponse.json(_cache.data);
    }

    const res = await fetch(TIMEEDIT_ICS_URL, {
      signal: AbortSignal.timeout(10000),
      headers: { "Accept": "text/calendar, */*" },
    });

    if (!res.ok) {
      throw new Error(`TimeEdit ICS fetch failed: ${res.status}`);
    }

    const raw = await res.text();

    if (debug) {
      const events = parseIcs(raw);
      const locations = [...new Set(events.map(e => e.location).filter(Boolean))].sort();
      return NextResponse.json({ totalEvents: events.length, locations, sampleRaw: raw.slice(0, 500) });
    }

    const events = parseIcs(raw);
    const rooms = computeRoomStatus(events);

    const data = {
      updatedAt: new Date().toISOString(),
      source: TIMEEDIT_HTML_URL,
      totalEvents: events.length,
      rooms,
    };

    _cache = { data, builtAt: now, ttlMs: 5 * 60 * 1000 };
    return NextResponse.json(data);
  } catch (err) {
    console.error("[timeedit]", err);
    // Return stale cache if available rather than error
    if (_cache.data) return NextResponse.json({ ..._cache.data, stale: true });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
