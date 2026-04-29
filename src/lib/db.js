import path from "path";
import fs from "fs";
import { EventEmitter } from "events";
import { Redis } from "@upstash/redis";

// ───────────────────────────────────────────────────────────────────
// Backend : Upstash Redis (un hash unique `pstb:store` où chaque field
// est une clé applicative). Fallback mémoire si pas de credentials —
// utile pour les builds CI ou un dev local sans env.
// ───────────────────────────────────────────────────────────────────

const HASH_KEY = "pstb:store";
const JSON_PATH = path.join(process.cwd(), "data", "db.json");

const hasUpstash =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = hasUpstash
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

// EventEmitter in-process pour SSE. Cross-instance n'est pas supporté
// (Upstash REST n'expose pas pub/sub) — c'est un compromis acceptable :
// les écrans TV refresh régulièrement via le polling existant.
if (!globalThis.__dbEvents) {
  globalThis.__dbEvents = new EventEmitter();
  globalThis.__dbEvents.setMaxListeners(100);
}
export const dbEvents = globalThis.__dbEvents;

// ── Fallback mémoire ────────────────────────────────────────────────
if (!globalThis.__memStore) globalThis.__memStore = new Map();
const memStore = globalThis.__memStore;

// ── Migration initiale db.json → Upstash (one-shot) ─────────────────
// Tourne au premier appel. Idempotent grâce au flag `pstb:migrated`.
async function ensureSeeded() {
  if (!hasUpstash) return;
  if (globalThis.__pstbSeeded) return;
  globalThis.__pstbSeeded = true;
  try {
    const flag = await redis.get("pstb:migrated");
    if (flag) return;
    if (!fs.existsSync(JSON_PATH)) {
      await redis.set("pstb:migrated", "1");
      return;
    }
    const data = JSON.parse(fs.readFileSync(JSON_PATH, "utf-8"));
    const entries = Object.entries(data);
    if (entries.length === 0) {
      await redis.set("pstb:migrated", "1");
      return;
    }
    const fields = {};
    for (const [k, v] of entries) fields[k] = JSON.stringify(v);
    await redis.hset(HASH_KEY, fields);
    await redis.set("pstb:migrated", "1");
    console.log(`[db] Seed initial Upstash : ${entries.length} clés migrées depuis db.json`);
  } catch (e) {
    console.error("[db] Seed Upstash échoué :", e.message);
  }
}

// `@upstash/redis` parse parfois les valeurs JSON automatiquement (objet)
// et parfois renvoie la string brute → on normalise.
function decode(raw) {
  if (raw == null) return null;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }
  return raw;
}

export async function getStore(key) {
  if (!hasUpstash) {
    return memStore.has(key) ? memStore.get(key) : null;
  }
  await ensureSeeded();
  try {
    const raw = await redis.hget(HASH_KEY, key);
    return decode(raw);
  } catch (e) {
    console.error("[db] getStore error:", e.message);
    return null;
  }
}

export async function setStore(key, value) {
  if (!hasUpstash) {
    memStore.set(key, value);
    dbEvents.emit("change", key);
    return;
  }
  await ensureSeeded();
  try {
    await redis.hset(HASH_KEY, { [key]: JSON.stringify(value) });
    dbEvents.emit("change", key);
  } catch (e) {
    console.error("[db] setStore error:", e.message);
  }
}

export async function getFullDb() {
  if (!hasUpstash) {
    return Object.fromEntries(memStore.entries());
  }
  await ensureSeeded();
  try {
    const raw = (await redis.hgetall(HASH_KEY)) ?? {};
    const out = {};
    for (const [k, v] of Object.entries(raw)) out[k] = decode(v);
    return out;
  } catch (e) {
    console.error("[db] getFullDb error:", e.message);
    return {};
  }
}

export async function updateFullDb(data) {
  if (!hasUpstash) {
    for (const [k, v] of Object.entries(data)) memStore.set(k, v);
    dbEvents.emit("change", "all");
    return;
  }
  await ensureSeeded();
  try {
    const fields = {};
    for (const [k, v] of Object.entries(data)) fields[k] = JSON.stringify(v);
    if (Object.keys(fields).length > 0) await redis.hset(HASH_KEY, fields);
    dbEvents.emit("change", "all");
  } catch (e) {
    console.error("[db] updateFullDb error:", e.message);
  }
}
