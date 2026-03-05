"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChartContainer } from "./chart-container";
import type { CurrencyRate } from "@/types";

interface CurrencyChartProps {
  data: CurrencyRate[];
  isLoading?: boolean;
}

export function CurrencyChart({ data, isLoading }: CurrencyChartProps) {
  const chartData = data.map((d) => ({
    currency: d.currency,
    rate: d.rate,
    change24h: d.change24h,
    change7d: d.change7d,
  }));

  return (
    <ChartContainer title="Currency Impact" description="Exchange rates vs USD">
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="currency" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            formatter={(value) => Number(value).toFixed(2)}
          />
          <Area
            type="monotone"
            dataKey="change7d"
            name="7d Change %"
            stroke="#ef4444"
            fill="#ef444420"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="change24h"
            name="24h Change %"
            stroke="#3b82f6"
            fill="#3b82f620"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
      {!isLoading && (
        <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
          {data.slice(0, 6).map((d) => (
            <div key={d.currency} className="flex justify-between">
              <span className="text-muted-foreground">{d.currency}</span>
              <span className={d.change24h < 0 ? "text-destructive" : "text-green-500"}>
                {d.change24h > 0 ? "+" : ""}{d.change24h.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </ChartContainer>
  );
}
