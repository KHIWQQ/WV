import { schedules, logger } from "@trigger.dev/sdk/v3";
import { serviceClient } from "./_supabase";
import { yahooProvider, thaiGoldProvider, isThaiGoldSymbol } from "@/lib/market";
import { getExchangeRate } from "@/lib/market/forex";

interface QuoteEntry {
  price: number;
  currency: string;
}

/**
 * Refresh prices for every auto-update asset across all users.
 * Runs every 30 minutes during market hours (UTC 12:00–22:00 covers TH/US sessions).
 *
 * Multi-currency: Each asset is tracked in its own `currency`. We only
 * convert when Yahoo's quote currency differs from the asset's tracked
 * currency (e.g. asset.currency=THB but BTC-USD quote=USD → USD→THB).
 * Cross-currency portfolio totals happen at READ time on the dashboard.
 */
export const syncPricesTask = schedules.task({
  id: "sync-prices",
  cron: "*/30 12-22 * * 1-5", // every 30 min, weekdays, market window UTC
  run: async () => {
    const supabase = serviceClient();

    const { data: assets, error } = await supabase
      .from("assets")
      .select("id, user_id, symbol, quantity, currency")
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

    // Thai gold synthetic symbols don't exist on Yahoo — split off and
    // route to the dedicated provider (one upstream call covers all 4).
    const goldSymbols = symbols.filter(isThaiGoldSymbol);
    const yahooSymbols = symbols.filter((s) => !isThaiGoldSymbol(s));

    if (goldSymbols.length > 0) {
      try {
        const quotes = await thaiGoldProvider.quote(goldSymbols);
        for (const q of quotes) {
          quoteMap.set(q.symbol, {
            price: q.price,
            currency: (q.currency || "THB").toUpperCase(),
          });
        }
      } catch (e) {
        logger.warn("Thai gold fetch failed", { goldSymbols, err: String(e) });
      }
    }

    for (let i = 0; i < yahooSymbols.length; i += 20) {
      const batch = yahooSymbols.slice(i, i + 20);
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

    // Pre-fetch FX rates for every (quote currency → asset currency) pair
    const fxRates = new Map<string, number>();
    const pairs = new Set<string>();
    for (const asset of assets) {
      const q = quoteMap.get(asset.symbol!);
      if (!q) continue;
      const target = ((asset.currency as string | null) ?? "THB").toUpperCase();
      if (q.currency !== target) pairs.add(`${q.currency}→${target}`);
    }
    for (const pair of Array.from(pairs)) {
      const [from, to] = pair.split("→");
      const rate = await getExchangeRate(from, to);
      if (rate !== null) fxRates.set(pair, rate);
      else logger.warn("No FX rate", { pair });
    }

    // Group updates by user
    const byUser = new Map<string, { id: string; price: number; value: number }[]>();
    let skipped = 0;
    for (const asset of assets) {
      const q = quoteMap.get(asset.symbol!);
      if (!q) {
        skipped++;
        continue;
      }
      const target = ((asset.currency as string | null) ?? "THB").toUpperCase();
      let priceInTarget = q.price;
      if (q.currency !== target) {
        const rate = fxRates.get(`${q.currency}→${target}`);
        if (rate === undefined) {
          skipped++;
          continue;
        }
        priceInTarget = q.price * rate;
      }
      const arr = byUser.get(asset.user_id) ?? [];
      arr.push({
        id: asset.id,
        price: priceInTarget,
        value: asset.quantity * priceInTarget,
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
