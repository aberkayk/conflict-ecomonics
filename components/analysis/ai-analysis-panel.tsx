"use client";

import { useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnalysis } from "@/hooks/use-analysis";
import type { AnalysisRequest } from "@/types";

interface AiAnalysisPanelProps {
  request: AnalysisRequest;
  autoStart?: boolean;
}

export function AiAnalysisPanel({ request, autoStart = true }: AiAnalysisPanelProps) {
  const { content, isStreaming, error, startAnalysis } = useAnalysis();

  useEffect(() => {
    if (autoStart && !content && !isStreaming) {
      startAnalysis(request);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
            AI Economic Analysis
            {isStreaming && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground font-normal">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Analyzing...
              </span>
            )}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => startAnalysis(request)}
            disabled={isStreaming}
            className="text-xs"
          >
            {isStreaming ? "Analyzing..." : "Re-analyze"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="text-sm text-destructive bg-destructive/10 rounded-md p-3 mb-3">
            {error}
          </div>
        )}
        {!content && !isStreaming && !error && (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        )}
        {content && (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
