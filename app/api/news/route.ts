import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { fetchConflictNews } from "@/lib/api/news";
import { apiLimiter } from "@/lib/rate-limiter";

const QuerySchema = z.object({
  q: z.string().min(1),
  limit: z.coerce.number().min(1).max(50).default(10),
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

  const articles = await fetchConflictNews(parsed.data.q, parsed.data.limit);
  return NextResponse.json({ articles, totalResults: articles.length });
}
