"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SEVERITY_COLORS } from "@/lib/constants";
import type { Conflict } from "@/types";

interface ConflictTimelineProps {
  conflicts: Conflict[];
}

export function ConflictTimeline({ conflicts }: ConflictTimelineProps) {
  const sorted = [...conflicts].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Recent Conflicts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sorted.slice(0, 6).map((conflict) => (
            <Link
              key={conflict.id}
              href={`/conflicts/${conflict.id}`}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: SEVERITY_COLORS[conflict.severity] }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{conflict.name}</p>
                <p className="text-xs text-muted-foreground">
                  {conflict.countries.join(", ")}
                </p>
              </div>
              <div className="text-right shrink-0">
                <Badge variant="destructive" className="text-[10px]">
                  {conflict.estimatedGdpImpact}%
                </Badge>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {new Date(conflict.startDate).toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
