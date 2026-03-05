"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { ChartContainer } from "./chart-container";
import type { CommodityPrice } from "@/types";

interface CommodityChartProps {
  data: CommodityPrice[];
  isLoading?: boolean;
}

export function CommodityChart({ data, isLoading }: CommodityChartProps) {
  const chartData = data.map((d) => ({
    name: d.name.length > 15 ? d.symbol : d.name,
    change: d.change,
    price: d.price,
    unit: d.unit,
  }));

  return (
    <ChartContainer title="Commodity Prices" description="Price change %" isLoading={isLoading}>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis type="number" tick={{ fontSize: 11 }} unit="%" />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            formatter={(value) => `${Number(value).toFixed(1)}%`}
          />
          <Bar dataKey="change" name="Change %" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => (
              <Cell
                key={index}
                fill={entry.change >= 0 ? "#22c55e" : "#ef4444"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
