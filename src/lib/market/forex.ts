import { quoteCache, QUOTE_TTL } from "./cache";
import { yahooProvider } from "./providers/yahoo";
import { logger } from "@/lib/logger";

/**
 * Forex conversion utility.
 * Caches exchange rates to minimize API calls.
 */

const FOREX_PAIRS: Record<string, string> = {
  "USD/THB": "THB=X",
  "EUR/THB": "EURTHB=X",
  "GBP/THB": "GBPTHB=X",
  "JPY/THB": "JPYTHB=X",
  "CNY/THB": "CNYTHB=X",
};

/**
 * Approximate fallback rates used ONLY when the live Yahoo fetch fails
 * (cold start, rate limit, transient network error). Better to use a
 * close-but-not-perfect rate than to silently store raw foreign-currency
 * numbers as if they were THB. Refresh these manually every quarter or
 * so to stay in the right ballpark.
 *
 * Last reviewed: 2026-04-29
 */
const FALLBACK_RATES_TO_THB: Record<string, number> = {
  USD: 35,
  EUR: 38,
  GBP: 44,
  JPY: 0.24,
  CNY: 4.9,
};

/**
 * Get exchange rate for a currency pair.
 * Returns the rate (e.g., 1 USD = 34.5 THB → returns 34.5)
 */
export async function getExchangeRate(from: string, to: string): Promise<number | null> {
  if (from === to) return 1;

  const pairKey = `${from}/${to}`;
  const yahooSymbol = FOREX_PAIRS[pairKey];

  if (!yahooSymbol) return null;

  // Check cache first
  const cached = quoteCache.get(`forex:${pairKey}`);
  if (cached) return cached.price;

  try {
    const quotes = await yahooProvider.quote([yahooSymbol]);
    if (quotes.length > 0 && quotes[0].price > 0) {
      quoteCache.set(`forex:${pairKey}`, quotes[0], QUOTE_TTL * 10); // Cache forex for 5 min
      return quotes[0].price;
    }
  } catch (e) {
    logger.warn({ err: e, pair: pairKey }, "forex: yahoo fetch threw");
  }

  // Live fetch failed — fall back to a hardcoded approximation rather
  // than returning null, which previously caused sync to write raw
  // foreign-currency values as if they were THB.
  if (to === "THB") {
    const fallback = FALLBACK_RATES_TO_THB[from];
    if (fallback !== undefined) {
      logger.warn({ pair: pairKey, fallback }, "forex: using FALLBACK rate");
      return fallback;
    }
  }
  // Inverse lookup: THB → foreign
  if (from === "THB") {
    const fallback = FALLBACK_RATES_TO_THB[to];
    if (fallback !== undefined && fallback > 0) {
      logger.warn({ pair: pairKey, fallback: 1 / fallback }, "forex: using inverse FALLBACK rate");
      return 1 / fallback;
    }
  }

  return null;
}

/**
 * Convert an amount from one currency to another.
 */
export async function convertCurrency(
  amount: number,
  from: string,
  to: string
): Promise<{ converted: number; rate: number } | null> {
  const rate = await getExchangeRate(from, to);
  if (rate === null) return null;
  return { converted: amount * rate, rate };
}

/**
 * Get USD/THB rate (most common conversion).
 */
export async function getUsdThbRate(): Promise<number | null> {
  return getExchangeRate("USD", "THB");
}
