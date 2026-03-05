import { GoogleGenerativeAI } from "@google/generative-ai";
import { analysisCache } from "@/lib/cache";
import type { AnalysisRequest } from "@/types";

const getClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenerativeAI(apiKey);
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
  request: AnalysisRequest,
): AsyncGenerator<string, void, unknown> {
  const cacheKey = `analysis-${request.conflictId}`;
  const cached = analysisCache.get<string>(cacheKey);

  if (cached) {
    yield cached;
    return;
  }

  const genAI = getClient();

  if (!genAI) {
    throw new Error(
      "GEMINI_API_KEY required for AI analysis. Set it in .env.local",
    );
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const prompt = buildPrompt(request);

  const result = await model.generateContentStream(prompt);

  let fullContent = "";

  for await (const chunk of result.stream) {
    const chunkText = chunk.text();
    fullContent += chunkText;
    yield fullContent;
  }

  analysisCache.set(cacheKey, fullContent); // 1h cache
}
