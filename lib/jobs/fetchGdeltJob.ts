import { fetchAllGdeltArticles } from "@/lib/data_sources/gdelt";
import { parseGdeltEvent } from "@/lib/parsers/parseGdeltEvent";
import { saveEvents } from "@/lib/database/eventService";
import type { MapEvent } from "@/types/event";

export interface JobResult {
  saved: number;
  skipped: number;
}

export async function runFetchGdeltJob(): Promise<JobResult> {
  console.log("[GdeltJob] Fetching articles...");
  const articles = await fetchAllGdeltArticles();

  const events: MapEvent[] = [];
  let skipped = 0;

  for (const article of articles) {
    const event = parseGdeltEvent(article);
    if (event) {
      events.push(event);
    } else {
      skipped++;
    }
  }

  saveEvents(events);
  console.log(`[GdeltJob] Saved ${events.length}, skipped ${skipped}`);
  return { saved: events.length, skipped };
}
