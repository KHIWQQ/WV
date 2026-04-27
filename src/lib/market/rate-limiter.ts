import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

/**
 * Postgres-backed rate limiter using Supabase RPC.
 * Tracks requests per key (IP or user ID) within a sliding window.
 */
class RateLimiter {
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /**
   * Check if a request is allowed.
   * Returns { allowed, remaining, resetAt }
   */
  async check(key: string): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    try {
      const supabase = createClient();
      const { data: rl, error } = await supabase.rpc("check_rate_limit", {
        p_key: key,
        p_max_requests: this.maxRequests,
        p_window_seconds: Math.floor(this.windowMs / 1000),
      });

      if (error || !rl) {
        // Fail open if database is down or RPC fails, to prevent
        // taking down the API layer
        logger.error({ err: error, key }, "rate-limiter: rpc failed, failing open");
        return { allowed: true, remaining: this.maxRequests - 1, resetAt: Date.now() + this.windowMs };
      }

      return {
        allowed: rl.allowed as boolean,
        remaining: rl.remaining as number,
        resetAt: rl.resetAt as number,
      };
    } catch (e) {
      logger.error({ err: e, key }, "rate-limiter: exception, failing open");
      return { allowed: true, remaining: this.maxRequests - 1, resetAt: Date.now() + this.windowMs };
    }
  }
}

// Rate limiters for different endpoints
// Search: 30 requests per minute per IP
export const searchLimiter = new RateLimiter(30, 60_000);

// Quote: 60 requests per minute per IP
export const quoteLimiter = new RateLimiter(60, 60_000);

// History: 20 requests per minute per IP
export const historyLimiter = new RateLimiter(20, 60_000);

