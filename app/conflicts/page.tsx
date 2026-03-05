"use client";

import Link from "next/link";
import { useConflicts } from "@/hooks/use-conflicts";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SEVERITY_COLORS } from "@/lib/constants";

export default function ConflictsPage() {
  const { data: conflicts, isLoading, error } = useConflicts();

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Active Conflicts</h1>
        <p className="text-sm text-muted-foreground">
          Global conflicts and their estimated economic impact (Source: ACLED)
        </p>
      </div>

      {error && (
        <Card className="mb-6 border-destructive/50">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-destructive">Failed to load conflicts</p>
            <p className="text-xs text-muted-foreground mt-1">{error.message}</p>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {conflicts?.map((conflict) => (
            <Link key={conflict.id} href={`/conflicts/${conflict.id}`}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-sm">{conflict.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {conflict.countries.join(", ")}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-[10px] shrink-0"
                      style={{
                        borderColor: SEVERITY_COLORS[conflict.severity],
                        color: SEVERITY_COLORS[conflict.severity],
                      }}
                    >
                      {conflict.severity}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-muted-foreground">GDP Impact</p>
                      <p className="font-semibold text-destructive">
                        {conflict.estimatedGdpImpact}%
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Fatalities</p>
                      <p className="font-semibold">
                        {conflict.totalFatalities.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Displaced</p>
                      <p className="font-semibold">
                        {(conflict.estimatedDisplaced / 1_000_000).toFixed(1)}M
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Since</p>
                      <p className="font-semibold">
                        {new Date(conflict.startDate).toLocaleDateString("en-US", {
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-1">
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: conflict.status === "active" ? "#22c55e" : "#eab308" }}
                    />
                    <span className="text-[10px] text-muted-foreground capitalize">
                      {conflict.status}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
