import { NextRequest, NextResponse } from "next/server";
import { createManualEvent } from "@/lib/data_sources/manual";
import { z } from "zod";

const Schema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().min(1).max(2000),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  country: z.string().max(100).optional(),
  type: z.string().max(50).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = Schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const event = createManualEvent(parsed.data);
    return NextResponse.json({ event }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/events/manual]", err);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}
