import { quoteCache, QUOTE_TTL } from "./cache";
import { yahooProvider } from "./providers/yahoo";

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
  } catch {
    // fallback
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
