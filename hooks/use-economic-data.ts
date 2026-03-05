"use client";

import useSWR from "swr";
import type { EconomicTimeSeries, CurrencyRate, CommodityPrice } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useGDPData(countries: string[]) {
  const key = countries.length > 0
    ? `/api/economic-data?indicator=gdp&countries=${countries.join(",")}`
    : null;

  return useSWR<EconomicTimeSeries[]>(key, fetcher, { revalidateOnFocus: false });
}

export function useInflationData(countries: string[]) {
  const key = countries.length > 0
    ? `/api/economic-data?indicator=inflation&countries=${countries.join(",")}`
    : null;

  return useSWR<EconomicTimeSeries[]>(key, fetcher, { revalidateOnFocus: false });
}

export function useTradeData(countries: string[]) {
  const key = countries.length > 0
    ? `/api/economic-data?indicator=trade&countries=${countries.join(",")}`
    : null;

  return useSWR<EconomicTimeSeries[]>(key, fetcher, { revalidateOnFocus: false });
}

export function useCurrencyRates() {
  return useSWR<CurrencyRate[]>("/api/economic-data?indicator=currency", fetcher, {
    refreshInterval: 15 * 60 * 1000,
    revalidateOnFocus: false,
  });
}

export function useCommodityPrices() {
  return useSWR<CommodityPrice[]>("/api/economic-data?indicator=commodity", fetcher, {
    refreshInterval: 30 * 60 * 1000,
    revalidateOnFocus: false,
  });
}
