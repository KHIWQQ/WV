"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { yahooProvider } from "@/lib/market";
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
 * IMPORTANT: Yahoo returns prices in the asset's quote currency
 * (USD for AAPL, USD for BTC-USD, JPY for 7203.T, etc.). The portfolio
 * stores `current_value` as THB so that totals across mixed-currency
 * holdings make sense. We therefore convert every non-THB quote to THB
 * before persisting.
 */
export async function syncAssetPrices(): Promise<SyncResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: assets, error } = await supabase
    .from("assets")
    .select("id, symbol, quantity")
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

  // Fetch quotes (preserve quote currency, not just price)
  const allQuotes = new Map<string, QuoteEntry>();
  for (let i = 0; i < symbolsToFetch.length; i += 20) {
    const batch = symbolsToFetch.slice(i, i + 20);
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

  // Pre-fetch FX rates for every non-THB currency we saw, so the per-asset
  // loop below can be sync.
  const fxRates = new Map<string, number>([["THB", 1]]);
  const nonThbCurrencies = new Set<string>();
  for (const q of Array.from(allQuotes.values())) {
    if (q.currency !== "THB") nonThbCurrencies.add(q.currency);
  }
  for (const cur of Array.from(nonThbCurrencies)) {
    const rate = await getExchangeRate(cur, "THB");
    if (rate !== null) {
      fxRates.set(cur, rate);
    } else {
      logger.warn(
        { currency: cur },
        "sync-prices: no FX rate available — assets in this currency will be skipped"
      );
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
      const rate = fxRates.get(q.currency);
      if (rate === undefined) {
        // We logged the missing-rate currency above; count as skipped.
        skipped++;
        return null;
      }
      const priceThb = q.price * rate;
      return {
        id: asset.id,
        price: priceThb,
        value: asset.quantity * priceThb,
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
