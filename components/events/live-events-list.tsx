"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { MapEvent } from "@/types/event";

const SOURCE_STYLE: Record<string, string> = {
  gdelt:  "bg-blue-500/15 text-blue-600 border-blue-500/30",
  rss:    "bg-purple-500/15 text-purple-600 border-purple-500/30",
  manual: "bg-orange-500/15 text-orange-600 border-orange-500/30",
};

const TYPE_DOT: Record<string, string> = {
  explosion:   "bg-orange-500",
  attack:      "bg-red-500",
  battle:      "bg-red-700",
  bombardment: "bg-purple-500",
  protest:     "bg-yellow-500",
  casualties:  "bg-slate-500",
  diplomacy:   "bg-green-500",
  news:        "bg-blue-500",
  conflict:    "bg-blue-500",
};

const ALL_SOURCES = ["all", "gdelt", "rss", "manual"] as const;
type FilterSource = (typeof ALL_SOURCES)[number];

interface LiveEventsListProps {
  events: MapEvent[];
  isLoading?: boolean;
  stats?: { total: number; gdelt: number; rss: number; manual: number };
  bare?: boolean;
}

export function LiveEventsList({ events, isLoading, stats, bare }: LiveEventsListProps) {
  const [filter, setFilter] = useState<FilterSource>("all");

  const visible = filter === "all" ? events : events.filter((e) => e.source === filter);

  const filterBar = (
    <div className="flex gap-1 flex-wrap px-4 py-2 border-b">
      {ALL_SOURCES.map((s) => (
        <button
          key={s}
          onClick={() => setFilter(s)}
          className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors capitalize ${
            filter === s
              ? "bg-foreground text-background border-foreground"
              : "border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          {s === "all" ? `All${stats ? ` (${stats.total})` : ""}` : `${s}${stats ? ` (${stats[s as keyof typeof stats]})` : ""}`}
        </button>
      ))}
    </div>
  );

  if (bare) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        {filterBar}
        <div className="flex-1 overflow-y-auto">
          {isLoading && (
            <div className="flex items-center justify-center h-32 text-xs text-muted-foreground">
              Loading events…
            </div>
          )}
          {!isLoading && visible.length === 0 && (
            <div className="flex flex-col items-center justify-center h-32 text-xs text-muted-foreground gap-1">
              <span>No events yet</span>
              <span className="text-[10px]">Fetching from RSS & GDELT…</span>
            </div>
          )}
          <ul className="divide-y divide-border">
            {visible.slice(0, 80).map((event) => (
              <li key={event.id} className="px-4 py-2.5 hover:bg-muted/40 transition-colors">
                <div className="flex items-start gap-2">
                  <span className={`mt-1.5 shrink-0 h-2 w-2 rounded-full ${TYPE_DOT[event.type ?? "news"] ?? "bg-blue-500"}`} />
                  <div className="min-w-0 flex-1">
                    {event.url ? (
                      <a href={event.url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium leading-snug hover:underline line-clamp-2">{event.title}</a>
                    ) : (
                      <p className="text-xs font-medium leading-snug line-clamp-2">{event.title}</p>
                    )}
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <Badge variant="outline" className={`text-[9px] px-1 py-0 h-4 ${SOURCE_STYLE[event.source] ?? ""}`}>{event.source.toUpperCase()}</Badge>
                      {event.country && <span className="text-[10px] text-muted-foreground">{event.country}</span>}
                      <span className="text-[10px] text-muted-foreground ml-auto">
                        {event.date.includes("T")
                          ? new Date(event.date).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
                          : new Date(event.date + "T12:00:00").toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                      </span>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          {visible.length > 80 && (
            <p className="text-center text-[10px] text-muted-foreground py-2">Showing 80 of {visible.length}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-2 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
            </span>
            Live Events
          </CardTitle>
          {stats && (
            <span className="text-xs text-muted-foreground">{stats.total} total</span>
          )}
        </div>

        {/* Source filter tabs */}
        <div className="flex gap-1 mt-2 flex-wrap">
          {ALL_SOURCES.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors capitalize ${
                filter === s
                  ? "bg-foreground text-background border-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {s === "all" ? `All${stats ? ` (${stats.total})` : ""}` : `${s}${stats ? ` (${stats[s as keyof typeof stats]})` : ""}`}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="overflow-y-auto flex-1 p-0">
        {isLoading && (
          <div className="flex items-center justify-center h-32 text-xs text-muted-foreground">
            Loading events…
          </div>
        )}

        {!isLoading && visible.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-xs text-muted-foreground gap-1">
            <span>No events yet</span>
            <span className="text-[10px]">Fetching from RSS & GDELT…</span>
          </div>
        )}

        <ul className="divide-y divide-border">
          {visible.slice(0, 80).map((event) => (
            <li key={event.id} className="px-4 py-2.5 hover:bg-muted/40 transition-colors">
              <div className="flex items-start gap-2">
                {/* type dot */}
                <span
                  className={`mt-1.5 shrink-0 h-2 w-2 rounded-full ${TYPE_DOT[event.type ?? "news"] ?? "bg-blue-500"}`}
                />

                <div className="min-w-0 flex-1">
                  {event.url ? (
                    <a
                      href={event.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium leading-snug hover:underline line-clamp-2"
                    >
                      {event.title}
                    </a>
                  ) : (
                    <p className="text-xs font-medium leading-snug line-clamp-2">
                      {event.title}
                    </p>
                  )}

                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <Badge
                      variant="outline"
                      className={`text-[9px] px-1 py-0 h-4 ${SOURCE_STYLE[event.source] ?? ""}`}
                    >
                      {event.source.toUpperCase()}
                    </Badge>
                    {event.country && (
                      <span className="text-[10px] text-muted-foreground">
                        {event.country}
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground ml-auto">
                      {event.date.includes("T")
                        ? new Date(event.date).toLocaleString(undefined, {
                            day: "numeric", month: "short",
                            hour: "2-digit", minute: "2-digit",
                          })
                        : new Date(event.date + "T12:00:00").toLocaleDateString(undefined, {
                            day: "numeric", month: "short",
                          })}
                    </span>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {visible.length > 80 && (
          <p className="text-center text-[10px] text-muted-foreground py-2">
            Showing 80 of {visible.length}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
