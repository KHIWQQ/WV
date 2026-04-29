/**
 * Thai gold price provider.
 *
 * Source of truth: Gold Traders Association of Thailand (goldtraders.or.th).
 * The association publishes 96.5% gold prices ~5–10 times per business day
 * in THB per "บาททอง" (1 บาท ≈ 15.244 g). These are the prices retail Thai
 * gold shops quote — distinct from international spot (USD/troy oz).
 *
 * We expose four synthetic symbols (no real ticker exists for these):
 *   XAUTH-BAR-BUY   ทองคำแท่ง 96.5% ราคารับซื้อ (shop buys back from you)
 *   XAUTH-BAR-SELL  ทองคำแท่ง 96.5% ราคาขาย    (shop sells to you)
 *   XAUTH-ORN-BUY   ทองรูปพรรณ 96.5% ราคารับซื้อ
 *   XAUTH-ORN-SELL  ทองรูปพรรณ 96.5% ราคาขาย
 *
 * Quote unit: THB per บาททอง — so a holding of "5 บาททอง" stored as
 * quantity=5 × price=ราคาขาย gives total value in THB directly. No weight
 * conversion needed downstream.
 *
 * Fetch strategy (in order):
 *   1. api.chnwt.dev/thai-gold-api/latest — third-party JSON wrapper that
 *      scrapes the same source. Stable, 1 request returns all 4 prices.
 *   2. goldtraders.or.th HTML scrape — direct, but format may shift.
 *   3. Hardcoded fallback (refresh quarterly) — last resort so cold-start
 *      or upstream outages don't write null prices.
 */

import type {
  MarketProvider,
  MarketQuote,
  MarketSearchResult,
  PriceHistoryPoint,
} from "./types";
import { logger } from "@/lib/logger";

export const THAI_GOLD_SYMBOLS = {
  "XAUTH-BAR-BUY": "ทองคำแท่ง 96.5% ราคารับซื้อ",
  "XAUTH-BAR-SELL": "ทองคำแท่ง 96.5% ราคาขาย",
  "XAUTH-ORN-BUY": "ทองรูปพรรณ 96.5% ราคารับซื้อ",
  "XAUTH-ORN-SELL": "ทองรูปพรรณ 96.5% ราคาขาย",
} as const;

export type ThaiGoldSymbol = keyof typeof THAI_GOLD_SYMBOLS;

const VALID_SYMBOLS = new Set<string>(Object.keys(THAI_GOLD_SYMBOLS));

export function isThaiGoldSymbol(symbol: string): boolean {
  return VALID_SYMBOLS.has(symbol.toUpperCase());
}

interface ThaiGoldPrices {
  barBuy: number;
  barSell: number;
  ornamentBuy: number;
  ornamentSell: number;
  source: "chnwt" | "goldtraders" | "fallback";
  fetchedAt: string;
}

/**
 * Fallback prices — used only when both upstream sources fail.
 * Refresh manually each quarter from goldtraders.or.th.
 *
 * Last reviewed: 2026-04-29
 */
const FALLBACK_PRICES: Omit<ThaiGoldPrices, "source" | "fetchedAt"> = {
  barBuy: 51500,
  barSell: 51600,
  ornamentBuy: 50580,
  ornamentSell: 52400,
};

interface ChnwtResponse {
  status?: string;
  response?: {
    date?: string;
    buy?: string | number;
    sell?: string | number;
    OrnamentBuy?: string | number;
    OrnamentSell?: string | number;
  };
}

function parseNumber(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const cleaned = v.replace(/,/g, "").trim();
    const n = parseFloat(cleaned);
    if (Number.isFinite(n)) return n;
  }
  return NaN;
}

async function fetchFromChnwt(signal?: AbortSignal): Promise<ThaiGoldPrices | null> {
  try {
    const res = await fetch("https://api.chnwt.dev/thai-gold-api/latest", {
      signal,
      // Treat as fresh data; cache layer above handles TTL
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as ChnwtResponse;
    const r = json.response;
    if (!r) return null;
    const barBuy = parseNumber(r.buy);
    const barSell = parseNumber(r.sell);
    const ornamentBuy = parseNumber(r.OrnamentBuy);
    const ornamentSell = parseNumber(r.OrnamentSell);
    if (![barBuy, barSell, ornamentBuy, ornamentSell].every((n) => n > 0)) {
      return null;
    }
    return {
      barBuy,
      barSell,
      ornamentBuy,
      ornamentSell,
      source: "chnwt",
      fetchedAt: new Date().toISOString(),
    };
  } catch (e) {
    logger.warn({ err: e }, "thai-gold: chnwt fetch failed");
    return null;
  }
}

/**
 * Direct scrape of goldtraders.or.th — used when the JSON wrapper is down.
 *
 * The page renders 96.5% bar prices in cells with id="DetailPlace_uc_goldprices1_lblBLBuy"
 * and similar predictable IDs. We pull all four with one regex pass.
 */
async function fetchFromGoldtraders(signal?: AbortSignal): Promise<ThaiGoldPrices | null> {
  try {
    const res = await fetch("https://www.goldtraders.or.th/UpdatePriceList.aspx", {
      signal,
      cache: "no-store",
      headers: { "User-Agent": "Mozilla/5.0 wealthview-th/1.0" },
    });
    if (!res.ok) return null;
    const html = await res.text();

    const pick = (idSuffix: string): number => {
      // Match: id="..._lblXXX">12,345.67<
      const re = new RegExp(
        `id="[^"]*${idSuffix}"[^>]*>\\s*([\\d,\\.]+)\\s*<`,
        "i"
      );
      const m = html.match(re);
      return m ? parseNumber(m[1]) : NaN;
    };

    const barBuy = pick("lblBLBuy");
    const barSell = pick("lblBLSell");
    const ornamentBuy = pick("lblOMBuy");
    const ornamentSell = pick("lblOSSell");
    if (![barBuy, barSell, ornamentBuy, ornamentSell].every((n) => n > 0)) {
      return null;
    }
    return {
      barBuy,
      barSell,
      ornamentBuy,
      ornamentSell,
      source: "goldtraders",
      fetchedAt: new Date().toISOString(),
    };
  } catch (e) {
    logger.warn({ err: e }, "thai-gold: goldtraders scrape failed");
    return null;
  }
}

let memoryCache: { data: ThaiGoldPrices; expiresAt: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 min — gold updates ~5–10x/day

/**
 * Get current Thai gold prices, with a 5-minute in-memory cache.
 * Tries chnwt → goldtraders → hardcoded fallback. Always returns a value.
 */
export async function getThaiGoldPrices(): Promise<ThaiGoldPrices> {
  const now = Date.now();
  if (memoryCache && now < memoryCache.expiresAt) {
    return memoryCache.data;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const fromChnwt = await fetchFromChnwt(controller.signal);
    if (fromChnwt) {
      memoryCache = { data: fromChnwt, expiresAt: now + CACHE_TTL };
      return fromChnwt;
    }
    const fromGoldtraders = await fetchFromGoldtraders(controller.signal);
    if (fromGoldtraders) {
      memoryCache = { data: fromGoldtraders, expiresAt: now + CACHE_TTL };
      return fromGoldtraders;
    }
  } finally {
    clearTimeout(timeout);
  }

  logger.warn("thai-gold: all upstream sources failed — using FALLBACK prices");
  const fallback: ThaiGoldPrices = {
    ...FALLBACK_PRICES,
    source: "fallback",
    fetchedAt: new Date().toISOString(),
  };
  // Cache fallback for a shorter window so we retry sooner
  memoryCache = { data: fallback, expiresAt: now + 60_000 };
  return fallback;
}

function priceFor(symbol: ThaiGoldSymbol, p: ThaiGoldPrices): number {
  switch (symbol) {
    case "XAUTH-BAR-BUY": return p.barBuy;
    case "XAUTH-BAR-SELL": return p.barSell;
    case "XAUTH-ORN-BUY": return p.ornamentBuy;
    case "XAUTH-ORN-SELL": return p.ornamentSell;
  }
}

function toQuote(symbol: ThaiGoldSymbol, p: ThaiGoldPrices): MarketQuote {
  const price = priceFor(symbol, p);
  return {
    symbol,
    shortName: THAI_GOLD_SYMBOLS[symbol],
    longName: `${THAI_GOLD_SYMBOLS[symbol]} (THB / บาททอง)`,
    price,
    change: 0,
    changePercent: 0,
    currency: "THB",
    exchange: "Goldtraders TH",
    assetType: "commodity",
    fetchedAt: p.fetchedAt,
  };
}

const SEARCH_KEYWORDS = ["ทอง", "ทองคำ", "gold", "xauth", "xau", "96.5"];

function matchesGoldQuery(query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return false;
  return SEARCH_KEYWORDS.some((kw) => q.includes(kw));
}

export const thaiGoldProvider: MarketProvider = {
  async search(query: string): Promise<MarketSearchResult[]> {
    if (!matchesGoldQuery(query)) return [];
    return (Object.keys(THAI_GOLD_SYMBOLS) as ThaiGoldSymbol[]).map((sym) => ({
      symbol: sym,
      shortName: THAI_GOLD_SYMBOLS[sym],
      longName: `${THAI_GOLD_SYMBOLS[sym]} (THB / บาททอง)`,
      exchange: "Goldtraders TH",
      assetType: "commodity",
    }));
  },

  async quote(symbols: string[]): Promise<MarketQuote[]> {
    const valid = symbols
      .map((s) => s.toUpperCase())
      .filter((s): s is ThaiGoldSymbol => isThaiGoldSymbol(s)) as ThaiGoldSymbol[];
    if (valid.length === 0) return [];
    const prices = await getThaiGoldPrices();
    return valid.map((s) => toQuote(s, prices));
  },

  async history(): Promise<PriceHistoryPoint[]> {
    // No historical series available from upstream; return empty so callers
    // can still render charts gracefully (other providers may fill the gap
    // later, e.g. by snapshotting daily prices into a Supabase table).
    return [];
  },
};

// Test-only helper to reset the in-process cache between unit tests.
export function _resetThaiGoldCacheForTests(): void {
  memoryCache = null;
}
