import { cache } from "@/lib/cache";
import type { EconomicTimeSeries, CurrencyRate, CommodityPrice } from "@/types";

const WB_BASE = "https://api.worldbank.org/v2";
const FRANKFURTER_BASE = "https://api.frankfurter.app";

// ─── World Bank helpers (free, no key) ────────────────────────────────

interface WBDataPoint {
  indicator: { id: string; value: string };
  country: { id: string; value: string };
  countryiso3code: string;
  date: string;
  value: number | null;
}

async function fetchWorldBankIndicator(
  countryCodes: string[],
  indicatorId: string,
  indicatorName: string,
  unit: string,
  dateRange = "2015:2025"
): Promise<EconomicTimeSeries[]> {
  const results: EconomicTimeSeries[] = [];

  const fetches = countryCodes.slice(0, 8).map(async (code) => {
    const url = `${WB_BASE}/country/${code}/indicator/${indicatorId}?format=json&date=${dateRange}&per_page=50`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return null;

    const json = await res.json();
    if (!json[1] || !Array.isArray(json[1])) return null;

    const dataPoints = (json[1] as WBDataPoint[])
      .filter((d) => d.value !== null)
      .map((d) => ({ date: d.date, value: Math.round((d.value as number) * 100) / 100 }))
      .reverse();

    if (dataPoints.length === 0) return null;

    return {
      indicator: indicatorName,
      country: json[1][0]?.country?.value || code,
      countryCode: code,
      unit,
      data: dataPoints,
    } satisfies EconomicTimeSeries;
  });

  const settled = await Promise.allSettled(fetches);
  for (const result of settled) {
    if (result.status === "fulfilled" && result.value) {
      results.push(result.value);
    }
  }

  return results;
}

// ─── GDP (World Bank — free) ──────────────────────────────────────────

export async function fetchGDPData(countryCodes: string[]): Promise<EconomicTimeSeries[]> {
  if (countryCodes.length === 0) return [];
  const cacheKey = `gdp-${countryCodes.join(",")}`;
  const cached = cache.get<EconomicTimeSeries[]>(cacheKey);
  if (cached) return cached;

  const results = await fetchWorldBankIndicator(countryCodes, "NY.GDP.MKTP.KD.ZG", "GDP Growth", "%");
  if (results.length > 0) cache.set(cacheKey, results, 6 * 60 * 60 * 1000);
  return results;
}

// ─── Inflation (World Bank — free) ────────────────────────────────────

export async function fetchInflationData(countryCodes: string[]): Promise<EconomicTimeSeries[]> {
  if (countryCodes.length === 0) return [];
  const cacheKey = `inflation-${countryCodes.join(",")}`;
  const cached = cache.get<EconomicTimeSeries[]>(cacheKey);
  if (cached) return cached;

  const results = await fetchWorldBankIndicator(countryCodes, "FP.CPI.TOTL.ZG", "Inflation (CPI)", "%");
  if (results.length > 0) cache.set(cacheKey, results, 6 * 60 * 60 * 1000);
  return results;
}

// ─── Trade (World Bank — free) ────────────────────────────────────────

export async function fetchTradeData(countryCodes: string[]): Promise<EconomicTimeSeries[]> {
  if (countryCodes.length === 0) return [];
  const cacheKey = `trade-${countryCodes.join(",")}`;
  const cached = cache.get<EconomicTimeSeries[]>(cacheKey);
  if (cached) return cached;

  const results = await fetchWorldBankIndicator(countryCodes, "NE.TRD.GNFS.ZS", "Trade (% of GDP)", "%");
  if (results.length > 0) cache.set(cacheKey, results, 6 * 60 * 60 * 1000);
  return results;
}

// ─── Currency Rates (Frankfurter API — free, no key) ──────────────────

const FRANKFURTER_CURRENCIES = ["EUR", "GBP", "TRY", "PLN", "ILS", "INR", "THB", "ZAR", "BRL", "CNY"];

export async function fetchCurrencyRates(): Promise<CurrencyRate[]> {
  const cacheKey = "currencies-live";
  const cached = cache.get<CurrencyRate[]>(cacheKey);
  if (cached) return cached;

  const symbols = FRANKFURTER_CURRENCIES.join(",");

  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 8);
  const dayAgo = new Date(today);
  dayAgo.setDate(dayAgo.getDate() - 2);

  const [latestRes, weekAgoRes, dayAgoRes] = await Promise.all([
    fetch(`${FRANKFURTER_BASE}/latest?base=USD&symbols=${symbols}`),
    fetch(`${FRANKFURTER_BASE}/${weekAgo.toISOString().split("T")[0]}?base=USD&symbols=${symbols}`),
    fetch(`${FRANKFURTER_BASE}/${dayAgo.toISOString().split("T")[0]}?base=USD&symbols=${symbols}`),
  ]);

  if (!latestRes.ok) throw new Error(`Frankfurter API error: ${latestRes.status}`);

  const latest = await latestRes.json();
  const weekData = weekAgoRes.ok ? await weekAgoRes.json() : null;
  const dayData = dayAgoRes.ok ? await dayAgoRes.json() : null;

  const rates: CurrencyRate[] = Object.entries(latest.rates as Record<string, number>).map(
    ([currency, rate]) => {
      const weekRate = weekData?.rates?.[currency] || rate;
      const dayRate = dayData?.rates?.[currency] || rate;
      return {
        currency,
        rate: Math.round(rate * 10000) / 10000,
        change24h: Math.round(((rate - dayRate) / dayRate) * 10000) / 100,
        change7d: Math.round(((rate - weekRate) / weekRate) * 10000) / 100,
      };
    }
  );

  cache.set(cacheKey, rates, 30 * 60 * 1000);
  return rates;
}

// ─── Commodities (Yahoo Finance — free, public) ───────────────────────

interface YahooChartResult {
  chart: {
    result: Array<{
      meta: {
        regularMarketPrice: number;
        chartPreviousClose: number;
        shortName: string;
        symbol: string;
      };
    }> | null;
    error: unknown;
  };
}

const COMMODITY_SYMBOLS = [
  { symbol: "CL=F", name: "Crude Oil (WTI)", unit: "$/barrel" },
  { symbol: "BZ=F", name: "Crude Oil (Brent)", unit: "$/barrel" },
  { symbol: "NG=F", name: "Natural Gas", unit: "$/MMBtu" },
  { symbol: "ZW=F", name: "Wheat", unit: "¢/bushel" },
  { symbol: "GC=F", name: "Gold", unit: "$/oz" },
  { symbol: "HG=F", name: "Copper", unit: "$/lb" },
];

export async function fetchCommodityPrices(): Promise<CommodityPrice[]> {
  const cacheKey = "commodities-live";
  const cached = cache.get<CommodityPrice[]>(cacheKey);
  if (cached) return cached;

  const fetches = COMMODITY_SYMBOLS.map(async ({ symbol, name, unit }) => {
    try {
      const res = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=5d&interval=1d`,
        { headers: { "User-Agent": "Mozilla/5.0" }, next: { revalidate: 1800 } }
      );
      if (!res.ok) return null;

      const json = (await res.json()) as YahooChartResult;
      const meta = json.chart?.result?.[0]?.meta;
      if (!meta) return null;

      const price = meta.regularMarketPrice;
      const prevClose = meta.chartPreviousClose;
      const change = prevClose ? ((price - prevClose) / prevClose) * 100 : 0;

      return {
        name,
        symbol: symbol.replace("=F", ""),
        price: Math.round(price * 100) / 100,
        change: Math.round(change * 100) / 100,
        unit,
      } satisfies CommodityPrice;
    } catch {
      return null;
    }
  });

  const settled = await Promise.allSettled(fetches);
  const results: CommodityPrice[] = [];
  for (const result of settled) {
    if (result.status === "fulfilled" && result.value) {
      results.push(result.value);
    }
  }

  if (results.length > 0) {
    cache.set(cacheKey, results, 30 * 60 * 1000);
  }
  return results;
}
