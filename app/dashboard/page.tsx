// TODO: This page redirects to home until UCDP API token is available.
// Conflict KPI cards depend on getDemoConflicts() fallback (UCDP returns 401).
// Economic charts (GDP, Inflation, Trade, Currency, Commodities) are fully live.
// To re-enable: add UCDP_TOKEN to .env.local, uncomment nav link in header.tsx,
// and remove the redirect + restore the original export default below.

import { redirect } from "next/navigation";

export default function DashboardPage() {
  redirect("/");
}

/*
─── Original page preserved below — restore when UCDP token is available ──────

"use client";

import { Suspense } from "react";
import { ChartFilters } from "@/components/dashboard/chart-filters";
import { StatCard } from "@/components/dashboard/stat-card";
import { ImpactSummary } from "@/components/dashboard/impact-summary";
import { GDPImpactChart } from "@/components/charts/gdp-impact-chart";
import { CurrencyChart } from "@/components/charts/currency-chart";
import { CommodityChart } from "@/components/charts/commodity-chart";
import { TradeDisruptionChart } from "@/components/charts/trade-disruption-chart";
import { InflationChart } from "@/components/charts/inflation-chart";
import { useConflicts } from "@/hooks/use-conflicts";
import { useGDPData, useInflationData, useTradeData, useCurrencyRates, useCommodityPrices } from "@/hooks/use-economic-data";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const DEFAULT_COUNTRIES = ["UKR", "RUS", "SDN", "ISR", "MMR"];

function DashboardContent() {
  const { data: conflicts, isLoading: conflictsLoading } = useConflicts();
  const { data: gdpData, isLoading: gdpLoading } = useGDPData(DEFAULT_COUNTRIES);
  const { data: inflationData, isLoading: inflationLoading } = useInflationData(DEFAULT_COUNTRIES);
  const { data: tradeData, isLoading: tradeLoading } = useTradeData(DEFAULT_COUNTRIES);
  const { data: currencies, isLoading: currencyLoading } = useCurrencyRates();
  const { data: commodities, isLoading: commodityLoading } = useCommodityPrices();

  const totalConflicts = conflicts?.length || 0;
  const totalFatalities = conflicts?.reduce((sum, c) => sum + c.totalFatalities, 0) || 0;
  const avgGdpImpact = conflicts?.length
    ? (conflicts.reduce((sum, c) => sum + c.estimatedGdpImpact, 0) / conflicts.length).toFixed(1)
    : "0";
  const totalDisplaced = conflicts?.reduce((sum, c) => sum + c.estimatedDisplaced, 0) || 0;

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Economic Impact Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Real-time economic indicators for conflict-affected regions
          </p>
        </div>
      </div>

      <ChartFilters />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Active Conflicts" value={conflictsLoading ? "..." : String(totalConflicts)} description="Tracked worldwide" icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/><circle cx="12" cy="10" r="3"/></svg>} />
        <StatCard title="Avg GDP Impact" value={conflictsLoading ? "..." : `${avgGdpImpact}%`} description="Across affected nations" trend="up" icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/></svg>} />
        <StatCard title="Displaced People" value={conflictsLoading ? "..." : `${(totalDisplaced / 1_000_000).toFixed(1)}M`} description="Estimated total" trend="up" icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>} />
        <StatCard title="Total Fatalities" value={conflictsLoading ? "..." : totalFatalities.toLocaleString()} description="Reported casualties" trend="up" icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>} />
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <GDPImpactChart data={gdpData || []} isLoading={gdpLoading} />
        <CurrencyChart data={currencies || []} isLoading={currencyLoading} />
        <CommodityChart data={commodities || []} isLoading={commodityLoading} />
        <TradeDisruptionChart data={tradeData || []} isLoading={tradeLoading} />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <InflationChart data={inflationData || []} isLoading={inflationLoading} />
        </div>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Most Impacted</CardTitle>
          </CardHeader>
          <CardContent>
            {conflictsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (<Skeleton key={i} className="h-12 w-full" />))}
              </div>
            ) : (
              <ImpactSummary conflicts={conflicts || []} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardSkeleton() {
  return (
    <div className="container mx-auto px-4 py-6">
      <Skeleton className="h-8 w-64 mb-2" />
      <Skeleton className="h-4 w-96 mb-6" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (<Skeleton key={i} className="h-24" />))}
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (<Skeleton key={i} className="h-[300px]" />))}
      </div>
    </div>
  );
}
*/
