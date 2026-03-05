"use client";

import type { Conflict } from "@/types";
import { Badge } from "@/components/ui/badge";
import { SEVERITY_COLORS } from "@/lib/constants";

interface ImpactSummaryProps {
  conflicts: Conflict[];
}

export function ImpactSummary({ conflicts }: ImpactSummaryProps) {
  const sorted = [...conflicts].sort(
    (a, b) => a.estimatedGdpImpact - b.estimatedGdpImpact
  );

  return (
    <div className="space-y-3">
      {sorted.slice(0, 5).map((conflict) => (
        <div
          key={conflict.id}
          className="flex items-center justify-between py-2 border-b last:border-0"
        >
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: SEVERITY_COLORS[conflict.severity] }}
            />
            <div>
              <p className="text-sm font-medium">{conflict.name}</p>
              <p className="text-xs text-muted-foreground">
                {conflict.countries.join(", ")}
              </p>
            </div>
          </div>
          <div className="text-right">
            <Badge variant="destructive" className="text-xs">
              {conflict.estimatedGdpImpact}% GDP
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
}
