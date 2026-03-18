"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LiveEventsList } from "./live-events-list";
import { EconomicImpactPanel } from "./economic-impact-panel";
import type { MapEvent } from "@/types/event";

interface Props {
  events: MapEvent[];
  isLoading?: boolean;
  stats?: { total: number; gdelt: number; rss: number; manual: number };
}

export function EventsPanel({ events, isLoading, stats }: Props) {
  const [tab, setTab] = useState<"events" | "ai">("events");

  return (
    <Card className="flex flex-col h-full">
      {/* Tab bar */}
      <CardHeader className="pb-0 shrink-0 px-4 pt-3">
        <div className="flex gap-1 border-b">
          <button
            onClick={() => setTab("events")}
            className={`pb-2 px-1 text-xs font-medium transition-colors border-b-2 -mb-px ${
              tab === "events"
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500" />
              </span>
              Live Events
              {stats && (
                <span className="text-[10px] text-muted-foreground">
                  ({stats.total})
                </span>
              )}
            </span>
          </button>

          <button
            onClick={() => setTab("ai")}
            className={`pb-2 px-1 text-xs font-medium transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${
              tab === "ai"
                ? "border-violet-500 text-violet-600 dark:text-violet-400"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9" />
              <path d="M12 3v4" />
              <path d="m16.24 7.76 2.83-2.83" />
              <path d="M21 12h-4" />
            </svg>
            AI Analysis
          </button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0">
        {tab === "events" ? (
          /* Strip the card wrapper — render inner content only */
          <LiveEventsList
            events={events}
            isLoading={isLoading}
            stats={stats}
            bare
          />
        ) : (
          <div className="h-full overflow-y-auto px-4 py-3">
            <EconomicImpactPanel events={events} bare />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
