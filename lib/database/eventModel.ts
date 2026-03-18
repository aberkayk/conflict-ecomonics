import type { MapEvent } from "@/types/event";
import { getDb } from "@/lib/db";

interface DbRow {
  id: string;
  title: string;
  description: string;
  lat: number;
  lng: number;
  country: string | null;
  source: string;
  url: string | null;
  date: string;
  type: string | null;
  created_at: string;
}

function rowToEvent(row: DbRow): MapEvent {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    lat: row.lat,
    lng: row.lng,
    country: row.country ?? undefined,
    source: row.source as MapEvent["source"],
    url: row.url ?? undefined,
    date: row.date,
    type: row.type ?? undefined,
  };
}

export function insertEvent(event: MapEvent): void {
  const db = getDb();
  db.prepare(`
    INSERT OR IGNORE INTO map_events (id, title, description, lat, lng, country, source, url, date, type)
    VALUES (@id, @title, @description, @lat, @lng, @country, @source, @url, @date, @type)
  `).run({
    id: event.id,
    title: event.title,
    description: event.description,
    lat: event.lat,
    lng: event.lng,
    country: event.country ?? null,
    source: event.source,
    url: event.url ?? null,
    date: event.date,
    type: event.type ?? null,
  });
}

export function insertEvents(events: MapEvent[]): void {
  if (events.length === 0) return;
  const db = getDb();
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO map_events (id, title, description, lat, lng, country, source, url, date, type)
    VALUES (@id, @title, @description, @lat, @lng, @country, @source, @url, @date, @type)
  `);
  const insertMany = db.transaction((rows: MapEvent[]) => {
    for (const ev of rows) {
      stmt.run({
        id: ev.id,
        title: ev.title,
        description: ev.description,
        lat: ev.lat,
        lng: ev.lng,
        country: ev.country ?? null,
        source: ev.source,
        url: ev.url ?? null,
        date: ev.date,
        type: ev.type ?? null,
      });
    }
  });
  insertMany(events);
}

export interface GetEventsOptions {
  limit?: number;
  offset?: number;
  source?: MapEvent["source"];
  country?: string;
  since?: string;
}

export function getEvents(options: GetEventsOptions = {}): MapEvent[] {
  const db = getDb();
  const conditions: string[] = ["1=1"];
  const params: Record<string, string | number> = {};

  if (options.source) {
    conditions.push("source = @source");
    params.source = options.source;
  }
  if (options.country) {
    conditions.push("country = @country");
    params.country = options.country;
  }
  if (options.since) {
    conditions.push("date >= @since");
    params.since = options.since;
  }

  let query = `SELECT * FROM map_events WHERE ${conditions.join(" AND ")} ORDER BY date DESC`;

  if (options.limit) {
    query += " LIMIT @limit";
    params.limit = options.limit;
  }
  if (options.offset) {
    query += " OFFSET @offset";
    params.offset = options.offset;
  }

  const rows = db.prepare(query).all(params) as DbRow[];
  return rows.map(rowToEvent);
}

export function countEvents(source?: MapEvent["source"]): number {
  const db = getDb();
  if (source) {
    const row = db
      .prepare("SELECT COUNT(*) as n FROM map_events WHERE source = ?")
      .get(source) as { n: number };
    return row.n;
  }
  const row = db
    .prepare("SELECT COUNT(*) as n FROM map_events")
    .get() as { n: number };
  return row.n;
}

export function pruneOldEvents(daysToKeep = 30): void {
  const db = getDb();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysToKeep);
  db.prepare(
    "DELETE FROM map_events WHERE date < ? AND source != 'manual'"
  ).run(cutoff.toISOString().split("T")[0]);
}
