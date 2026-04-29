"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { yahooProvider, thaiGoldProvider, isThaiGoldSymbol } from "@/lib/market";
import { getExchangeRate } from "@/lib/market/forex";
import { logAudit } from "@/lib/audit";
import { logger } from "@/lib/logger";

export interface SyncResult {
  synced: number;
  failed: number;
  skipped: number;
}

interface QuoteEntry {
  price: number;
  currency: string;
}

/**
 * Re-prices all auto-update assets for the current user.
 *
 * Multi-currency contract:
 *   - Each asset is tracked in its own `currency` (USD for IBKR, THB for SET, JPY for Nomura, ...).
 *   - `current_price` and `current_value` are stored in that asset's currency.
 *   - Cross-currency aggregation (dashboard totals, P&L) happens at READ time
 *     by converting each asset to the user's home currency on the fly — see
 *     `src/lib/currency/aggregate.ts`.
 *
 * So the only conversion this sync does is when Yahoo returns the quote in
 * a different currency than the asset asks to be tracked in
 * (e.g. asset.currency = "THB" but BTC-USD comes back in USD → convert USD→THB
 * before storing).
 */
export async function syncAssetPrices(): Promise<SyncResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: assets, error } = await supabase
    .from("assets")
    .select("id, symbol, quantity, currency")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .eq("is_auto_update", true)
    .not("symbol", "is", null);

  if (error) throw new Error(error.message);
  if (!assets || assets.length === 0) {
    return { synced: 0, failed: 0, skipped: 0 };
  }

  const symbolsToFetch = Array.from(
    new Set(assets.map((a) => a.symbol!).filter(Boolean))
  );
  if (symbolsToFetch.length === 0) {
    return { synced: 0, failed: 0, skipped: 0 };
  }

  // Fetch quotes (preserve quote currency, not just price).
  // Thai gold synthetic symbols don't exist on Yahoo, so route them to the
  // Thai gold provider separately. All other tickers go to Yahoo in batches.
  const allQuotes = new Map<string, QuoteEntry>();

  const goldSymbols = symbolsToFetch.filter(isThaiGoldSymbol);
  const yahooSymbols = symbolsToFetch.filter((s) => !isThaiGoldSymbol(s));

  if (goldSymbols.length > 0) {
    try {
      const quotes = await thaiGoldProvider.quote(goldSymbols);
      for (const q of quotes) {
        allQuotes.set(q.symbol, {
          price: q.price,
          currency: (q.currency || "THB").toUpperCase(),
        });
      }
    } catch (e) {
      logger.warn({ err: e, goldSymbols }, "sync-prices: thai-gold fetch failed");
    }
  }

  for (let i = 0; i < yahooSymbols.length; i += 20) {
    const batch = yahooSymbols.slice(i, i + 20);
    try {
      const quotes = await yahooProvider.quote(batch);
      for (const q of quotes) {
        allQuotes.set(q.symbol, {
          price: q.price,
          currency: (q.currency || "USD").toUpperCase(),
        });
      }
    } catch (e) {
      logger.warn({ err: e, batch }, "sync-prices: yahoo batch failed");
    }
  }

  // Pre-fetch FX rates for every (quoteCurrency → assetCurrency) pair we need.
  // Most assets won't need conversion at all (their currency == quote currency).
  const fxRates = new Map<string, number>();
  const conversionPairs = new Set<string>();
  for (const asset of assets) {
    const q = allQuotes.get(asset.symbol!);
    if (!q) continue;
    const target = ((asset.currency as string | null) ?? "THB").toUpperCase();
    if (q.currency !== target) {
      conversionPairs.add(`${q.currency}→${target}`);
    }
  }
  for (const pair of Array.from(conversionPairs)) {
    const [from, to] = pair.split("→");
    const rate = await getExchangeRate(from, to);
    if (rate !== null) {
      fxRates.set(pair, rate);
    } else {
      logger.warn({ pair }, "sync-prices: no FX rate available");
    }
  }

  let skipped = 0;

  const payload = assets
    .map((asset) => {
      const q = allQuotes.get(asset.symbol!);
      if (!q) {
        skipped++;
        return null;
      }
      const target = ((asset.currency as string | null) ?? "THB").toUpperCase();
      let priceInTarget = q.price;
      if (q.currency !== target) {
        const rate = fxRates.get(`${q.currency}→${target}`);
        if (rate === undefined) {
          skipped++;
          return null;
        }
        priceInTarget = q.price * rate;
      }
      return {
        id: asset.id,
        price: priceInTarget,
        value: asset.quantity * priceInTarget,
      };
    })
    .filter((p): p is { id: string; price: number; value: number } => p !== null);

  let synced = 0;
  let failed = 0;

  if (payload.length > 0) {
    const { error: batchError } = await supabase.rpc("update_asset_prices_batch", {
      p_user_id: user.id,
      p_payload: payload,
    });

    if (batchError) {
      logger.error(
        { err: batchError, userId: user.id, count: payload.length },
        "sync-prices: batch RPC failed"
      );
      failed = payload.length;
    } else {
      synced = payload.length;
      await logAudit("asset.update", "asset", null, {
        metadata: { source: "sync-prices", synced, skipped },
      });
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/assets");
  return { synced, failed, skipped };
}
