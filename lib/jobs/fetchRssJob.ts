import { fetchAllRssFeeds } from "@/lib/data_sources/rss";
import { parseRssEvent } from "@/lib/parsers/parseRssEvent";
import { saveEvents } from "@/lib/database/eventService";
import type { MapEvent } from "@/types/event";

export interface JobResult {
  saved: number;
  skipped: number;
}

export async function runFetchRssJob(): Promise<JobResult> {
  console.log("[RssJob] Fetching feeds...");
  const feeds = await fetchAllRssFeeds();

  const events: MapEvent[] = [];
  let skipped = 0;

  for (const { items } of feeds) {
    for (const item of items) {
      const event = parseRssEvent(item);
      if (event) {
        events.push(event);
      } else {
        skipped++;
      }
    }
  }

  saveEvents(events);
  console.log(`[RssJob] Saved ${events.length}, skipped ${skipped}`);
  return { saved: events.length, skipped };
}
