/**
 * Database-backed cache using Supabase.
 *
 * Replaces in-memory cache so data persists across restarts
 * and is shared across all server instances.
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function getSupabase() {
  const cookieStore = cookies() as ReturnType<typeof cookies> & {
    getAll: () => { name: string; value: string }[];
    set: (name: string, value: string, options?: Record<string, unknown>) => void;
  };

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore in Server Components
          }
        },
      },
    }
  );
}

export class DbCache<T> {
  private prefix: string;
  private ttlSeconds: number;

  constructor(prefix: string, ttlSeconds: number) {
    this.prefix = prefix;
    this.ttlSeconds = ttlSeconds;
  }

  async get(key: string): Promise<T | null> {
    try {
      const supabase = getSupabase();
      const cacheKey = `${this.prefix}:${key}`;

      const { data, error } = await supabase.rpc("get_market_cache", {
        p_key: cacheKey,
      });

      if (error || !data) return null;
      return data as T;
    } catch {
      return null;
    }
  }

  async set(key: string, value: T, provider: string): Promise<void> {
    try {
      const supabase = getSupabase();
      const cacheKey = `${this.prefix}:${key}`;

      await supabase.rpc("set_market_cache", {
        p_key: cacheKey,
        p_data: value as unknown as Record<string, unknown>,
        p_provider: provider,
        p_ttl_seconds: this.ttlSeconds,
      });
    } catch {
      // Cache write failure is non-critical — log but don't throw
      console.warn(`[db-cache] Failed to write key: ${this.prefix}:${key}`);
    }
  }
}

// TTL constants (in seconds)
export const QUOTE_TTL = 60;         // 1 minute
export const SEARCH_TTL = 30 * 60;   // 30 minutes
export const HISTORY_TTL = 60 * 60;  // 1 hour

// Cache instances
export const quoteDbCache = new DbCache<Record<string, unknown>>("quote", QUOTE_TTL);
export const searchDbCache = new DbCache<Record<string, unknown>[]>("search", SEARCH_TTL);
export const historyDbCache = new DbCache<Record<string, unknown>[]>("history", HISTORY_TTL);
