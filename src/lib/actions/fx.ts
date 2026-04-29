"use server";

import { getExchangeRate } from "@/lib/market/forex";
import { logger } from "@/lib/logger";
import { HOME_CURRENCY } from "@/lib/currency/aggregate";

/**
 * Returns a map of currency code → rate-to-home (THB).
 * Missing rates are simply omitted; callers should fall back to 1:1.
 *
 * Cheap to call repeatedly — the underlying forex.ts caches rates for
 * 5 minutes via the in-memory market cache.
 */
export async function getFxRates(
  currencies: string[]
): Promise<Record<string, number>> {
  const home = HOME_CURRENCY;
  const unique = Array.from(
    new Set(currencies.map((c) => (c || home).toUpperCase()))
  );

  const result: Record<string, number> = { [home]: 1 };

  await Promise.all(
    unique.map(async (cur) => {
      if (cur === home) return;
      const rate = await getExchangeRate(cur, home);
      if (rate !== null) {
        result[cur] = rate;
      } else {
        logger.warn({ currency: cur }, "fx-action: no rate available");
      }
    })
  );

  return result;
}
