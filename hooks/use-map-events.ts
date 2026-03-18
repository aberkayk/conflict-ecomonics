"use client";

import useSWR from "swr";
import type { MapEvent } from "@/types/event";

interface EventsResponse {
  events: MapEvent[];
  count: number;
  stats: { total: number; gdelt: number; rss: number; manual: number };
}

async function fetcher(url: string): Promise<EventsResponse> {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `API error: ${res.status}`);
  }
  return res.json();
}

export function useMapEvents(limit = 300) {
  const { data, error, isLoading } = useSWR<EventsResponse, Error>(
    `/api/events?limit=${limit}`,
    fetcher,
    {
      refreshInterval: 60_000, // poll every 60 s
      revalidateOnFocus: false,
    }
  );

  return {
    events: data?.events ?? [],
    stats: data?.stats,
    count: data?.count ?? 0,
    isLoading,
    error,
  };
}
