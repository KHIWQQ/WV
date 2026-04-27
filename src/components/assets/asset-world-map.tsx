"use client";

import React, { useMemo, useRef, useCallback, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";
import { scaleLinear } from "d3-scale";
import { Globe, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import type { Asset } from "@/types";
import { useTranslation } from "@/lib/i18n";
import { formatTHB } from "@/lib/utils/format";
import {
  getAlpha2FromNumeric,
  getCountryNameFromAlpha2,
} from "@/lib/utils/countries";
import { Button } from "@/components/ui/button";

const GEO_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Color palette for the gradient stops
const COLORS = {
  low: "#3b82f6", // blue-500
  mid: "#8b5cf6", // violet-500
  high: "#f59e0b", // amber-500
  empty: {
    light: "hsl(220 14% 92%)",
    dark: "hsl(215 50% 16%)",
  },
  stroke: {
    light: "hsl(220 14% 85%)",
    dark: "hsl(215 40% 22%)",
  },
} as const;

interface AssetWorldMapProps {
  assets: Asset[];
}

interface Position {
  coordinates: [number, number];
  zoom: number;
}

export function AssetWorldMap({ assets }: AssetWorldMapProps) {
  const { t } = useTranslation();
  const tooltipRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [geoError, setGeoError] = useState(false);
  const [position, setPosition] = useState<Position>({
    coordinates: [0, 20],
    zoom: 1,
  });

  // Aggregate asset values by ISO Alpha-2 country code
  const { dataByCountry, maxValue, countriesWithAssets } = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const asset of assets) {
      const code = asset.country_code || "TH";
      acc[code] = (acc[code] || 0) + (asset.current_value || 0);
    }
    const values = Object.values(acc);
    return {
      dataByCountry: acc,
      maxValue: values.length > 0 ? Math.max(...values) : 1,
      countriesWithAssets: Object.keys(acc).length,
    };
  }, [assets]);

  // Memoize color scale to prevent recreation each render
  const colorScale = useMemo(
    () =>
      scaleLinear<string>()
        .domain([0, maxValue * 0.5, maxValue])
        .range([COLORS.low, COLORS.mid, COLORS.high]),
    [maxValue]
  );

  // Sort countries by value for legend
  const topCountries = useMemo(() => {
    return Object.entries(dataByCountry)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([code, value]) => ({
        code,
        name: getCountryNameFromAlpha2(code) || code,
        value,
        pct:
          assets.reduce((s, a) => s + a.current_value, 0) > 0
            ? (value /
                assets.reduce((s, a) => s + a.current_value, 0)) *
              100
            : 0,
      }));
  }, [dataByCountry, assets]);

  // Tooltip handlers — DOM manipulation only, no React state
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!tooltipRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + 16;
    const y = e.clientY - rect.top - 12;
    tooltipRef.current.style.left = `${x}px`;
    tooltipRef.current.style.top = `${y}px`;
  }, []);

  const handleMouseEnter = useCallback(
    (countryName: string, countryValue: number) => {
      if (!tooltipRef.current) return;
      tooltipRef.current.innerHTML = countryValue > 0
        ? `<span class="font-semibold">${countryName}</span><br/><span class="text-xs opacity-80">${formatTHB(countryValue)}</span>`
        : `<span class="font-semibold">${countryName}</span>`;
      tooltipRef.current.style.display = "block";
    },
    []
  );

  const handleMouseLeave = useCallback(() => {
    if (tooltipRef.current) {
      tooltipRef.current.style.display = "none";
    }
  }, []);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    setPosition((p) => ({ ...p, zoom: Math.min(p.zoom * 1.5, 6) }));
  }, []);

  const handleZoomOut = useCallback(() => {
    setPosition((p) => ({ ...p, zoom: Math.max(p.zoom / 1.5, 1) }));
  }, []);

  const handleReset = useCallback(() => {
    setPosition({ coordinates: [0, 20], zoom: 1 });
  }, []);

  const isEmpty = assets.length === 0;

  return (
    <div className="glass-card overflow-hidden rounded-2xl lg:col-span-2">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Globe className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">
              {t.dashboard.assetAllocation}
            </h3>
            <p className="text-xs text-muted-foreground">
              {countriesWithAssets > 0
                ? `${countriesWithAssets} ${countriesWithAssets === 1 ? "country" : "countries"}`
                : "No data yet"}
            </p>
          </div>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleZoomIn}
            aria-label="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleZoomOut}
            aria-label="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleReset}
            aria-label="Reset view"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* Map */}
        <div
          ref={containerRef}
          className="relative flex-1 min-h-[360px] lg:min-h-[420px]"
          onMouseMove={handleMouseMove}
        >
          {/* Tooltip */}
          <div
            ref={tooltipRef}
            className="absolute z-50 rounded-lg bg-popover px-3 py-2 text-sm text-popover-foreground shadow-lg border border-border/60 pointer-events-none leading-relaxed"
            style={{ display: "none" }}
          />

          {geoError ? (
            <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
              Failed to load map data
            </div>
          ) : (
            <ComposableMap
              projectionConfig={{ scale: 148, center: [10, 10] }}
              className="w-full h-full"
              style={{ width: "100%", height: "100%" }}
            >
              <ZoomableGroup
                center={position.coordinates}
                zoom={position.zoom}
                maxZoom={6}
                onMoveEnd={setPosition}
              >
                <Geographies
                  geography={GEO_URL}
                  parseGeographies={(geos) => {
                    setGeoError(false);
                    return geos;
                  }}
                >
                  {({ geographies }) =>
                    geographies.map((geo) => {
                      const alpha2 =
                        getAlpha2FromNumeric(geo.id) || "Unknown";
                      const countryValue = dataByCountry[alpha2] || 0;
                      const countryName =
                        getCountryNameFromAlpha2(alpha2) ||
                        geo.properties.name;
                      const hasValue = countryValue > 0;

                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          fill={
                            hasValue
                              ? colorScale(countryValue)
                              : undefined
                          }
                          className={
                            hasValue
                              ? "fill-current stroke-background/30 transition-opacity duration-150"
                              : "fill-muted stroke-border/30 transition-opacity duration-150"
                          }
                          style={{
                            default: {
                              outline: "none",
                              ...(hasValue
                                ? { fill: colorScale(countryValue) }
                                : {}),
                            },
                            hover: {
                              outline: "none",
                              opacity: 0.75,
                              cursor: "pointer",
                              ...(hasValue
                                ? { fill: colorScale(countryValue) }
                                : {}),
                            },
                            pressed: { outline: "none" },
                          }}
                          onMouseEnter={() =>
                            handleMouseEnter(countryName, countryValue)
                          }
                          onMouseLeave={handleMouseLeave}
                        />
                      );
                    })
                  }
                </Geographies>
              </ZoomableGroup>
            </ComposableMap>
          )}

          {/* Empty state overlay */}
          {isEmpty && !geoError && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-[1px]">
              <div className="text-center">
                <Globe className="mx-auto h-10 w-10 text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">
                  Add assets to see your global allocation
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Legend / Top countries sidebar */}
        {topCountries.length > 0 && (
          <div className="w-full border-t border-border/50 p-4 lg:w-56 lg:border-l lg:border-t-0">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Top Countries
            </p>
            <div className="space-y-2.5">
              {topCountries.map((c) => (
                <div key={c.code} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground truncate mr-2">
                      {c.name}
                    </span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {c.pct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(c.pct, 2)}%`,
                        backgroundColor: colorScale(c.value),
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Gradient legend */}
            <div className="mt-5 pt-4 border-t border-border/50">
              <p className="mb-2 text-xs text-muted-foreground">Value scale</p>
              <div
                className="h-2 w-full rounded-full"
                style={{
                  background: `linear-gradient(to right, ${COLORS.low}, ${COLORS.mid}, ${COLORS.high})`,
                }}
              />
              <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                <span>Low</span>
                <span>High</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
