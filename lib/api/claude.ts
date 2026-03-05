import Anthropic from "@anthropic-ai/sdk";
import { analysisCache } from "@/lib/cache";
import type { AnalysisRequest } from "@/types";

const getClient = () => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  return new Anthropic({ apiKey });
};

function buildPrompt(request: AnalysisRequest): string {
  return `You are an expert geopolitical and economic analyst. Analyze the economic impact of the following conflict.

## Conflict Details
- **Name**: ${request.conflictName}
- **Countries Involved**: ${request.countries.join(", ")}
- **Region**: ${request.region}

${request.economicContext ? `## Economic Context\n${request.economicContext}` : ""}

## Analysis Required
Provide a comprehensive but concise analysis covering:

1. **Direct Economic Impact**: GDP loss estimates, infrastructure damage, production disruption
2. **Trade & Supply Chain Effects**: Trade route disruptions, export/import impacts, supply chain vulnerabilities
3. **Currency & Financial Markets**: Currency depreciation, capital flight, investment climate
4. **Commodity Impact**: Effects on energy prices, agricultural commodities, minerals
5. **Humanitarian Economic Cost**: Displacement costs, humanitarian aid needs, long-term development setback
6. **Regional Spillover**: Economic impact on neighboring countries and trading partners
7. **Outlook**: Short-term (6 months) and medium-term (2-3 years) economic forecast

Format with markdown headers and bullet points. Include estimated figures where possible. Be analytical, not speculative. Use real data and known economic indicators where available.`;
}

export async function* streamAnalysis(
  request: AnalysisRequest
): AsyncGenerator<string, void, unknown> {
  const cacheKey = `analysis-${request.conflictId}`;
  const cached = analysisCache.get<string>(cacheKey);

  if (cached) {
    yield cached;
    return;
  }

  const client = getClient();

  if (!client) {
    throw new Error(
      "ANTHROPIC_API_KEY required for AI analysis. Get your key at https://console.anthropic.com/ and set it in .env.local"
    );
  }

  const prompt = buildPrompt(request);

  const stream = client.messages.stream({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2500,
    messages: [{ role: "user", content: prompt }],
  });

  let fullContent = "";

  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      fullContent += event.delta.text;
      yield fullContent;
    }
  }

  analysisCache.set(cacheKey, fullContent); // 1h cache
}
