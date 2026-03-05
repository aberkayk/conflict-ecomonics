import { cache } from "@/lib/cache";
import type { NewsArticle } from "@/types";

// ─── GDELT DOC 2.0 API (free, no key) ────────────────────────────────

interface GDELTArticle {
  url: string;
  url_mobile: string;
  title: string;
  seendate: string;
  socialimage: string;
  domain: string;
  language: string;
  sourcecountry: string;
}

interface GDELTResponse {
  articles: GDELTArticle[];
}

export async function fetchConflictNews(query: string, limit = 10): Promise<NewsArticle[]> {
  const cacheKey = `news-${query}-${limit}`;
  const cached = cache.get<NewsArticle[]>(cacheKey);
  if (cached) return cached;

  // Primary: GDELT (free, no key needed)
  const gdeltArticles = await fetchFromGDELT(query, limit);
  if (gdeltArticles.length > 0) {
    cache.set(cacheKey, gdeltArticles, 15 * 60 * 1000);
    return gdeltArticles;
  }

  // Secondary: NewsAPI (if key available)
  const newsApiKey = process.env.NEWSAPI_KEY;
  if (newsApiKey) {
    const newsApiArticles = await fetchFromNewsAPI(query, limit, newsApiKey);
    if (newsApiArticles.length > 0) {
      cache.set(cacheKey, newsApiArticles, 15 * 60 * 1000);
      return newsApiArticles;
    }
  }

  return [];
}

async function fetchFromGDELT(query: string, limit: number): Promise<NewsArticle[]> {
  try {
    const searchQuery = encodeURIComponent(`${query} economic impact`);
    const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${searchQuery}&mode=artlist&maxrecords=${limit}&format=json&sort=datedesc`;

    const res = await fetch(url, { next: { revalidate: 900 } });
    if (!res.ok) return [];

    const text = await res.text();
    if (!text.trim()) return [];

    const json = JSON.parse(text) as GDELTResponse;
    if (!json.articles || !Array.isArray(json.articles)) return [];

    return json.articles
      .filter((a) => a.title && a.url)
      .map((a) => ({
        title: a.title,
        description: `Source: ${a.domain} (${a.sourcecountry}) — Language: ${a.language}`,
        url: a.url,
        urlToImage: a.socialimage || null,
        source: a.domain,
        publishedAt: parseGDELTDate(a.seendate),
      }));
  } catch {
    return [];
  }
}

function parseGDELTDate(seendate: string): string {
  // GDELT format: "20260205T133000Z"
  if (!seendate || seendate.length < 8) return new Date().toISOString();
  try {
    const y = seendate.slice(0, 4);
    const m = seendate.slice(4, 6);
    const d = seendate.slice(6, 8);
    const h = seendate.length >= 11 ? seendate.slice(9, 11) : "00";
    const min = seendate.length >= 13 ? seendate.slice(11, 13) : "00";
    return new Date(`${y}-${m}-${d}T${h}:${min}:00Z`).toISOString();
  } catch {
    return new Date().toISOString();
  }
}

async function fetchFromNewsAPI(query: string, limit: number, apiKey: string): Promise<NewsArticle[]> {
  try {
    const params = new URLSearchParams({
      q: `${query} economy OR economic impact`,
      language: "en",
      sortBy: "publishedAt",
      pageSize: String(limit),
      apiKey,
    });

    const res = await fetch(`https://newsapi.org/v2/everything?${params}`);
    if (!res.ok) return [];

    const json = await res.json();
    return (json.articles || []).map(
      (a: { title: string; description: string; url: string; urlToImage: string | null; source: { name: string }; publishedAt: string }) => ({
        title: a.title,
        description: a.description || "",
        url: a.url,
        urlToImage: a.urlToImage,
        source: a.source?.name || "Unknown",
        publishedAt: a.publishedAt,
      })
    );
  } catch {
    return [];
  }
}
