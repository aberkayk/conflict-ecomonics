import type { MapEvent } from "@/types/event";
import { detectLocation } from "./locationDetector";

export interface GdeltArticle {
  url: string;
  url_mobile?: string;
  title: string;
  seendate: string; // "20240315T120000Z"
  socialimage?: string;
  domain?: string;
  language?: string;
  sourcecountry?: string;
}

export function parseGdeltEvent(article: GdeltArticle): MapEvent | null {
  const title = article.title?.trim();
  if (!title) return null;

  const location = detectLocation(title, "", article.sourcecountry);
  if (!location) return null;

  const date = parseGdeltDate(article.seendate);
  if (!date) return null;

  return {
    id: crypto.randomUUID(),
    title,
    description: `Reported by ${article.domain ?? "unknown source"}`,
    lat: location.lat,
    lng: location.lng,
    country: location.country,
    source: "gdelt",
    url: article.url,
    date,
    type: classifyTitle(title),
  };
}

function parseGdeltDate(seendate: string): string | null {
  try {
    // Format: "20240315T120000Z" or "20240315120000"
    const digits = seendate.replace(/[^0-9]/g, "");
    const year  = digits.substring(0, 4);
    const month = digits.substring(4, 6);
    const day   = digits.substring(6, 8);
    const hour  = digits.substring(8, 10)  || "00";
    const min   = digits.substring(10, 12) || "00";
    const sec   = digits.substring(12, 14) || "00";
    if (!year || !month || !day) return null;
    return `${year}-${month}-${day}T${hour}:${min}:${sec}Z`;
  } catch {
    return null;
  }
}

function classifyTitle(title: string): string {
  const t = title.toLowerCase();
  if (/\b(bomb|explo|blast|airstrike|air strike)\b/.test(t)) return "explosion";
  if (/\b(attack|assault|raid|ambush)\b/.test(t)) return "attack";
  if (/\b(protest|demonstrat|march|riot|uprising)\b/.test(t)) return "protest";
  if (/\b(war|battle|fight|clash|combat|offensive)\b/.test(t)) return "battle";
  if (/\b(missile|rocket|shell|drone strike)\b/.test(t)) return "bombardment";
  if (/\b(kill|dead|death|fatal|casualties|massacre)\b/.test(t)) return "casualties";
  if (/\b(ceasefire|peace|truce|negotiat|diplomacy)\b/.test(t)) return "diplomacy";
  return "conflict";
}
