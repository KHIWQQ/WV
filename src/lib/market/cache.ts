import type { MarketQuote, MarketSearchResult, PriceHistoryPoint } from "./providers/types";

/**
 * In-memory price cache with TTL.
 * Reduces external API calls by caching quotes.
 * In production, this can be backed by Supabase price_cache table or Redis.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const DEFAULT_MAX_SIZE = 1000;

class MemoryCache<T> {
  private store = new Map<string, CacheEntry<T>>();
  private maxSize: number;

  constructor(maxSize = DEFAULT_MAX_SIZE) {
    this.maxSize = maxSize;
  }

  get(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.data;
  }

  set(key: string, data: T, ttlMs: number): void {
    // Evict expired entries and enforce max size
    if (this.store.size >= this.maxSize) {
      this.evict();
    }
    this.store.set(key, { data, expiresAt: Date.now() + ttlMs });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  get size(): number {
    return this.store.size;
  }

  private evict(): void {
    const now = Date.now();
    // First pass: remove expired entries
    this.store.forEach((entry, key) => {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    });
    // If still over limit, remove oldest entries (by insertion order)
    if (this.store.size >= this.maxSize) {
      const toRemove = Math.floor(this.maxSize / 4);
      let removed = 0;
      const keys = Array.from(this.store.keys());
      for (let i = 0; i < keys.length && removed < toRemove; i++) {
        this.store.delete(keys[i]);
        removed++;
      }
    }
  }
}

// Separate caches for different data types
export const quoteCache = new MemoryCache<MarketQuote>();
export const searchCache = new MemoryCache<MarketSearchResult[]>();
export const historyCache = new MemoryCache<PriceHistoryPoint[]>();

// TTL constants
export const QUOTE_TTL = 30_000;        // 30 seconds
export const SEARCH_TTL = 5 * 60_000;   // 5 minutes
export const HISTORY_TTL = 10 * 60_000;  // 10 minutes
