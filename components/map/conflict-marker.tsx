"use client";

import { Marker } from "react-simple-maps";
import { SEVERITY_COLORS } from "@/lib/constants";
import type { Conflict } from "@/types";

interface ConflictMarkerProps {
  conflict: Conflict;
  onHover: (conflict: Conflict | null, event?: React.MouseEvent) => void;
  onClick: (conflict: Conflict) => void;
}

export function ConflictMarker({ conflict, onHover, onClick }: ConflictMarkerProps) {
  const color = SEVERITY_COLORS[conflict.severity];
  const size = conflict.severity === "critical" ? 8 : conflict.severity === "high" ? 6 : 4;

  return (
    <Marker coordinates={[conflict.longitude, conflict.latitude]}>
      <g
        onMouseEnter={(e) => onHover(conflict, e)}
        onMouseLeave={() => onHover(null)}
        onClick={() => onClick(conflict)}
        className="cursor-pointer"
      >
        {/* Pulse animation ring */}
        <circle r={size + 4} fill={color} opacity={0.2}>
          <animate
            attributeName="r"
            from={String(size + 2)}
            to={String(size + 10)}
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
        <circle r={size} fill={color} stroke="#fff" strokeWidth={1.5} opacity={0.9} />
      </g>
    </Marker>
  );
}
