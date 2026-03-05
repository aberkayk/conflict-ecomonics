"use client";

import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { NewsArticle } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface ConflictNewsFeedProps {
  conflictName: string;
}

export function ConflictNewsFeed({ conflictName }: ConflictNewsFeedProps) {
  const { data, isLoading } = useSWR<{ articles: NewsArticle[] }>(
    `/api/news?q=${encodeURIComponent(conflictName)}&limit=6`,
    fetcher,
    { revalidateOnFocus: false }
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Related News</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {data?.articles?.map((article, i) => (
              <a
                key={i}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0">
                    <h4 className="text-sm font-medium line-clamp-1">{article.title}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                      {article.description}
                    </p>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {article.source}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {new Date(article.publishedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </a>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
