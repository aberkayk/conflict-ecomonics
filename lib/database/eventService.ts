import {
  insertEvent,
  insertEvents,
  getEvents,
  countEvents,
  pruneOldEvents,
  type GetEventsOptions,
} from "./eventModel";
import type { MapEvent } from "@/types/event";

export type { GetEventsOptions as EventFilter };

export function saveEvent(event: MapEvent): void {
  insertEvent(event);
}

export function saveEvents(events: MapEvent[]): void {
  insertEvents(events);
}

export function fetchEvents(filter: GetEventsOptions = {}): MapEvent[] {
  return getEvents({
    limit: filter.limit ?? 200,
    offset: filter.offset ?? 0,
    source: filter.source,
    country: filter.country,
    since: filter.since,
  });
}

export function getEventStats() {
  return {
    total: countEvents(),
    gdelt: countEvents("gdelt"),
    rss: countEvents("rss"),
    manual: countEvents("manual"),
  };
}

export function cleanupOldEvents(daysToKeep = 30): void {
  pruneOldEvents(daysToKeep);
}
