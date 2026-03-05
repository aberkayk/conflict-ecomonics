export interface NewsArticle {
  title: string;
  description: string;
  url: string;
  urlToImage: string | null;
  source: string;
  publishedAt: string;
  sentiment?: "positive" | "negative" | "neutral";
}

export interface NewsResponse {
  articles: NewsArticle[];
  totalResults: number;
}
