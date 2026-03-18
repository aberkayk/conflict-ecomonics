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

// ─── Demo / Fallback Data ─────────────────────────────────────────────
// Used when UCDP API is unavailable (no token or API error).
// Based on real-world conflicts as of early 2026.

function getDemoConflicts(): Conflict[] {
  const today = new Date().toISOString().split("T")[0];
  const threeMonthsAgo = new Date(Date.now() - 90 * 86400000).toISOString().split("T")[0];

  const demoData: Array<{
    country: string; lat: number; lng: number; fatalities: number;
    events: number; severity: Conflict["severity"];
  }> = [
    { country: "Ukraine", lat: 48.38, lng: 37.62, fatalities: 8200, events: 1450, severity: "critical" },
    { country: "Sudan", lat: 15.5, lng: 32.53, fatalities: 6800, events: 980, severity: "critical" },
    { country: "Palestine", lat: 31.35, lng: 34.31, fatalities: 5200, events: 1100, severity: "critical" },
    { country: "Iran", lat: 32.43, lng: 53.69, fatalities: 4100, events: 680, severity: "critical" },
    { country: "Israel", lat: 31.05, lng: 34.85, fatalities: 2800, events: 620, severity: "high" },
    { country: "Myanmar", lat: 19.76, lng: 96.07, fatalities: 3200, events: 720, severity: "high" },
    { country: "Syria", lat: 35.2, lng: 38.99, fatalities: 1800, events: 410, severity: "high" },
    { country: "Nigeria", lat: 9.08, lng: 7.49, fatalities: 1500, events: 380, severity: "high" },
    { country: "Ethiopia", lat: 9.14, lng: 40.49, fatalities: 1200, events: 340, severity: "high" },
    { country: "Somalia", lat: 5.15, lng: 46.2, fatalities: 950, events: 290, severity: "medium" },
    { country: "Democratic Republic of Congo", lat: -1.66, lng: 29.22, fatalities: 2100, events: 520, severity: "high" },
    { country: "Yemen", lat: 15.37, lng: 44.19, fatalities: 800, events: 210, severity: "medium" },
    { country: "Lebanon", lat: 33.85, lng: 35.86, fatalities: 750, events: 230, severity: "medium" },
    { country: "Burkina Faso", lat: 12.37, lng: -1.52, fatalities: 700, events: 250, severity: "medium" },
    { country: "Mali", lat: 17.57, lng: -4.0, fatalities: 450, events: 180, severity: "medium" },
    { country: "Pakistan", lat: 30.38, lng: 69.35, fatalities: 380, events: 150, severity: "medium" },
    { country: "Iraq", lat: 33.31, lng: 44.37, fatalities: 320, events: 120, severity: "medium" },
    { country: "Colombia", lat: 4.57, lng: -74.3, fatalities: 280, events: 160, severity: "medium" },
    { country: "Afghanistan", lat: 34.53, lng: 69.17, fatalities: 600, events: 200, severity: "medium" },
  ];

  return demoData.map((d) => {
    const region = COUNTRY_TO_REGION[d.country] || "other";
    const eventDensity = d.events;
    const rawImpact = -(Math.log10(d.fatalities + 1) * 2 + Math.log10(eventDensity) * 1.5);
    const estimatedGdpImpact = Math.round(Math.max(rawImpact, -50) * 10) / 10;

    const demoEvents: ConflictEvent[] = Array.from({ length: Math.min(d.events, 20) }, (_, i) => ({
      event_id: `demo-${d.country.toLowerCase().replace(/\s+/g, "-")}-${i}`,
      event_date: new Date(Date.now() - Math.random() * 90 * 86400000).toISOString().split("T")[0],
      event_type: "State-based",
      sub_event_type: "Armed Conflict",
      country: d.country,
      admin1: "",
      location: d.country,
      latitude: d.lat + (Math.random() - 0.5) * 2,
      longitude: d.lng + (Math.random() - 0.5) * 2,
      fatalities: Math.round(d.fatalities / d.events * (0.5 + Math.random())),
      notes: `Demo event for ${d.country} conflict`,
    }));

    return {
      id: `conflict-${d.country.toLowerCase().replace(/\s+/g, "-")}`,
      name: `${d.country} Conflict`,
      countries: [d.country],
      region,
      startDate: threeMonthsAgo,
      status: "active" as const,
      severity: d.severity,
      latitude: d.lat,
      longitude: d.lng,
      totalFatalities: d.fatalities,
      estimatedDisplaced: d.fatalities * 50,
      estimatedGdpImpact,
      events: demoEvents,
      affectedCountryCodes: [],
    };
  }).sort((a, b) => a.estimatedGdpImpact - b.estimatedGdpImpact);
}

// ─── Main fetch function ──────────────────────────────────────────────

export async function fetchConflicts(): Promise<Conflict[]> {
  const cached = cache.get<Conflict[]>(CACHE_KEY);
  if (cached) return cached;

  const threeMonthsAgo = new Date(Date.now() - 90 * 86400000)
    .toISOString()
    .split("T")[0];

  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (process.env.UCDP_TOKEN) {
    headers["x-ucdp-access-token"] = process.env.UCDP_TOKEN;
  }

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
      throw new Error(`UCDP API error: ${res.status} ${res.statusText}`);
    }

    const json = (await res.json()) as UCDPResponse;
    if (!json.Results || json.Results.length === 0) {
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
    console.warn("UCDP API unavailable, using demo data:", error);
    const demo = getDemoConflicts();
    cache.set(CACHE_KEY, demo, 5 * 60 * 1000); // shorter cache for demo
    return demo;
  }
}

export async function fetchConflictById(id: string): Promise<Conflict | null> {
  const conflicts = await fetchConflicts();
  return conflicts.find((c) => c.id === id) || null;
}
