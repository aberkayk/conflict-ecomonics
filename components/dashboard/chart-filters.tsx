"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { REGIONS, INDICATORS, TIME_RANGES } from "@/lib/constants";

export function ChartFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentRegion = searchParams.get("region") || "all";
  const currentIndicator = searchParams.get("indicator") || "gdp";
  const currentTimeRange = searchParams.get("timeRange") || "1y";

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-3 mb-6">
      <FilterSelect
        label="Region"
        value={currentRegion}
        options={REGIONS}
        onChange={(v) => updateParam("region", v)}
      />
      <FilterSelect
        label="Indicator"
        value={currentIndicator}
        options={INDICATORS}
        onChange={(v) => updateParam("indicator", v)}
      />
      <FilterSelect
        label="Time Range"
        value={currentTimeRange}
        options={TIME_RANGES}
        onChange={(v) => updateParam("timeRange", v)}
      />
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-xs font-medium text-muted-foreground">{label}:</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-sm bg-background border rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
