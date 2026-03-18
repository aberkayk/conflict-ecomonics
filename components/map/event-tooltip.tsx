"use client";

import type { MapEvent } from "@/types/event";

const SOURCE_LABEL: Record<string, string> = {
  gdelt:  "GDELT",
  rss:    "RSS",
  manual: "Manual",
};

const SOURCE_COLOR: Record<string, string> = {
  gdelt:  "bg-blue-500/15 text-blue-600",
  rss:    "bg-purple-500/15 text-purple-600",
  manual: "bg-orange-500/15 text-orange-600",
};

interface EventTooltipProps {
  event: MapEvent;
  position: { x: number; y: number };
}

export function EventTooltip({ event, position }: EventTooltipProps) {
  return (
    <div
      className="absolute z-50 bg-popover text-popover-foreground border rounded-lg shadow-lg p-3 pointer-events-none max-w-[280px]"
      style={{ left: position.x + 12, top: position.y - 10 }}
    >
      {/* badges row */}
      <div className="flex items-center gap-1.5 mb-1.5">
        <span
          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${SOURCE_COLOR[event.source] ?? ""}`}
        >
          {SOURCE_LABEL[event.source] ?? event.source}
        </span>
        {event.type && (
          <span className="text-[10px] text-muted-foreground capitalize">
            {event.type}
          </span>
        )}
      </div>

      {/* title */}
      <p className="text-xs font-medium leading-snug mb-1.5 line-clamp-3">
        {event.title}
      </p>

      {/* meta row */}
      <p className="text-[11px] text-muted-foreground">
        {[event.country, event.date].filter(Boolean).join(" · ")}
      </p>

      {event.url && (
        <p className="text-[10px] text-primary mt-1">Click to open article ↗</p>
      )}
    </div>
  );
}
