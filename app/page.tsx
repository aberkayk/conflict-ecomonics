"use client";

import { WorldMap } from "@/components/map/world-map";
import { StatCard } from "@/components/dashboard/stat-card";
import { ConflictTimeline } from "@/components/dashboard/conflict-timeline";
import { useConflicts } from "@/hooks/use-conflicts";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function HomePage() {
  const { data: conflicts, isLoading, error } = useConflicts();

  const totalConflicts = conflicts?.length || 0;
  const totalFatalities = conflicts?.reduce((sum, c) => sum + c.totalFatalities, 0) || 0;
  const avgGdpImpact = conflicts?.length
    ? (conflicts.reduce((sum, c) => sum + c.estimatedGdpImpact, 0) / conflicts.length).toFixed(1)
    : "0";
  const totalDisplaced = conflicts?.reduce((sum, c) => sum + c.estimatedDisplaced, 0) || 0;
  const tradeDisruption = conflicts?.length
    ? (conflicts.filter((c) => c.severity === "critical" || c.severity === "high").length / conflicts.length * 100).toFixed(0)
    : "0";

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Conflict Economic Impact Tracker</h1>
        <p className="text-sm text-muted-foreground">
          Real-time monitoring of how global conflicts affect economies
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Data: ACLED, World Bank, Frankfurter, Yahoo Finance, GDELT
        </p>
      </div>

      {error && (
        <Card className="mb-6 border-destructive/50">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-destructive">Failed to load conflict data</p>
            <p className="text-xs text-muted-foreground mt-1">{error.message}</p>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Active Conflicts"
          value={isLoading ? "..." : String(totalConflicts)}
          description="Tracked worldwide"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
          }
        />
        <StatCard
          title="Avg GDP Impact"
          value={isLoading ? "..." : `${avgGdpImpact}%`}
          description="Across affected nations"
          trend="up"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/></svg>
          }
        />
        <StatCard
          title="Displaced People"
          value={isLoading ? "..." : `${(totalDisplaced / 1_000_000).toFixed(1)}M`}
          description="Estimated total"
          trend="up"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          }
        />
        <StatCard
          title="Trade Disruption"
          value={isLoading ? "..." : `${tradeDisruption}%`}
          description="High/critical severity"
          trend="up"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          }
        />
      </div>

      {/* Map + Timeline */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {isLoading ? (
            <Skeleton className="aspect-[2/1] w-full rounded-lg" />
          ) : (
            <WorldMap conflicts={conflicts || []} />
          )}
        </div>
        <div>
          {isLoading ? (
            <Skeleton className="h-[400px]" />
          ) : (
            <ConflictTimeline conflicts={conflicts || []} />
          )}
        </div>
      </div>
    </div>
  );
}
