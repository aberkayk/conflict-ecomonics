"use client";

import { use } from "react";
import Link from "next/link";
import { useConflict } from "@/hooks/use-conflicts";
import { useGDPData, useInflationData, useTradeData } from "@/hooks/use-economic-data";
import { GDPImpactChart } from "@/components/charts/gdp-impact-chart";
import { InflationChart } from "@/components/charts/inflation-chart";
import { TradeDisruptionChart } from "@/components/charts/trade-disruption-chart";
import { AiAnalysisPanel } from "@/components/analysis/ai-analysis-panel";
import { ConflictNewsFeed } from "./news-feed";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SEVERITY_COLORS } from "@/lib/constants";

export default function ConflictDetailPage({
  params,
}: {
  params: Promise<{ conflictId: string }>;
}) {
  const { conflictId } = use(params);
  const { data: conflict, isLoading } = useConflict(conflictId);
  const countryCodes = conflict?.affectedCountryCodes || [];

  const { data: gdpData, isLoading: gdpLoading } = useGDPData(countryCodes);
  const { data: inflationData, isLoading: inflationLoading } = useInflationData(countryCodes);
  const { data: tradeData, isLoading: tradeLoading } = useTradeData(countryCodes);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <div className="grid md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  if (!conflict) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-xl font-bold mb-2">Conflict Not Found</h2>
        <p className="text-muted-foreground mb-4">The requested conflict could not be found.</p>
        <Link href="/conflicts" className="text-primary underline">
          Back to conflicts
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <Link href="/conflicts" className="text-xs text-muted-foreground hover:text-foreground mb-2 inline-block">
          &larr; Back to conflicts
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{conflict.name}</h1>
          <Badge
            variant="outline"
            style={{
              borderColor: SEVERITY_COLORS[conflict.severity],
              color: SEVERITY_COLORS[conflict.severity],
            }}
          >
            {conflict.severity}
          </Badge>
          <Badge variant={conflict.status === "active" ? "destructive" : "secondary"}>
            {conflict.status}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {conflict.countries.join(", ")} &middot; Since{" "}
          {new Date(conflict.startDate).toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">GDP Impact</p>
            <p className="text-2xl font-bold text-destructive">{conflict.estimatedGdpImpact}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Fatalities</p>
            <p className="text-2xl font-bold">{conflict.totalFatalities.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Displaced</p>
            <p className="text-2xl font-bold">
              {(conflict.estimatedDisplaced / 1_000_000).toFixed(1)}M
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Affected Countries</p>
            <p className="text-2xl font-bold">{conflict.affectedCountryCodes.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <GDPImpactChart data={gdpData || []} isLoading={gdpLoading} />
        <InflationChart data={inflationData || []} isLoading={inflationLoading} />
      </div>

      <div className="mb-6">
        <TradeDisruptionChart data={tradeData || []} isLoading={tradeLoading} />
      </div>

      {/* AI Analysis */}
      <div className="mb-6">
        <AiAnalysisPanel
          request={{
            conflictId: conflict.id,
            conflictName: conflict.name,
            countries: conflict.countries,
            region: conflict.region,
          }}
        />
      </div>

      {/* News Feed */}
      <ConflictNewsFeed conflictName={conflict.name} />
    </div>
  );
}
