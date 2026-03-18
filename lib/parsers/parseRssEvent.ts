import type { MapEvent } from "@/types/event";
import { detectLocation } from "./locationDetector";

export interface RssItem {
  title?: string;
  link?: string;
  contentSnippet?: string;
  content?: string;
  pubDate?: string;
  isoDate?: string;
}

export function parseRssEvent(item: RssItem): MapEvent | null {
  const title = item.title?.trim();
  if (!title) return null;

  const description =
    item.contentSnippet?.trim() ?? item.content?.trim() ?? "";

  const location = detectLocation(title, description);
  if (!location) return null;

  const date = item.isoDate
    ? item.isoDate                // keep full ISO datetime
    : item.pubDate
    ? parsePubDate(item.pubDate)
    : todayIso();

  return {
    id: crypto.randomUUID(),
    title,
    description: description.substring(0, 500),
    lat: location.lat,
    lng: location.lng,
    country: location.country,
    source: "rss",
    url: item.link,
    date,
    type: classifyTitle(title),
  };
}

function parsePubDate(pubDate: string): string {
  try {
    return new Date(pubDate).toISOString(); // keep full datetime
  } catch {
    return todayIso();
  }
}

function todayIso(): string {
  return new Date().toISOString();
}

function classifyTitle(title: string): string {
  const t = title.toLowerCase();
  if (/\b(bomb|explo|blast|airstrike|air strike)\b/.test(t)) return "explosion";
  if (/\b(attack|assault|raid|ambush)\b/.test(t)) return "attack";
  if (/\b(protest|demonstrat|march|riot)\b/.test(t)) return "protest";
  if (/\b(war|battle|fight|clash|offensive)\b/.test(t)) return "battle";
  if (/\b(missile|rocket|shell|drone)\b/.test(t)) return "bombardment";
  if (/\b(kill|dead|death|fatal|casualties)\b/.test(t)) return "casualties";
  if (/\b(ceasefire|peace|truce|negotiat)\b/.test(t)) return "diplomacy";
  return "news";
}
