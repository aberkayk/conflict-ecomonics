"use client";

import { IMPACT_GRADIENT } from "@/lib/constants";

export function MapLegend() {
  return (
    <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur border rounded-lg p-3 text-xs">
      <p className="font-medium mb-2">GDP Impact</p>
      <div className="flex items-center gap-1">
        {IMPACT_GRADIENT.map((g, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className="w-6 h-3 rounded-sm" style={{ backgroundColor: g.color }} />
            <span className="mt-1 text-muted-foreground">{g.threshold}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
