"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { getFxRates } from "@/lib/actions/fx";

/**
 * Fetches THB exchange rates for the given list of currencies.
 * Result is a stable map (memoized on caller side via queryKey) so it can
 * be passed to expensive aggregations without re-renders.
 */
export function useFxRates(currencies: string[]) {
  // Stable, sorted key so [USD, EUR] and [EUR, USD] hit the same cache entry
  const sortedKey = useMemo(
    () => Array.from(new Set(currencies.map((c) => (c || "THB").toUpperCase()))).sort(),
    [currencies]
  );

  return useQuery({
    queryKey: ["fx", sortedKey],
    queryFn: () => getFxRates(sortedKey),
    enabled: sortedKey.length > 0,
    // FX rates barely change minute-to-minute, plus the server caches 5 min
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    placeholderData: (prev) => prev,
  });
}

/**
 * Convert a value+currency to home (THB) using a rate map.
 * Falls back to 1:1 when the rate is missing.
 */
export function toHome(
  value: number,
  currency: string | null | undefined,
  rates: Record<string, number> | undefined
): number {
  const cur = (currency ?? "THB").toUpperCase();
  const rate = rates?.[cur] ?? 1;
  return value * rate;
}
