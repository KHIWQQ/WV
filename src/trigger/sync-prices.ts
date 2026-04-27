import { schedules, logger } from "@trigger.dev/sdk/v3";
import { serviceClient } from "./_supabase";
import { yahooProvider } from "@/lib/market";

/**
 * Refresh prices for every auto-update asset across all users.
 * Runs every 30 minutes during market hours (UTC 12:00–22:00 covers TH/US sessions).
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
    const priceMap = new Map<string, number>();

    for (let i = 0; i < symbols.length; i += 20) {
      const batch = symbols.slice(i, i + 20);
      try {
        const quotes = await yahooProvider.quote(batch);
        for (const q of quotes) priceMap.set(q.symbol, q.price);
      } catch (e) {
        logger.warn("Yahoo batch failed", { batch, err: String(e) });
      }
    }

    // Group updates by user so we can call the existing batch RPC per user
    const byUser = new Map<string, { id: string; price: number; value: number }[]>();
    for (const asset of assets) {
      const price = priceMap.get(asset.symbol!);
      if (price === undefined) continue;
      const arr = byUser.get(asset.user_id) ?? [];
      arr.push({ id: asset.id, price, value: asset.quantity * price });
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

    logger.info("Price sync complete", { synced, assetsTotal: assets.length });
    return { synced, assetsTotal: assets.length };
  },
});
