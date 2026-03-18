"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { SEVERITY_COLORS } from "@/lib/constants";
import type { Conflict } from "@/types";
import type { MapEvent } from "@/types/event";

const EVENT_COLORS: Record<string, string> = {
  airstrike: "#ef4444",
  attack: "#f97316",
  explosion: "#eab308",
  military: "#3b82f6",
  protest: "#8b5cf6",
  humanitarian: "#22c55e",
  other: "#94a3b8",
};

const SEVERITY_RADIUS: Record<string, number> = {
  low: 8,
  medium: 11,
  high: 15,
  critical: 19,
};

const SOURCE_LABEL: Record<string, string> = {
  gdelt: "GDELT",
  rss: "RSS",
  manual: "Manual",
};

// Two-layer CartoDB approach: base map (no labels) + labels-only overlay.
// The overlay can be given boosted opacity so country names are more prominent.
const CARTO_BASE =
  "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png";
const CARTO_LABELS =
  "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png";
const CARTO_ATTR =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

function getEventColor(type?: string): string {
  return EVENT_COLORS[type ?? "other"] ?? EVENT_COLORS.other;
}

/** Syncs the leaflet-dark class on the map container whenever theme changes. */
function ThemeSync({ isDark }: { isDark: boolean }) {
  const map = useMap();
  useEffect(() => {
    const el = map.getContainer();
    el.classList.toggle("leaflet-dark", isDark);
  }, [map, isDark]);
  return null;
}

interface Props {
  conflicts: Conflict[];
  events: MapEvent[];
}

export default function LeafletMapInner({ conflicts, events }: Props) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <div className="relative w-full aspect-2/1 rounded-lg overflow-hidden border">
      {/* Live events badge */}
      {events.length > 0 && (
        <div className="absolute top-3 right-3 z-1000 flex items-center gap-1.5 bg-background/90 backdrop-blur border rounded-full px-2.5 py-1 text-xs pointer-events-none">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
          </span>
          <span className="font-medium">{events.length} live events</span>
        </div>
      )}

      <MapContainer
        center={[20, 10]}
        zoom={2}
        minZoom={1}
        maxZoom={13}
        className="absolute inset-0"
        scrollWheelZoom
        zoomControl
      >
        <ThemeSync isDark={isDark} />
        <TileLayer url={CARTO_BASE} attribution={CARTO_ATTR} />
        {/* Labels tile doubled for bolder appearance */}
        <TileLayer url={CARTO_LABELS} />
        <TileLayer url={CARTO_LABELS} />

        {/* Event dots — small, colored by type */}
        {events.map((event) => {
          const color = getEventColor(event.type);
          return (
            <CircleMarker
              key={event.id}
              center={[event.lat, event.lng]}
              radius={4}
              fillColor={color}
              fillOpacity={0.85}
              color="#fff"
              weight={1}
            >
              <Popup maxWidth={220}>
                <div style={{ fontSize: "12px", lineHeight: "1.5" }}>
                  <div
                    style={{
                      display: "flex",
                      gap: "6px",
                      marginBottom: "5px",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        background: color + "28",
                        color,
                        padding: "1px 7px",
                        borderRadius: "4px",
                        fontSize: "10px",
                        fontWeight: 600,
                        textTransform: "capitalize",
                      }}
                    >
                      {event.type ?? "event"}
                    </span>
                    <span style={{ opacity: 0.55, fontSize: "10px" }}>
                      {SOURCE_LABEL[event.source]}
                    </span>
                  </div>
                  <p style={{ fontWeight: 600, marginBottom: "3px" }}>
                    {event.title}
                  </p>
                  {event.country && (
                    <p style={{ opacity: 0.6 }}>{event.country}</p>
                  )}
                  <p style={{ opacity: 0.6 }}>
                    {new Date(event.date).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  {event.url && (
                    <a
                      href={event.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "#3b82f6",
                        display: "block",
                        marginTop: "5px",
                      }}
                    >
                      Open article →
                    </a>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        {/* Conflict markers — larger, thick white border, colored by severity */}
        {conflicts.map((conflict) => {
          const color = SEVERITY_COLORS[conflict.severity];
          const radius = SEVERITY_RADIUS[conflict.severity] ?? 11;
          return (
            <CircleMarker
              key={conflict.id}
              center={[conflict.latitude, conflict.longitude]}
              radius={radius}
              fillColor={color}
              fillOpacity={0.45}
              color={color}
              weight={1.5}
            >
              <Popup maxWidth={220}>
                <div style={{ fontSize: "12px", lineHeight: "1.5" }}>
                  <p style={{ fontWeight: 700, marginBottom: "2px" }}>
                    {conflict.name}
                  </p>
                  <p style={{ opacity: 0.6, marginBottom: "8px" }}>
                    {conflict.countries.join(", ")}
                  </p>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "4px 14px",
                    }}
                  >
                    <div>
                      <p style={{ opacity: 0.55, fontSize: "10px" }}>
                        Severity
                      </p>
                      <p
                        style={{
                          fontWeight: 600,
                          color,
                          textTransform: "capitalize",
                        }}
                      >
                        {conflict.severity}
                      </p>
                    </div>
                    <div>
                      <p style={{ opacity: 0.55, fontSize: "10px" }}>
                        GDP Impact
                      </p>
                      <p style={{ fontWeight: 600, color: "#ef4444" }}>
                        {conflict.estimatedGdpImpact}%
                      </p>
                    </div>
                    <div>
                      <p style={{ opacity: 0.55, fontSize: "10px" }}>
                        Fatalities
                      </p>
                      <p style={{ fontWeight: 600 }}>
                        {conflict.totalFatalities.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p style={{ opacity: 0.55, fontSize: "10px" }}>
                        Displaced
                      </p>
                      <p style={{ fontWeight: 600 }}>
                        {(conflict.estimatedDisplaced / 1_000_000).toFixed(1)}M
                      </p>
                    </div>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-1000 bg-background/90 backdrop-blur border rounded-lg p-3 text-xs pointer-events-none">
        <p className="font-medium mb-2">Severity</p>
        <div className="flex flex-col gap-1.5">
          {(["critical", "high", "medium", "low"] as const).map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full border-2 border-white/40"
                style={{ background: SEVERITY_COLORS[s] }}
              />
              <span className="capitalize text-muted-foreground">{s}</span>
            </div>
          ))}
          <div className="mt-1 pt-1.5 border-t flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-muted-foreground">Live event</span>
          </div>
        </div>
      </div>
    </div>
  );
}
