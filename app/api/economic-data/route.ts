import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { fetchGDPData, fetchInflationData, fetchCurrencyRates, fetchCommodityPrices, fetchTradeData } from "@/lib/api/economic";
import { apiLimiter } from "@/lib/rate-limiter";

const QuerySchema = z.object({
  indicator: z.enum(["gdp", "inflation", "trade", "currency", "commodity"]),
  countries: z.string().optional(),
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
    const { indicator, countries } = parsed.data;
    const countryCodes = countries?.split(",") || ["UKR", "RUS", "SDN"];

    switch (indicator) {
      case "gdp":
        return NextResponse.json(await fetchGDPData(countryCodes));
      case "inflation":
        return NextResponse.json(await fetchInflationData(countryCodes));
      case "trade":
        return NextResponse.json(await fetchTradeData(countryCodes));
      case "currency":
        return NextResponse.json(await fetchCurrencyRates());
      case "commodity":
        return NextResponse.json(await fetchCommodityPrices());
      default:
        return NextResponse.json({ error: "Unknown indicator" }, { status: 400 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch economic data";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
