import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { analysisLimiter } from "@/lib/rate-limiter";
import { analysisCache } from "@/lib/cache";

const client = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

interface EventInput {
  title: string;
  type?: string;
  country?: string;
  date: string;
}

function buildPrompt(events: EventInput[]): string {
  // Group by country
  const byCountry: Record<string, { type: string; title: string }[]> = {};
  for (const e of events) {
    const key = e.country || "Unknown";
    if (!byCountry[key]) byCountry[key] = [];
    byCountry[key].push({ type: e.type ?? "news", title: e.title });
  }

  const lines = Object.entries(byCountry)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 10) // top 10 countries by event count
    .map(([country, evts]) => {
      const summary = evts
        .slice(0, 5)
        .map((e) => `  - [${e.type}] ${e.title}`)
        .join("\n");
      return `**${country}** (${evts.length} events)\n${summary}`;
    })
    .join("\n\n");

  return `You are a concise geopolitical economist. Analyze the economic impact of these recent conflict events on affected countries and the global economy.

## Recent Events by Country

${lines}

## Your Analysis

For each significantly affected country, provide:
- Key economic risk (trade, FX, commodities, investment)
- Short-term outlook (days to weeks)

Then add a brief **Global Spillover** section covering supply chain and commodity price implications.

Format with ## Country Name headers and bullet points. Be analytical and concise — max 500 words total.`;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "anonymous";
  const { allowed, retryAfterMs } = analysisLimiter.check(ip);

  if (!allowed) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
      status: 429,
      headers: {
        "Retry-After": String(Math.ceil(retryAfterMs / 1000)),
        "Content-Type": "application/json",
      },
    });
  }

  if (!client) {
    return new Response(
      JSON.stringify({ error: "ANTHROPIC_API_KEY not set in .env.local" }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  let body: { events?: EventInput[]; cacheKey?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }

  const events: EventInput[] = (body.events ?? []).slice(0, 40);
  if (events.length === 0) {
    return new Response(JSON.stringify({ error: "No events provided" }), { status: 400 });
  }

  // Cache by event fingerprint (first 10 event titles)
  const cacheKey = `events-impact-${events
    .slice(0, 10)
    .map((e) => e.title.slice(0, 20))
    .join("|")}`;

  const cached = analysisCache.get<string>(cacheKey);
  if (cached) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: cached })}\n\n`));
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });
    return new Response(stream, {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
    });
  }

  const prompt = buildPrompt(events);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        let fullContent = "";
        const apiStream = client!.messages.stream({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1024,
          messages: [{ role: "user", content: prompt }],
        });

        for await (const event of apiStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            fullContent += event.delta.text;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ content: fullContent })}\n\n`)
            );
          }
        }

        analysisCache.set(cacheKey, fullContent, 20 * 60 * 1000); // 20 min cache
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (err) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: String(err) })}\n\n`)
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
