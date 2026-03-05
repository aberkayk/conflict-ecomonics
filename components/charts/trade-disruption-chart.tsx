"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { ChartContainer } from "./chart-container";
import type { EconomicTimeSeries } from "@/types";

const COLORS = ["#ef4444", "#3b82f6", "#22c55e", "#f59e0b", "#8b5cf6"];

interface TradeDisruptionChartProps {
  data: EconomicTimeSeries[];
  isLoading?: boolean;
}

export function TradeDisruptionChart({ data, isLoading }: TradeDisruptionChartProps) {
  const mergedData = mergeTimeSeries(data);

  return (
    <ChartContainer title="Trade Disruption" description="Trade balance as % of GDP" isLoading={isLoading}>
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={mergedData} stackOffset="sign">
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} unit="%" />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: "12px",
            }}
          />
          <Legend wrapperStyle={{ fontSize: "12px" }} />
          {data.map((series, i) => (
            <Area
              key={series.countryCode}
              type="monotone"
              dataKey={series.countryCode}
              name={series.country}
              stackId="1"
              stroke={COLORS[i % COLORS.length]}
              fill={COLORS[i % COLORS.length]}
              fillOpacity={0.3}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

function mergeTimeSeries(seriesArr: EconomicTimeSeries[]) {
  const map = new Map<string, Record<string, number | string>>();

  for (const series of seriesArr) {
    for (const point of series.data) {
      const existing = map.get(point.date) || { date: point.date };
      existing[series.countryCode] = point.value;
      map.set(point.date, existing);
    }
  }

  return Array.from(map.values()).sort((a, b) =>
    String(a.date).localeCompare(String(b.date))
  );
}
