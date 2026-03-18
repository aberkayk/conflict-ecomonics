"use client";

import { useState, useCallback } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from "react-simple-maps";
import { geoCentroid } from "d3-geo";
import { useRouter } from "next/navigation";
import { ConflictMarker } from "./conflict-marker";
import { EventMarker } from "./event-marker";
import { MapTooltip } from "./map-tooltip";
import { EventTooltip } from "./event-tooltip";
import { MapLegend } from "./map-legend";
import { GEO_URL, IMPACT_GRADIENT } from "@/lib/constants";
import type { Conflict } from "@/types";
import type { MapEvent } from "@/types/event";

interface WorldMapProps {
  conflicts: Conflict[];
  events?: MapEvent[];
}

function getCountryColor(countryCode: string, conflicts: Conflict[]): string {
  for (const conflict of conflicts) {
    if (conflict.affectedCountryCodes.includes(countryCode)) {
      const impact = conflict.estimatedGdpImpact;
      for (let i = IMPACT_GRADIENT.length - 1; i >= 0; i--) {
        if (impact <= IMPACT_GRADIENT[i].threshold) {
          return IMPACT_GRADIENT[i].color;
        }
      }
      return IMPACT_GRADIENT[0].color;
    }
  }
  return "var(--map-default, #d4d4d8)";
}

export function WorldMap({ conflicts, events = [] }: WorldMapProps) {
  const router = useRouter();

  // Track the current zoom level so we can keep label / marker sizes
  // constant on screen (divide all SVG sizes by zoom).
  const [zoom, setZoom] = useState(1);

  const [conflictTooltip, setConflictTooltip] = useState<{
    conflict: Conflict;
    position: { x: number; y: number };
  } | null>(null);

  const [eventTooltip, setEventTooltip] = useState<{
    event: MapEvent;
    position: { x: number; y: number };
  } | null>(null);

  const handleConflictHover = useCallback(
    (conflict: Conflict | null, e?: React.MouseEvent) => {
      if (conflict && e) {
        setEventTooltip(null);
        setConflictTooltip({ conflict, position: { x: e.clientX, y: e.clientY } });
      } else {
        setConflictTooltip(null);
      }
    },
    []
  );

  const handleEventHover = useCallback(
    (event: MapEvent | null, e?: React.MouseEvent) => {
      if (event && e) {
        setConflictTooltip(null);
        setEventTooltip({ event, position: { x: e.clientX, y: e.clientY } });
      } else {
        setEventTooltip(null);
      }
    },
    []
  );

  const handleConflictClick = useCallback(
    (conflict: Conflict) => router.push(`/conflicts/${conflict.id}`),
    [router]
  );

  // Partial zoom compensation: labels grow moderately when zoomed in
  // (dividing by sqrt(zoom) instead of zoom so they aren't pinned to a fixed screen size)
  const sqrtZoom = Math.sqrt(zoom);
  const labelFontSize = 5 / sqrtZoom;
  const labelStroke = 1.5 / sqrtZoom;
  const showLabels = zoom >= 0.8;

  const borderStroke = 0.5 / zoom;

  return (
    <div className="relative w-full aspect-[2/1] bg-muted/30 rounded-lg overflow-hidden border">
      {/* Live events badge */}
      {events.length > 0 && (
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-background/90 backdrop-blur border rounded-full px-2.5 py-1 text-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
          </span>
          <span className="font-medium">{events.length} live events</span>
        </div>
      )}

      <ComposableMap
        projectionConfig={{ rotate: [-10, 0, 0], scale: 147 }}
        className="w-full h-full"
      >
        <ZoomableGroup
          center={[0, 20]}
          zoom={1}
          onMoveEnd={({ zoom: newZoom }) => setZoom(newZoom)}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) => (
              <>
                {/* Pass 1: country shapes */}
                {geographies.map((geo) => {
                  const countryCode = geo.properties?.ISO_A3 || geo.id;
                  const fillColor = getCountryColor(countryCode, conflicts);
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={fillColor}
                      stroke="var(--border)"
                      strokeWidth={borderStroke}
                      style={{
                        default: { outline: "none" },
                        hover: { outline: "none", fill: fillColor, opacity: 0.8 },
                        pressed: { outline: "none" },
                      }}
                    />
                  );
                })}

                {/* Pass 2: country name labels — zoom-normalised */}
                {showLabels &&
                  geographies.map((geo) => {
                    const name: string | undefined = geo.properties?.name;
                    if (!name) return null;
                    const centroid = geoCentroid(geo);
                    return (
                      <Marker key={`label-${geo.rsmKey}`} coordinates={centroid}>
                        <text
                          textAnchor="middle"
                          dominantBaseline="middle"
                          style={{
                            fontSize: `${labelFontSize}px`,
                            fontWeight: 500,
                            pointerEvents: "none",
                          }}
                          stroke="#ffffff"
                          strokeWidth={labelStroke}
                          strokeLinejoin="round"
                          paintOrder="stroke"
                          fill="#374151"
                        >
                          {name}
                        </text>
                      </Marker>
                    );
                  })}
              </>
            )}
          </Geographies>

          {/* Layer 1: Conflict markers */}
          {conflicts.map((conflict) => (
            <ConflictMarker
              key={conflict.id}
              conflict={conflict}
              zoom={zoom}
              onHover={handleConflictHover}
              onClick={handleConflictClick}
            />
          ))}

          {/* Layer 2: Live event markers */}
          {events.map((event) => (
            <EventMarker
              key={event.id}
              event={event}
              zoom={zoom}
              onHover={handleEventHover}
            />
          ))}
        </ZoomableGroup>
      </ComposableMap>

      <MapLegend />

      {conflictTooltip && (
        <MapTooltip
          conflict={conflictTooltip.conflict}
          position={conflictTooltip.position}
        />
      )}

      {eventTooltip && (
        <EventTooltip
          event={eventTooltip.event}
          position={eventTooltip.position}
        />
      )}
    </div>
  );
}
