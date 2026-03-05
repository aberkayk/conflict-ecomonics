export interface EconomicDataPoint {
  date: string;
  value: number;
}

export interface EconomicTimeSeries {
  indicator: string;
  country: string;
  countryCode: string;
  unit: string;
  data: EconomicDataPoint[];
}

export interface CurrencyRate {
  currency: string;
  rate: number;
  change24h: number;
  change7d: number;
}

export interface CommodityPrice {
  name: string;
  symbol: string;
  price: number;
  change: number;
  unit: string;
}

export interface EconomicIndicators {
  gdpGrowth: EconomicTimeSeries[];
  inflation: EconomicTimeSeries[];
  tradeBalance: EconomicTimeSeries[];
  currencies: CurrencyRate[];
  commodities: CommodityPrice[];
}

export type IndicatorType = "gdp" | "inflation" | "trade" | "currency" | "commodity";
export type TimeRange = "1m" | "3m" | "6m" | "1y" | "5y";
export type Region = "all" | "africa" | "asia" | "europe" | "middle-east" | "americas";
