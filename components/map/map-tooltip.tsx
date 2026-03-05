"use client";

import type { Conflict } from "@/types";
import { Badge } from "@/components/ui/badge";
import { SEVERITY_COLORS } from "@/lib/constants";

interface MapTooltipProps {
  conflict: Conflict;
  position: { x: number; y: number };
}

export function MapTooltip({ conflict, position }: MapTooltipProps) {
  return (
    <div
      className="absolute z-50 bg-popover text-popover-foreground border rounded-lg shadow-lg p-3 pointer-events-none min-w-[200px]"
      style={{ left: position.x + 10, top: position.y - 10 }}
    >
      <div className="flex items-center gap-2 mb-1">
        <h4 className="font-semibold text-sm">{conflict.name}</h4>
        <Badge
          variant="outline"
          className="text-[10px] px-1.5 py-0"
          style={{ borderColor: SEVERITY_COLORS[conflict.severity], color: SEVERITY_COLORS[conflict.severity] }}
        >
          {conflict.severity}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground mb-2">{conflict.countries.join(", ")}</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <span className="text-muted-foreground">GDP Impact:</span>
        <span className="font-medium text-destructive">{conflict.estimatedGdpImpact}%</span>
        <span className="text-muted-foreground">Fatalities:</span>
        <span className="font-medium">{conflict.totalFatalities.toLocaleString()}</span>
        <span className="text-muted-foreground">Displaced:</span>
        <span className="font-medium">{(conflict.estimatedDisplaced / 1_000_000).toFixed(1)}M</span>
      </div>
    </div>
  );
}
