import Parser from "rss-parser";
import type { RssItem } from "@/lib/parsers/parseRssEvent";

const RSS_FEEDS = [
  // feeds.reuters.com is decommissioned — replaced with BBC and Guardian
  { name: "BBC World", url: "https://feeds.bbci.co.uk/news/world/rss.xml" },
  { name: "Al Jazeera", url: "https://www.aljazeera.com/xml/rss/all.xml" },
  { name: "NY Times World", url: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml" },
  { name: "Guardian World", url: "https://www.theguardian.com/world/rss" },
];

const parser = new Parser({
  timeout: 15_000,
  headers: { "User-Agent": "ConflictTracker/1.0" },
});

export async function fetchRssFeed(feedUrl: string): Promise<RssItem[]> {
  const feed = await parser.parseURL(feedUrl);
  return feed.items.map((item) => ({
    title: item.title,
    link: item.link,
    contentSnippet: item.contentSnippet,
    content: item.content,
    pubDate: item.pubDate,
    isoDate: item.isoDate,
  }));
}

export async function fetchAllRssFeeds(): Promise<
  Array<{ source: string; items: RssItem[] }>
> {
  const results: Array<{ source: string; items: RssItem[] }> = [];

  for (const feed of RSS_FEEDS) {
    try {
      const items = await fetchRssFeed(feed.url);
      results.push({ source: feed.name, items });
      console.log(`[RSS] ${feed.name}: ${items.length} items`);
    } catch (err) {
      console.warn(`[RSS] ${feed.name} failed:`, err);
    }
  }

  return results;
}
