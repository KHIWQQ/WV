"use client";

import { useQuery } from "@tanstack/react-query";
import type { MarketQuote, MarketSearchResult, PriceHistoryPoint, TimeRange } from "@/types";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export function useMarketSearch(query: string) {
  return useQuery({
    queryKey: ["market", "search", query],
    queryFn: () =>
      fetchJson<{ results: MarketSearchResult[] }>(
        `/api/v1/market/search?q=${encodeURIComponent(query)}`
      ).then((d) => d.results),
    enabled: query.length >= 1,
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  });
}

export function useMarketQuote(symbols: string[]) {
  const key = [...symbols].sort().join(",");
  return useQuery({
    queryKey: ["market", "quote", key],
    queryFn: () =>
      fetchJson<{ quotes: MarketQuote[] }>(
        `/api/v1/market/quote?symbols=${encodeURIComponent(key)}`
      ).then((d) => d.quotes),
    enabled: symbols.length > 0,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}

export function useMarketHistory(symbol: string, range: TimeRange = "1mo") {
  return useQuery({
    queryKey: ["market", "history", symbol, range],
    queryFn: () =>
      fetchJson<{ history: PriceHistoryPoint[] }>(
        `/api/v1/market/history?symbol=${encodeURIComponent(symbol)}&range=${range}`
      ).then((d) => d.history),
    enabled: !!symbol,
    staleTime: 5 * 60_000,
  });
}
