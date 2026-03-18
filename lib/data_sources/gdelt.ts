import type { GdeltArticle } from "@/lib/parsers/parseGdeltEvent";

const BASE_URL = "https://api.gdeltproject.org/api/v2/doc/doc";

// Fewer, broader queries to stay well under GDELT's rate limit.
// Each query fetches 100 articles (vs 50 × 10) for the same coverage.
const QUERIES = [
  "war conflict attack airstrike explosion",
  "ukraine russia israel gaza iran",
  "sudan myanmar yemen somalia protest riot",
  "ceasefire military offensive casualties",
];

export interface GdeltResponse {
  articles?: GdeltArticle[];
  articles_count?: number;
}

const RETRY_DELAYS_MS = [3_000, 8_000, 20_000]; // backoff on 429

export async function fetchGdeltArticles(
  query: string,
  maxRecords = 100
): Promise<GdeltArticle[]> {
  const params = new URLSearchParams({
    query,
    mode: "artlist",
    maxrecords: String(maxRecords),
    format: "json",
    timespan: "24h",
    sourcelang: "eng",
  });

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    const response = await fetch(`${BASE_URL}?${params}`, {
      signal: AbortSignal.timeout(20_000),
      headers: { "User-Agent": "ConflictTracker/1.0" },
    });

    if (response.status === 429) {
      const wait = RETRY_DELAYS_MS[attempt];
      if (wait === undefined) throw new Error("GDELT 429: rate limit exceeded after retries");
      console.warn(`[GDELT] 429 rate limit — waiting ${wait / 1000}s before retry`);
      await sleep(wait);
      continue;
    }

    if (!response.ok) {
      throw new Error(`GDELT ${response.status}: ${response.statusText}`);
    }

    const data = (await response.json()) as GdeltResponse;
    return data.articles ?? [];
  }

  return []; // unreachable but satisfies TypeScript
}

export async function fetchAllGdeltArticles(): Promise<GdeltArticle[]> {
  const results: GdeltArticle[] = [];
  const seenUrls = new Set<string>();

  for (const query of QUERIES) {
    try {
      const articles = await fetchGdeltArticles(query, 100);
      for (const article of articles) {
        if (!seenUrls.has(article.url)) {
          seenUrls.add(article.url);
          results.push(article);
        }
      }
      // Respect GDELT's rate limit — 2 s between queries
      await sleep(2_000);
    } catch (err) {
      console.warn(`[GDELT] Query "${query}" failed:`, err);
    }
  }

  console.log(`[GDELT] Collected ${results.length} unique articles`);
  return results;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
