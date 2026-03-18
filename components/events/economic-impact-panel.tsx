"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MapEvent } from "@/types/event";

const MIN_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes
const NEW_EVENTS_THRESHOLD = 10;        // trigger after 10 new events

interface Props {
  events: MapEvent[];
  bare?: boolean;
}

export function EconomicImpactPanel({ events, bare }: Props) {
  const [analysis, setAnalysis] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasRun, setHasRun] = useState(false);
  const lastRunAt = useRef<number>(0);
  const lastEventCount = useRef<number>(0);

  const runAnalysis = useCallback(async () => {
    if (events.length === 0) return;
    setLoading(true);
    setError(null);
    setAnalysis("");
    setHasRun(true);
    lastRunAt.current = Date.now();
    lastEventCount.current = events.length;

    try {
      const res = await fetch("/api/events/economic-impact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          events: events.slice(0, 40).map((e) => ({
            title: e.title,
            type: e.type,
            country: e.country,
            date: e.date,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") break;
          try {
            const parsed = JSON.parse(payload);
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.content) setAnalysis(parsed.content);
          } catch (e) {
            if (e instanceof Error && e.message !== "JSON") throw e;
          }
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [events]);

  // Auto-trigger: only when 10+ new events arrive AND 15 min cooldown passed
  useEffect(() => {
    if (loading) return;
    const newEvents = events.length - lastEventCount.current;
    const cooldownPassed = Date.now() - lastRunAt.current >= MIN_INTERVAL_MS;
    if (newEvents >= NEW_EVENTS_THRESHOLD && cooldownPassed) {
      runAnalysis();
    }
  }, [events.length, loading, runAnalysis]);

  const analyzeBtn = (
    <button
      onClick={runAnalysis}
      disabled={loading || events.length === 0}
      className="text-[10px] px-2.5 py-1 rounded-full border border-violet-500/40 text-violet-600 dark:text-violet-400 hover:bg-violet-500/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
    >
      {loading ? (
        <>
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse" />
          Analyzing…
        </>
      ) : hasRun ? (
        "Refresh"
      ) : (
        "Analyze"
      )}
    </button>
  );

  const body = (
    <>
      {!hasRun && !loading && (
        <div className="flex flex-col items-center justify-center h-28 gap-2 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground/40">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <path d="M12 17h.01" />
          </svg>
          <p className="text-xs text-muted-foreground">
            Click <span className="font-medium">Analyze</span> to generate economic impact assessment
          </p>
        </div>
      )}
      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive">
          {error}
        </div>
      )}
      {analysis && (
        <div className="prose prose-xs dark:prose-invert max-w-none text-xs leading-relaxed [&_h2]:text-xs [&_h2]:font-semibold [&_h2]:mt-3 [&_h2]:mb-1 [&_ul]:mt-1 [&_ul]:space-y-0.5 [&_li]:text-[11px] [&_strong]:font-semibold">
          <ReactMarkdown>{analysis}</ReactMarkdown>
        </div>
      )}
      {loading && !analysis && (
        <div className="flex flex-col gap-2 animate-pulse pt-2">
          <div className="h-3 rounded bg-muted w-3/4" />
          <div className="h-3 rounded bg-muted w-full" />
          <div className="h-3 rounded bg-muted w-5/6" />
          <div className="h-3 rounded bg-muted w-2/3 mt-2" />
          <div className="h-3 rounded bg-muted w-full" />
        </div>
      )}
    </>
  );

  if (bare) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-muted-foreground">
            Based on {events.length} live events
          </p>
          {analyzeBtn}
        </div>
        {body}
      </div>
    );
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-violet-500">
              <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9" />
              <path d="M12 3v4" />
              <path d="m16.24 7.76 2.83-2.83" />
              <path d="M21 12h-4" />
            </svg>
            AI Economic Impact
          </CardTitle>
          {analyzeBtn}
        </div>
        <p className="text-[10px] text-muted-foreground">
          AI-generated analysis based on {events.length} live events
        </p>
      </CardHeader>
      <CardContent className="flex-1 pt-0">{body}</CardContent>
    </Card>
  );
}
