"use client";

import { LeafletMap } from "@/components/map/leaflet-map";
import { StatCard } from "@/components/dashboard/stat-card";
import { LiveEventsList } from "@/components/events/live-events-list";
import { EconomicImpactPanel } from "@/components/events/economic-impact-panel";
import { useConflicts } from "@/hooks/use-conflicts";
import { useMapEvents } from "@/hooks/use-map-events";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function HomePage() {
  const { data: conflicts, isLoading: conflictsLoading, error } = useConflicts();
  const { events, stats, isLoading: eventsLoading } = useMapEvents(300);

  const totalConflicts = conflicts?.length || 0;
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
          Data: ACLED · World Bank · Frankfurter · GDELT · BBC · Al Jazeera · NY Times · The Guardian
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
          value={conflictsLoading ? "..." : String(totalConflicts)}
          description="Tracked worldwide"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
          }
        />
        <StatCard
          title="Live Events"
          value={eventsLoading ? "..." : String(stats?.total ?? events.length)}
          description="RSS · GDELT · Manual"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 11a9 9 0 0 1 9 9"/><path d="M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1"/></svg>
          }
        />
        <StatCard
          title="Displaced People"
          value={conflictsLoading ? "..." : `${(totalDisplaced / 1_000_000).toFixed(1)}M`}
          description="Estimated total"
          trend="up"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          }
        />
        <StatCard
          title="Trade Disruption"
          value={conflictsLoading ? "..." : `${tradeDisruption}%`}
          description="High/critical severity"
          trend="up"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          }
        />
      </div>

      {/* Map (2/3) + Live Events (1/3) */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {conflictsLoading ? (
            <Skeleton className="aspect-2/1 w-full rounded-lg" />
          ) : (
            <LeafletMap conflicts={conflicts || []} events={events} />
          )}
        </div>
        <div className="min-h-[400px] lg:max-h-[calc(50vw/2)]">
          <LiveEventsList
            events={events}
            isLoading={eventsLoading}
            stats={stats}
          />
        </div>
      </div>

      {/* AI Economic Impact — hidden for now */}
      {/* <div className="mt-6">
        <EconomicImpactPanel events={events} />
      </div> */}
    </div>
  );
}
