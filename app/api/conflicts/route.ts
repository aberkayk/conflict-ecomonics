import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { fetchConflicts, fetchConflictById } from "@/lib/api/conflicts";
import { apiLimiter } from "@/lib/rate-limiter";

const QuerySchema = z.object({
  id: z.string().optional(),
  region: z.string().optional(),
  severity: z.enum(["low", "medium", "high", "critical"]).optional(),
});

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "anonymous";
  const { allowed, retryAfterMs } = apiLimiter.check(ip);

  if (!allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } }
    );
  }

  const searchParams = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = QuerySchema.safeParse(searchParams);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid parameters", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const { id, region, severity } = parsed.data;

    if (id) {
      const conflict = await fetchConflictById(id);
      if (!conflict) {
        return NextResponse.json({ error: "Conflict not found" }, { status: 404 });
      }
      return NextResponse.json(conflict);
    }

    let conflicts = await fetchConflicts();

    if (region && region !== "all") {
      conflicts = conflicts.filter((c) => c.region === region);
    }
    if (severity) {
      conflicts = conflicts.filter((c) => c.severity === severity);
    }

    return NextResponse.json(conflicts);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch conflicts";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
