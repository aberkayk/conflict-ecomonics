import { NextRequest } from "next/server";
import { z } from "zod";
import { streamAnalysis } from "@/lib/api/gemini";
import { analysisLimiter } from "@/lib/rate-limiter";

const RequestSchema = z.object({
  conflictId: z.string(),
  conflictName: z.string(),
  countries: z.array(z.string()),
  region: z.string(),
  economicContext: z.string().optional(),
  focusAreas: z.array(z.string()).optional(),
});

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

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
    });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({
        error: "Invalid request",
        details: parsed.error.flatten(),
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  if (!process.env.GEMINI_API_KEY) {
    return new Response(
      JSON.stringify({
        error: "GEMINI_API_KEY required for AI analysis. Set it in .env.local",
      }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const content of streamAnalysis(parsed.data)) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ content })}\n\n`),
          );
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (error) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ error: String(error) })}\n\n`,
          ),
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
