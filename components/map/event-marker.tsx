"use client";

import { Marker } from "react-simple-maps";
import type { MapEvent } from "@/types/event";

const TYPE_COLORS: Record<string, string> = {
  explosion:   "#f97316",
  attack:      "#ef4444",
  battle:      "#dc2626",
  bombardment: "#a855f7",
  protest:     "#eab308",
  casualties:  "#64748b",
  diplomacy:   "#22c55e",
  news:        "#3b82f6",
  conflict:    "#3b82f6",
};

const SOURCE_RING: Record<string, string> = {
  gdelt:  "#60a5fa",
  rss:    "#c084fc",
  manual: "#fb923c",
};

interface EventMarkerProps {
  event: MapEvent;
  zoom: number;
  onHover: (event: MapEvent | null, e?: React.MouseEvent) => void;
}

export function EventMarker({ event, zoom, onHover }: EventMarkerProps) {
  const fill = TYPE_COLORS[event.type ?? "news"] ?? "#3b82f6";
  const ring = SOURCE_RING[event.source] ?? "#3b82f6";

  // Keep visual size constant by dividing SVG units by zoom
  const half = 2.5 / zoom;
  const sw = 0.8 / zoom;
  const pulseFrom = 3 / zoom;
  const pulseTo = 11 / zoom;

  return (
    <Marker coordinates={[event.lng, event.lat]}>
      <g
        onMouseEnter={(e) => onHover(event, e)}
        onMouseLeave={() => onHover(null)}
        onClick={() => event.url && window.open(event.url, "_blank")}
        style={{ cursor: event.url ? "pointer" : "default" }}
      >
        {/* Animated pulse ring */}
        <circle r={pulseFrom} fill={ring} opacity={0}>
          <animate attributeName="r" from={String(pulseFrom)} to={String(pulseTo)} dur="2.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" from="0.5" to="0" dur="2.5s" repeatCount="indefinite" />
        </circle>

        {/* Diamond shape */}
        <rect
          x={-half}
          y={-half}
          width={half * 2}
          height={half * 2}
          fill={fill}
          stroke="#fff"
          strokeWidth={sw}
          opacity={0.9}
          transform="rotate(45)"
        />
      </g>
    </Marker>
  );
}
