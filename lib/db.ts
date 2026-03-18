import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_DIR = path.join(process.cwd(), ".data");
const DB_PATH = path.join(DB_DIR, "events.db");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;

  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");

  initSchema(_db);
  return _db;
}

function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS map_events (
      id          TEXT PRIMARY KEY,
      title       TEXT NOT NULL,
      description TEXT NOT NULL,
      lat         REAL NOT NULL,
      lng         REAL NOT NULL,
      country     TEXT,
      source      TEXT NOT NULL CHECK(source IN ('gdelt', 'rss', 'manual')),
      url         TEXT UNIQUE,
      date        TEXT NOT NULL,
      type        TEXT,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_map_events_date    ON map_events(date DESC);
    CREATE INDEX IF NOT EXISTS idx_map_events_source  ON map_events(source);
    CREATE INDEX IF NOT EXISTS idx_map_events_country ON map_events(country);
  `);
}
