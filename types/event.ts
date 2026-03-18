export interface MapEvent {
  id: string;
  title: string;
  description: string;
  lat: number;
  lng: number;
  country?: string;
  source: "gdelt" | "rss" | "manual";
  url?: string;
  date: string; // ISO date string YYYY-MM-DD
  type?: string;
}
