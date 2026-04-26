import path from "path";
import fs from "fs";
import { EventEmitter } from "events";

// --- Database Configuration ---
const isVercel = process.env.VERCEL === "1";

// On Vercel, we must use /tmp for writable files. 
// Otherwise, use the local data directory.
const DATA_DIR = isVercel ? "/tmp" : path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "db.sqlite");
const JSON_PATH = path.join(process.cwd(), "data", "db.json");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (e) {
    console.error("Failed to create data directory:", e);
  }
}

// Global instances to persist across Hot Module Replacement (HMR) and route calls
if (!globalThis.__dbEvents) {
  globalThis.__dbEvents = new EventEmitter();
  globalThis.__dbEvents.setMaxListeners(100);
}
export const dbEvents = globalThis.__dbEvents;

if (!globalThis.__db) {
  try {
    const Database = require("better-sqlite3");
    
    // Seed the /tmp database from the committed one if it doesn't exist yet
    if (isVercel && !fs.existsSync(DB_PATH)) {
      const sourceDb = path.join(process.cwd(), "data", "db.sqlite");
      if (fs.existsSync(sourceDb)) {
        console.log("Seeding SQLite from committed database...");
        fs.copyFileSync(sourceDb, DB_PATH);
      }
    }

    const db = new Database(DB_PATH, { timeout: 5000 });
    db.pragma("journal_mode = WAL");
    db.exec(`
      CREATE TABLE IF NOT EXISTS store (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `);
    globalThis.__db = db;
    console.log(`Database initialized at ${DB_PATH}`);
  } catch (err) {
    console.error("SQLite initialization failed. Falling back to memory storage.", err);
    // Fallback Mock DB
    const memoryStore = new Map();
    globalThis.__db = {
      _memory: memoryStore,
      prepare: (sql) => ({
        get: (key) => {
          const val = memoryStore.get(key);
          return val ? { value: val } : null;
        },
        all: () => Array.from(memoryStore.entries()).map(([k, v]) => ({ key: k, value: v })),
        run: (params) => {
          if (params.key) memoryStore.set(params.key, params.value);
        }
      }),
      transaction: (fn) => (args) => fn(args),
      exec: () => {},
      pragma: () => {}
    };
  }
}

const db = globalThis.__db;

// Migration logic
function migrateFromJson() {
  try {
    const countRow = db.prepare("SELECT COUNT(*) as c FROM store").get();
    const count = countRow ? countRow.c : 0;
    
    if (count === 0 && fs.existsSync(JSON_PATH)) {
      console.log("Migrating db.json to store...");
      const data = JSON.parse(fs.readFileSync(JSON_PATH, "utf-8"));
      const insert = db.prepare("INSERT INTO store (key, value) VALUES (@key, @value)");
      
      const entries = Object.entries(data);
      const transaction = db.transaction((items) => {
        for (const [key, value] of items) {
          insert.run({ key, value: JSON.stringify(value) });
        }
      });
      transaction(entries);
      console.log("Migration complete!");
    }
  } catch (err) {
    console.error("Migration failed:", err);
  }
}

migrateFromJson();

export function getStore(key) {
  try {
    const row = db.prepare("SELECT value FROM store WHERE key = ?").get(key);
    return row ? JSON.parse(row.value) : null;
  } catch (e) {
    return null;
  }
}

export function setStore(key, value) {
  try {
    const stmt = db.prepare(`
      INSERT INTO store (key, value)
      VALUES (@key, @value)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `);
    stmt.run({ key, value: JSON.stringify(value) });
    dbEvents.emit("change", key);
  } catch (e) {
    console.error("setStore error:", e);
  }
}

export function getFullDb() {
  try {
    const rows = db.prepare("SELECT * FROM store").all();
    const result = {};
    for (const row of rows) {
      result[row.key] = JSON.parse(row.value);
    }
    return result;
  } catch (e) {
    return {};
  }
}

export function updateFullDb(data) {
  try {
    const stmt = db.prepare(`
      INSERT INTO store (key, value)
      VALUES (@key, @value)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `);
    const transaction = db.transaction((entries) => {
      for (const [key, value] of entries) {
        stmt.run({ key, value: JSON.stringify(value) });
      }
    });
    transaction(Object.entries(data));
    dbEvents.emit("change", "all");
  } catch (e) {
    console.error("updateFullDb error:", e);
  }
}

export default db;

