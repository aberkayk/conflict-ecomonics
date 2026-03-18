import { NextRequest, NextResponse } from "next/server";
import { fetchEvents, getEventStats } from "@/lib/database/eventService";
import type { MapEvent } from "@/types/event";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const limit = Math.min(
      Number(searchParams.get("limit") ?? "200"),
      500
    );
    const offset = Number(searchParams.get("offset") ?? "0");
    const source = searchParams.get("source") as MapEvent["source"] | null;
    const country = searchParams.get("country") ?? undefined;
    const since = searchParams.get("since") ?? undefined;

    const events = fetchEvents({
      limit,
      offset,
      source: source ?? undefined,
      country,
      since,
    });

    const stats = getEventStats();

    return NextResponse.json({ events, count: events.length, stats });
  } catch (err) {
    console.error("[GET /api/events]", err);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}
