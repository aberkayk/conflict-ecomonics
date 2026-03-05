import { cache } from "@/lib/cache";
import type { Conflict, ConflictEvent } from "@/types";

const UCDP_BASE = "https://ucdpapi.pcr.uu.se/api/gedevents/25.1";
const CACHE_KEY = "conflicts-ucdp";

// ─── Country → Gleditsch & Ward (GW) ID Mapping ───────────────────────
// UCDP uses GW IDs for countries.
const COUNTRY_TO_GW: Record<string, number> = {
  Afghanistan: 700,
  Algeria: 615,
  Angola: 540,
  Azerbaijan: 373,
  Bangladesh: 771,
  "Burkina Faso": 439,
  Burundi: 516,
  Cameroon: 471,
  "Central African Republic": 482,
  Chad: 484,
  Colombia: 100,
  "Democratic Republic of Congo": 490,
  Egypt: 651,
  Eritrea: 531,
  Ethiopia: 530,
  India: 750,
  Indonesia: 850,
  Iran: 630,
  Iraq: 645,
  Israel: 666,
  Jordan: 663,
  Kenya: 501,
  Lebanon: 660,
  Libya: 620,
  Mali: 432,
  Mexico: 70,
  Mozambique: 541,
  Myanmar: 775,
  Niger: 433,
  Nigeria: 475,
  Pakistan: 770,
  Palestine: 679,
  Philippines: 840,
  Russia: 365,
  Rwanda: 517,
  "Saudi Arabia": 670,
  Somalia: 520,
  "South Sudan": 626,
  Sudan: 625,
  Syria: 652,
  Thailand: 800,
  Turkey: 640,
  Uganda: 500,
  Ukraine: 369,
  Yemen: 678,
  Zimbabwe: 552,
};

// Inverse mapping for display
const GW_TO_COUNTRY: Record<number, string> = Object.fromEntries(
  Object.entries(COUNTRY_TO_GW).map(([name, id]) => [id, name]),
);

const COUNTRY_TO_REGION: Record<string, string> = {
  Ukraine: "europe",
  Russia: "europe",
  Sudan: "africa",
  "South Sudan": "africa",
  Ethiopia: "africa",
  Somalia: "africa",
  Nigeria: "africa",
  Mali: "africa",
  "Burkina Faso": "africa",
  Niger: "africa",
  "Democratic Republic of Congo": "africa",
  Cameroon: "africa",
  "Central African Republic": "africa",
  Chad: "africa",
  Mozambique: "africa",
  Kenya: "africa",
  Rwanda: "africa",
  Burundi: "africa",
  Uganda: "africa",
  Angola: "africa",
  Libya: "africa",
  Algeria: "africa",
  Eritrea: "africa",
  Zimbabwe: "africa",
  Israel: "middle-east",
  Palestine: "middle-east",
  Yemen: "middle-east",
  Syria: "middle-east",
  Iraq: "middle-east",
  Iran: "middle-east",
  Lebanon: "middle-east",
  Jordan: "middle-east",
  "Saudi Arabia": "middle-east",
  Turkey: "middle-east",
  Myanmar: "asia",
  India: "asia",
  Pakistan: "asia",
  Afghanistan: "asia",
  Bangladesh: "asia",
  Philippines: "asia",
  Indonesia: "asia",
  Thailand: "asia",
  Colombia: "americas",
  Mexico: "americas",
};

// ─── UCDP Response Types ─────────────────────────────────────────────

interface UCDPResponse {
  TotalCount: number;
  Results: Array<{
    id: number;
    date_start: string;
    date_end: string;
    type_of_violence: number;
    deaths_a: number;
    deaths_b: number;
    deaths_civilians: number;
    deaths_unknown: number;
    best: number;
    high: number;
    low: number;
    latitude: number;
    longitude: number;
    country: string;
    country_id: number;
    region: string;
    adm_1: string;
    where_coordinates: string;
    source_article: string;
    source_headline: string;
  }>;
}

// ─── Aggregation logic ───────────────────────────────────────────────

function aggregateToConflicts(events: ConflictEvent[]): Conflict[] {
  const byCountry = new Map<string, ConflictEvent[]>();
  for (const event of events) {
    const existing = byCountry.get(event.country) || [];
    existing.push(event);
    byCountry.set(event.country, existing);
  }

  return Array.from(byCountry.entries())
    .map(([country, countryEvents]) => {
      const totalFatalities = countryEvents.reduce(
        (sum, e) => sum + e.fatalities,
        0,
      );
      const avgLat =
        countryEvents.reduce((sum, e) => sum + e.latitude, 0) /
        countryEvents.length;
      const avgLng =
        countryEvents.reduce((sum, e) => sum + e.longitude, 0) /
        countryEvents.length;
      const region = COUNTRY_TO_REGION[country] || "other";

      let severity: Conflict["severity"] = "low";
      if (totalFatalities > 5000) severity = "critical";
      else if (totalFatalities > 1000) severity = "high";
      else if (totalFatalities > 100) severity = "medium";

      const eventDensity = countryEvents.length;
      const rawImpact = -(
        Math.log10(totalFatalities + 1) * 2 +
        Math.log10(eventDensity) * 1.5
      );
      const estimatedGdpImpact = Math.round(Math.max(rawImpact, -50) * 10) / 10;

      const dates = countryEvents.map((e) => e.event_date).sort();

      return {
        id: `conflict-${country.toLowerCase().replace(/\s+/g, "-")}`,
        name: `${country} Conflict`,
        countries: [country],
        region,
        startDate: dates[0] || "",
        status: "active" as const,
        severity,
        latitude: avgLat,
        longitude: avgLng,
        totalFatalities,
        estimatedDisplaced: totalFatalities * 50,
        estimatedGdpImpact,
        events: countryEvents.slice(0, 50),
        affectedCountryCodes: [], // UCDP doesn't easily provide neighbors in the event stream
      } satisfies Conflict;
    })
    .sort((a, b) => a.estimatedGdpImpact - b.estimatedGdpImpact);
}

// ─── Main fetch function ──────────────────────────────────────────────

export async function fetchConflicts(): Promise<Conflict[]> {
  const cached = cache.get<Conflict[]>(CACHE_KEY);
  if (cached) return cached;

  const threeMonthsAgo = new Date(Date.now() - 90 * 86400000)
    .toISOString()
    .split("T")[0];

  // Note: UCDP API is free, but as of Feb 2026, it requires an access token in the header 'x-ucdp-access-token'.
  // If the user doesn't have one, we'll try without it first as some datasets might remain public or have a grace period.
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (process.env.UCDP_TOKEN) {
    headers["x-ucdp-access-token"] = process.env.UCDP_TOKEN;
  }

  // We filter by StartDate to keep bandwidth low.
  // pagesize=1000 is usually the max for UCDP.
  const params = new URLSearchParams({
    StartDate: threeMonthsAgo,
    pagesize: "1000",
  });

  try {
    const res = await fetch(`${UCDP_BASE}?${params}`, {
      headers,
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      // Fallback for developers who might not have the token yet
      if (res.status === 403 || res.status === 401) {
        console.warn(
          "UCDP API access token missing or invalid. Check .env.local for UCDP_TOKEN.",
        );
      }
      throw new Error(`UCDP API error: ${res.status} ${res.statusText}`);
    }

    const json = (await res.json()) as UCDPResponse;
    if (!json.Results) {
      throw new Error("UCDP API returned no results");
    }

    const events: ConflictEvent[] = json.Results.map((e) => ({
      event_id: e.id.toString(),
      event_date: e.date_start,
      event_type:
        e.type_of_violence === 1
          ? "State-based"
          : e.type_of_violence === 2
            ? "Non-state"
            : "One-sided",
      sub_event_type: "Armed Conflict",
      country: e.country,
      admin1: e.adm_1 || "",
      location: e.where_coordinates,
      latitude: e.latitude,
      longitude: e.longitude,
      fatalities: e.best || 0,
      notes: e.source_headline || "",
    }));

    const conflicts = aggregateToConflicts(events);
    cache.set(CACHE_KEY, conflicts, 30 * 60 * 1000);
    return conflicts;
  } catch (error) {
    console.error("Failed to fetch UCDP data:", error);
    return [];
  }
}

export async function fetchConflictById(id: string): Promise<Conflict | null> {
  const conflicts = await fetchConflicts();
  return conflicts.find((c) => c.id === id) || null;
}
