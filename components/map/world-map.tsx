"use client";

import { useState, useCallback } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";
import { useRouter } from "next/navigation";
import { ConflictMarker } from "./conflict-marker";
import { MapTooltip } from "./map-tooltip";
import { MapLegend } from "./map-legend";
import { GEO_URL, IMPACT_GRADIENT } from "@/lib/constants";
import type { Conflict } from "@/types";

interface WorldMapProps {
  conflicts: Conflict[];
}

function getCountryColor(countryCode: string, conflicts: Conflict[]): string {
  // Find the conflict affecting this country
  for (const conflict of conflicts) {
    if (conflict.affectedCountryCodes.includes(countryCode)) {
      const impact = conflict.estimatedGdpImpact;
      // Find appropriate color from gradient
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

export function WorldMap({ conflicts }: WorldMapProps) {
  const router = useRouter();
  const [tooltip, setTooltip] = useState<{
    conflict: Conflict;
    position: { x: number; y: number };
  } | null>(null);

  const handleHover = useCallback(
    (conflict: Conflict | null, event?: React.MouseEvent) => {
      if (conflict && event) {
        setTooltip({
          conflict,
          position: { x: event.clientX, y: event.clientY },
        });
      } else {
        setTooltip(null);
      }
    },
    []
  );

  const handleClick = useCallback(
    (conflict: Conflict) => {
      router.push(`/conflicts/${conflict.id}`);
    },
    [router]
  );

  return (
    <div className="relative w-full aspect-[2/1] bg-muted/30 rounded-lg overflow-hidden border">
      <ComposableMap
        projectionConfig={{ rotate: [-10, 0, 0], scale: 147 }}
        className="w-full h-full"
      >
        <ZoomableGroup center={[0, 20]} zoom={1}>
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const countryCode = geo.properties?.ISO_A3 || geo.id;
                const fillColor = getCountryColor(countryCode, conflicts);

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={fillColor}
                    stroke="var(--border)"
                    strokeWidth={0.5}
                    style={{
                      default: { outline: "none" },
                      hover: { outline: "none", fill: fillColor, opacity: 0.8 },
                      pressed: { outline: "none" },
                    }}
                  />
                );
              })
            }
          </Geographies>
          {conflicts.map((conflict) => (
            <ConflictMarker
              key={conflict.id}
              conflict={conflict}
              onHover={handleHover}
              onClick={handleClick}
            />
          ))}
        </ZoomableGroup>
      </ComposableMap>
      <MapLegend />
      {tooltip && (
        <MapTooltip conflict={tooltip.conflict} position={tooltip.position} />
      )}
    </div>
  );
}
