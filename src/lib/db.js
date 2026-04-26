import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { EventEmitter } from "events";

// MUST be on globalThis — Turbopack creates separate module instances per route,
// so a plain module-level EventEmitter would be different in /api/stream vs /api/dashboard.
if (!globalThis.__dbEvents) {
  globalThis.__dbEvents = new EventEmitter();
  globalThis.__dbEvents.setMaxListeners(50); // allow many SSE clients
}
export const dbEvents = globalThis.__dbEvents;

const dbPath = path.join(process.cwd(), "data", "db.sqlite");
const jsonPath = path.join(process.cwd(), "data", "db.json");

// Ensure data directory exists
if (!fs.existsSync(path.dirname(dbPath))) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}

// MUST be on globalThis for the same reason as dbEvents —
// Turbopack gives each route module its own scope.
if (!globalThis.__db) {
  globalThis.__db = new Database(dbPath);
  globalThis.__db.pragma("journal_mode = WAL");
  globalThis.__db.exec(`
    CREATE TABLE IF NOT EXISTS store (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);
}
const db = globalThis.__db;


// Function to migrate from db.json if sqlite is empty
function migrateFromJson() {
  const count = db.prepare("SELECT COUNT(*) as c FROM store").get().c;
  if (count === 0 && fs.existsSync(jsonPath)) {
    console.log("Migrating db.json to db.sqlite...");
    try {
      const data = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
      const insert = db.prepare("INSERT INTO store (key, value) VALUES (@key, @value)");
      const transaction = db.transaction((entries) => {
        for (const [key, value] of entries) {
          insert.run({ key, value: JSON.stringify(value) });
        }
      });
      transaction(Object.entries(data));
      console.log("Migration complete!");
    } catch (err) {
      console.error("Migration failed:", err);
    }
  }
}

migrateFromJson();

export function getStore(key) {
  const row = db.prepare("SELECT value FROM store WHERE key = ?").get(key);
  return row ? JSON.parse(row.value) : null;
}

export function setStore(key, value) {
  const stmt = db.prepare(`
    INSERT INTO store (key, value)
    VALUES (@key, @value)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `);
  stmt.run({ key, value: JSON.stringify(value) });
  dbEvents.emit("change", key);
}

export function getFullDb() {
  const rows = db.prepare("SELECT * FROM store").all();
  const result = {};
  for (const row of rows) {
    result[row.key] = JSON.parse(row.value);
  }
  return result;
}

export function updateFullDb(data) {
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
}

export default db;
