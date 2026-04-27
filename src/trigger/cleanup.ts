import { schedules, logger } from "@trigger.dev/sdk/v3";
import { serviceClient } from "./_supabase";

/**
 * Daily housekeeping job. Runs every day at 03:15 Asia/Bangkok (20:15 UTC prev day).
 * Cleans expired cache rows, prunes old price ticks, purges soft-deleted records
 * past their grace period, and trims the audit log.
 */
export const cleanupTask = schedules.task({
  id: "cleanup-daily",
  cron: "15 20 * * *", // 03:15 ICT
  run: async () => {
    const supabase = serviceClient();

    const [marketCache, rateLimits, priceHistory, audit, purged] = await Promise.all([
      supabase.rpc("cleanup_market_cache"),
      supabase.rpc("cleanup_rate_limits"),
      supabase.rpc("cleanup_price_history"),
      supabase.rpc("cleanup_audit_log"),
      supabase.rpc("purge_soft_deleted"),
    ]);

    const result = {
      marketCacheRemoved: marketCache.data ?? 0,
      rateLimitsRemoved: rateLimits.data ?? 0,
      priceHistoryRemoved: priceHistory.data ?? 0,
      auditLogRemoved: audit.data ?? 0,
      softDeletesPurged: purged.data ?? null,
    };

    logger.info("Cleanup complete", result);
    return result;
  },
});

/**
 * Hourly cleanup for the in-memory caches that may grow inside long-running edge runtimes.
 * Lighter than the daily job — only touches the volatile cache table.
 */
export const cacheRefreshTask = schedules.task({
  id: "cache-refresh-hourly",
  cron: "5 * * * *", // 5 minutes past every hour
  run: async () => {
    const supabase = serviceClient();
    const { data, error } = await supabase.rpc("cleanup_market_cache");
    if (error) {
      logger.warn("cleanup_market_cache failed", { err: error.message });
      throw error;
    }
    logger.info("Hourly cache cleanup", { removed: data ?? 0 });
    return { removed: data ?? 0 };
  },
});
