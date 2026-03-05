import { z } from "zod";

export const ConflictEventSchema = z.object({
  event_id: z.string(),
  event_date: z.string(),
  event_type: z.string(),
  sub_event_type: z.string().optional(),
  country: z.string(),
  admin1: z.string().optional(),
  location: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  fatalities: z.number(),
  notes: z.string().optional(),
});

export type ConflictEvent = z.infer<typeof ConflictEventSchema>;

export interface Conflict {
  id: string;
  name: string;
  countries: string[];
  region: string;
  startDate: string;
  status: "active" | "ceasefire" | "resolved";
  severity: "low" | "medium" | "high" | "critical";
  latitude: number;
  longitude: number;
  totalFatalities: number;
  estimatedDisplaced: number;
  estimatedGdpImpact: number; // percentage
  events: ConflictEvent[];
  affectedCountryCodes: string[];
}

export interface ConflictSummary {
  totalActive: number;
  totalFatalities: number;
  estimatedGdpImpact: number;
  affectedPopulation: number;
  tradeDisruption: number;
}
