"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import { ChartContainer } from "./chart-container";
import type { EconomicTimeSeries } from "@/types";

const COLORS = ["#ef4444", "#3b82f6", "#22c55e", "#f59e0b", "#8b5cf6"];

interface InflationChartProps {
  data: EconomicTimeSeries[];
  isLoading?: boolean;
}

export function InflationChart({ data, isLoading }: InflationChartProps) {
  const mergedData = mergeTimeSeries(data);

  return (
    <ChartContainer title="Inflation Trends" description="Consumer price inflation (%)" isLoading={isLoading}>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={mergedData}>
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
          <ReferenceLine y={2} stroke="#94a3b8" strokeDasharray="3 3" label={{ value: "2% target", fontSize: 10 }} />
          {data.map((series, i) => (
            <Line
              key={series.countryCode}
              type="monotone"
              dataKey={series.countryCode}
              name={series.country}
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
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
