import { saveEvent } from "@/lib/database/eventService";
import type { MapEvent } from "@/types/event";

export interface ManualEventInput {
  title: string;
  description: string;
  lat: number;
  lng: number;
  country?: string;
  type?: string;
}

export function createManualEvent(input: ManualEventInput): MapEvent {
  const event: MapEvent = {
    id: crypto.randomUUID(),
    title: input.title,
    description: input.description,
    lat: input.lat,
    lng: input.lng,
    country: input.country,
    source: "manual",
    date: new Date().toISOString().split("T")[0],
    type: input.type,
  };
  saveEvent(event);
  return event;
}
