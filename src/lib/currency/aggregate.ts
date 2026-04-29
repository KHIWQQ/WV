import { getExchangeRate } from "@/lib/market/forex";
import { logger } from "@/lib/logger";

export const HOME_CURRENCY = "THB" as const;

export interface AmountInCurrency {
  value: number;
  currency: string;
}

/**
 * Pre-fetch FX rates for every unique non-home currency in a list of items.
 * Returns a map of currency → rate (1 unit of source = X units of home).
 *
 * Use this once at the start of an aggregation pass to avoid N round-trips
 * to the forex layer. The map always contains an entry for HOME_CURRENCY = 1.
 */
export async function prefetchFxRates(
  items: { currency?: string | null }[],
  homeCurrency: string = HOME_CURRENCY
): Promise<Map<string, number>> {
  const home = homeCurrency.toUpperCase();
  const rates = new Map<string, number>([[home, 1]]);

  const uniqueCurrencies = new Set<string>();
  for (const item of items) {
    const cur = (item.currency ?? home).toUpperCase();
    if (cur !== home) uniqueCurrencies.add(cur);
  }

  await Promise.all(
    Array.from(uniqueCurrencies).map(async (cur) => {
      const rate = await getExchangeRate(cur, home);
      if (rate !== null) {
        rates.set(cur, rate);
      } else {
        logger.warn(
          { currency: cur, home },
          "fx-aggregate: no rate available — items in this currency will fall back to 1:1"
        );
      }
    })
  );

  return rates;
}

/**
 * Convert one amount to home currency using a pre-fetched rate map.
 * Falls back to 1:1 if the rate is unavailable (logged in prefetch).
 */
export function convertToHome(
  amount: number,
  fromCurrency: string | null | undefined,
  rates: Map<string, number>,
  homeCurrency: string = HOME_CURRENCY
): number {
  const from = (fromCurrency ?? homeCurrency).toUpperCase();
  const rate = rates.get(from) ?? 1;
  return amount * rate;
}

/**
 * Sum a numeric field of items, converting each to home currency.
 */
export function sumInHome<T extends { currency?: string | null }>(
  items: T[],
  pickValue: (item: T) => number,
  rates: Map<string, number>,
  homeCurrency: string = HOME_CURRENCY
): number {
  let total = 0;
  for (const item of items) {
    total += convertToHome(pickValue(item), item.currency, rates, homeCurrency);
  }
  return total;
}

/**
 * Group items by currency. Useful for "per-currency P&L" displays.
 * Currency codes are normalized to uppercase; missing → home.
 */
export function groupByCurrency<T extends { currency?: string | null }>(
  items: T[],
  homeCurrency: string = HOME_CURRENCY
): Map<string, T[]> {
  const home = homeCurrency.toUpperCase();
  const m = new Map<string, T[]>();
  for (const item of items) {
    const k = (item.currency ?? home).toUpperCase();
    const arr = m.get(k) ?? [];
    arr.push(item);
    m.set(k, arr);
  }
  return m;
}
