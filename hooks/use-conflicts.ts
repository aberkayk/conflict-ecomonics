"use client";

import useSWR from "swr";
import type { Conflict } from "@/types";

async function fetcher(url: string) {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `API error: ${res.status}`);
  }
  return res.json();
}

export function useConflicts(region?: string) {
  const params = new URLSearchParams();
  if (region && region !== "all") params.set("region", region);
  const query = params.toString();

  return useSWR<Conflict[], Error>(
    `/api/conflicts${query ? `?${query}` : ""}`,
    fetcher,
    { refreshInterval: 5 * 60 * 1000, revalidateOnFocus: false }
  );
}

export function useConflict(id: string) {
  return useSWR<Conflict, Error>(
    id ? `/api/conflicts?id=${id}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );
}
