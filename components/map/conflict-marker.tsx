"use client";

import { Marker } from "react-simple-maps";
import { SEVERITY_COLORS } from "@/lib/constants";
import type { Conflict } from "@/types";

interface ConflictMarkerProps {
  conflict: Conflict;
  zoom: number;
  onHover: (conflict: Conflict | null, event?: React.MouseEvent) => void;
  onClick: (conflict: Conflict) => void;
}

export function ConflictMarker({ conflict, zoom, onHover, onClick }: ConflictMarkerProps) {
  const color = SEVERITY_COLORS[conflict.severity];
  // Base size in screen-pixels; divide by zoom to keep it constant on screen
  const baseSize = conflict.severity === "critical" ? 8 : conflict.severity === "high" ? 6 : 4;
  const r = baseSize / zoom;
  const stroke = 1.5 / zoom;
  const labelOffset = -(r + 5 / zoom);
  const fontSize = 5 / zoom;
  const labelStroke = 2.5 / zoom;

  return (
    <Marker coordinates={[conflict.longitude, conflict.latitude]}>
      <g
        onMouseEnter={(e) => onHover(conflict, e)}
        onMouseLeave={() => onHover(null)}
        onClick={() => onClick(conflict)}
        className="cursor-pointer"
      >
        {/* Pulse animation ring */}
        <circle r={r + 4 / zoom} fill={color} opacity={0.2}>
          <animate
            attributeName="r"
            from={String(r + 2 / zoom)}
            to={String(r + 10 / zoom)}
            dur="2s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            from="0.3"
            to="0"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>
        {/* Main marker */}
        <circle r={r} fill={color} stroke="#fff" strokeWidth={stroke} opacity={0.9} />
        {/* Country label */}
        <text
          textAnchor="middle"
          y={labelOffset}
          style={{ fontSize: `${fontSize}px`, fontWeight: "600", pointerEvents: "none" }}
          stroke="#fff"
          strokeWidth={labelStroke}
          strokeLinejoin="round"
          paintOrder="stroke"
          fill="#1f2937"
        >
          {conflict.countries[0]}
        </text>
      </g>
    </Marker>
  );
}
