import { schedules, logger } from "@trigger.dev/sdk/v3";
import { serviceClient } from "./_supabase";
import { yahooProvider } from "@/lib/market";
import { getExchangeRate } from "@/lib/market/forex";

interface QuoteEntry {
  price: number;
  currency: string;
}

/**
 * Refresh prices for every auto-update asset across all users.
 * Runs every 30 minutes during market hours (UTC 12:00–22:00 covers TH/US sessions).
 *
 * Yahoo prices come back in the asset's quote currency (USD for AAPL, USD
 * for BTC-USD, JPY for 7203.T, etc.). The portfolio stores `current_value`
 * as THB so totals across mixed-currency holdings make sense — so we pull
 * FX rates once per unique non-THB currency and convert before persisting.
 */
export const syncPricesTask = schedules.task({
  id: "sync-prices",
  cron: "*/30 12-22 * * 1-5", // every 30 min, weekdays, market window UTC
  run: async () => {
    const supabase = serviceClient();

    const { data: assets, error } = await supabase
      .from("assets")
      .select("id, user_id, symbol, quantity")
      .eq("is_auto_update", true)
      .is("deleted_at", null)
      .not("symbol", "is", null);

    if (error) {
      logger.error("Failed to fetch assets", { error });
      throw error;
    }
    if (!assets?.length) {
      logger.info("No auto-update assets to sync");
      return { synced: 0 };
    }

    const symbols = Array.from(new Set(assets.map((a) => a.symbol!).filter(Boolean)));
    const quoteMap = new Map<string, QuoteEntry>();

    for (let i = 0; i < symbols.length; i += 20) {
      const batch = symbols.slice(i, i + 20);
      try {
        const quotes = await yahooProvider.quote(batch);
        for (const q of quotes) {
          quoteMap.set(q.symbol, {
            price: q.price,
            currency: (q.currency || "USD").toUpperCase(),
          });
        }
      } catch (e) {
        logger.warn("Yahoo batch failed", { batch, err: String(e) });
      }
    }

    // Pre-fetch FX rates for every non-THB currency once
    const fxRates = new Map<string, number>([["THB", 1]]);
    const nonThbCurrencies = new Set<string>();
    for (const q of Array.from(quoteMap.values())) {
      if (q.currency !== "THB") nonThbCurrencies.add(q.currency);
    }
    for (const cur of Array.from(nonThbCurrencies)) {
      const rate = await getExchangeRate(cur, "THB");
      if (rate !== null) {
        fxRates.set(cur, rate);
      } else {
        logger.warn("No FX rate, assets in this currency will be skipped", { currency: cur });
      }
    }

    // Group updates by user so we can call the existing batch RPC per user
    const byUser = new Map<string, { id: string; price: number; value: number }[]>();
    let skipped = 0;
    for (const asset of assets) {
      const q = quoteMap.get(asset.symbol!);
      if (!q) {
        skipped++;
        continue;
      }
      const rate = fxRates.get(q.currency);
      if (rate === undefined) {
        skipped++;
        continue;
      }
      const priceThb = q.price * rate;
      const arr = byUser.get(asset.user_id) ?? [];
      arr.push({
        id: asset.id,
        price: priceThb,
        value: asset.quantity * priceThb,
      });
      byUser.set(asset.user_id, arr);
    }

    let synced = 0;
    for (const [userId, payload] of Array.from(byUser.entries())) {
      const { error: rpcError } = await supabase.rpc("update_asset_prices_batch", {
        p_user_id: userId,
        p_payload: payload,
      });
      if (rpcError) {
        logger.warn("Batch update failed", { userId, err: rpcError.message });
      } else {
        synced += payload.length;
      }
    }

    logger.info("Price sync complete", { synced, skipped, assetsTotal: assets.length });
    return { synced, skipped, assetsTotal: assets.length };
  },
});
