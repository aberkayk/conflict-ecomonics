"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import type { Conflict } from "@/types";
import type { MapEvent } from "@/types/event";

const Inner = dynamic(() => import("./leaflet-map-inner"), {
  ssr: false,
  loading: () => <Skeleton className="w-full aspect-[2/1] rounded-lg" />,
});

interface LeafletMapProps {
  conflicts: Conflict[];
  events?: MapEvent[];
}

export function LeafletMap({ conflicts, events = [] }: LeafletMapProps) {
  return <Inner conflicts={conflicts} events={events} />;
}
