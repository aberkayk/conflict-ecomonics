export const REGIONS = [
  { value: "all", label: "All Regions" },
  { value: "africa", label: "Africa" },
  { value: "asia", label: "Asia" },
  { value: "europe", label: "Europe" },
  { value: "middle-east", label: "Middle East" },
  { value: "americas", label: "Americas" },
] as const;

export const TIME_RANGES = [
  { value: "1m", label: "1 Month" },
  { value: "3m", label: "3 Months" },
  { value: "6m", label: "6 Months" },
  { value: "1y", label: "1 Year" },
  { value: "5y", label: "5 Years" },
] as const;

export const INDICATORS = [
  { value: "gdp", label: "GDP Growth" },
  { value: "inflation", label: "Inflation" },
  { value: "trade", label: "Trade Balance" },
  { value: "currency", label: "Currency" },
  { value: "commodity", label: "Commodities" },
] as const;

export const SEVERITY_COLORS = {
  low: "#22c55e",
  medium: "#eab308",
  high: "#f97316",
  critical: "#ef4444",
} as const;

export const IMPACT_GRADIENT = [
  { threshold: 0, color: "#22c55e" },
  { threshold: -1, color: "#86efac" },
  { threshold: -3, color: "#fde047" },
  { threshold: -5, color: "#fb923c" },
  { threshold: -10, color: "#ef4444" },
  { threshold: -20, color: "#991b1b" },
] as const;

export const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export const COUNTRY_CODE_MAP: Record<string, string> = {
  UKR: "Ukraine", RUS: "Russia", BLR: "Belarus", POL: "Poland", MDA: "Moldova",
  SDN: "Sudan", TCD: "Chad", EGY: "Egypt", SSD: "South Sudan", ETH: "Ethiopia",
  ISR: "Israel", PSE: "Palestine", LBN: "Lebanon", JOR: "Jordan",
  MMR: "Myanmar", THA: "Thailand", BGD: "Bangladesh", IND: "India",
  ERI: "Eritrea", SOM: "Somalia", DJI: "Djibouti",
  MLI: "Mali", BFA: "Burkina Faso", NER: "Niger", NGA: "Nigeria",
  COD: "DR Congo", RWA: "Rwanda", UGA: "Uganda", BDI: "Burundi",
  YEM: "Yemen", SAU: "Saudi Arabia", OMN: "Oman",
};
