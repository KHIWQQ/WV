/**
 * Market API Gateway
 *
 * Central service layer that handles:
 * - Provider routing (Yahoo → CoinGecko fallback for crypto)
 * - In-memory price caching with TTL
 * - Rate limiting per client
 * - Forex conversion (USD→THB)
 * - Unified error handling
 */

import { yahooProvider } from "./providers/yahoo";
import { coingeckoProvider } from "./providers/coingecko";
import { thaiGoldProvider, isThaiGoldSymbol } from "./providers/thai-gold";
import {
  quoteCache, searchCache, historyCache,
  QUOTE_TTL, SEARCH_TTL, HISTORY_TTL,
} from "./cache";
import { searchDbCache } from "./db-cache";
import { searchLimiter, quoteLimiter, historyLimiter } from "./rate-limiter";
import { convertCurrency } from "./forex";
import type {
  MarketQuote,
  MarketSearchResult,
  PriceHistoryPoint,
  TimeRange,
} from "./providers/types";

// ─── Helpers ──────────────────────────────────────────

function isCrypto(symbol: string): boolean {
  return symbol.includes("-USD") || symbol.includes("-BTC") || symbol.includes("-ETH");
}

// Thai gold prices update ~5–10x/day; cache longer than equity quotes
const THAI_GOLD_TTL = 5 * 60_000;

function getClientKey(opts: GatewayOptions): string {
  // Prefer authenticated user ID over IP — protects against
  // shared IP (NAT/VPN) abuse and per-account throttling.
  if (opts.userId) return `u:${opts.userId}`;
  if (opts.clientIp) return `ip:${opts.clientIp}`;
  return "anonymous";
}

// ─── Gateway Interface ────────────────────────────────

export interface GatewayOptions {
  clientIp?: string;
  userId?: string;
  convertToThb?: boolean;
}

export interface GatewayResult<T> {
  data: T;
  cached: boolean;
  provider: string;
}

export interface RateLimitError {
  error: string;
  retryAfter: number;
}

// ─── Gateway Methods ──────────────────────────────────

export async function gatewaySearch(
  query: string,
  opts: GatewayOptions = {}
): Promise<GatewayResult<MarketSearchResult[]> | RateLimitError> {
  const key = getClientKey(opts);
  const rl = await searchLimiter.check(`search:${key}`);
  if (!rl.allowed) {
    return { error: "Rate limit exceeded", retryAfter: Math.ceil((rl.resetAt - Date.now()) / 1000) };
  }

  // L1: in-memory cache
  const cacheKey = query.toLowerCase();
  const memoryCached = searchCache.get(`search:${cacheKey}`);
  if (memoryCached) {
    return { data: memoryCached, cached: true, provider: "memory" };
  }

  // Thai gold synthetic results — prepend to whatever Yahoo returns so users
  // searching "ทอง" or "gold" see the 4 retail Thai gold options at the top
  // (Yahoo doesn't index goldtraders.or.th).
  const goldResults = await thaiGoldProvider.search(query);

  // L2: DB cache
  const dbCached = await searchDbCache.get(cacheKey);
  if (dbCached) {
    const results = dbCached as unknown as MarketSearchResult[];
    const merged = [...goldResults, ...results];
    searchCache.set(`search:${cacheKey}`, merged, SEARCH_TTL);
    return { data: merged, cached: true, provider: "db-cache" };
  }

  // L3: External API — Yahoo first, then CoinGecko
  let results: MarketSearchResult[] = [];
  let provider = "yahoo";

  try {
    results = await yahooProvider.search(query);
  } catch {
    try {
      results = await coingeckoProvider.search(query);
      provider = "coingecko";
    } catch {
      // External lookups failed; return whatever we have (gold may still be present)
      if (goldResults.length > 0) {
        return { data: goldResults, cached: false, provider: "thai-gold" };
      }
      return { data: [], cached: false, provider: "none" };
    }
  }

  // Write back to both caches (gold prepended)
  const merged = [...goldResults, ...results];
  searchCache.set(`search:${cacheKey}`, merged, SEARCH_TTL);
  await searchDbCache.set(cacheKey, results as unknown as Record<string, unknown>[], provider);
  return { data: merged, cached: false, provider };
}

export async function gatewayQuote(
  symbols: string[],
  opts: GatewayOptions = {}
): Promise<GatewayResult<MarketQuote[]> | RateLimitError> {
  const key = getClientKey(opts);
  const rl = await quoteLimiter.check(`quote:${key}`);
  if (!rl.allowed) {
    return { error: "Rate limit exceeded", retryAfter: Math.ceil((rl.resetAt - Date.now()) / 1000) };
  }

  const quotes: MarketQuote[] = [];
  const uncachedSymbols: string[] = [];
  const uncachedCrypto: string[] = [];
  const uncachedGold: string[] = [];

  // Check cache first for each symbol
  for (const symbol of symbols) {
    const cached = quoteCache.get(`quote:${symbol}`);
    if (cached) {
      quotes.push(cached);
    } else if (isThaiGoldSymbol(symbol)) {
      uncachedGold.push(symbol);
    } else if (isCrypto(symbol)) {
      uncachedCrypto.push(symbol);
    } else {
      uncachedSymbols.push(symbol);
    }
  }

  // Fetch Thai gold prices (one upstream call covers all 4 synthetic symbols)
  if (uncachedGold.length > 0) {
    try {
      const goldQuotes = await thaiGoldProvider.quote(uncachedGold);
      for (const q of goldQuotes) {
        quoteCache.set(`quote:${q.symbol}`, q, THAI_GOLD_TTL);
        quotes.push(q);
      }
    } catch {
      // Provider always returns a value (fallback inside) but be defensive
    }
  }

  // Fetch uncached regular symbols from Yahoo
  if (uncachedSymbols.length > 0) {
    try {
      const yahooQuotes = await yahooProvider.quote(uncachedSymbols);
      for (const q of yahooQuotes) {
        quoteCache.set(`quote:${q.symbol}`, q, QUOTE_TTL);
        quotes.push(q);
      }
    } catch {
      // Yahoo failed — skip
    }
  }

  // Fetch uncached crypto: try CoinGecko first, fallback to Yahoo
  if (uncachedCrypto.length > 0) {
    let cryptoQuotes: MarketQuote[] = [];

    try {
      cryptoQuotes = await coingeckoProvider.quote(uncachedCrypto);
    } catch {
      // CoinGecko failed, try Yahoo for crypto
      try {
        cryptoQuotes = await yahooProvider.quote(uncachedCrypto);
      } catch {
        // Both failed
      }
    }

    for (const q of cryptoQuotes) {
      quoteCache.set(`quote:${q.symbol}`, q, QUOTE_TTL);
      quotes.push(q);
    }
  }

  // Optionally convert USD quotes to THB (create new objects to avoid mutating cache)
  const finalQuotes = opts.convertToThb
    ? await Promise.all(
        quotes.map(async (q) => {
          if (q.currency === "USD") {
            const result = await convertCurrency(q.price, "USD", "THB");
            if (result) {
              return {
                ...q,
                price: result.converted,
                change: q.change * result.rate,
                currency: "THB" as const,
              };
            }
          }
          return q;
        })
      )
    : quotes;

  const allCached =
    uncachedSymbols.length === 0 &&
    uncachedCrypto.length === 0 &&
    uncachedGold.length === 0;
  return { data: finalQuotes, cached: allCached, provider: allCached ? "cache" : "mixed" };
}

export async function gatewayHistory(
  symbol: string,
  range: TimeRange,
  opts: GatewayOptions = {}
): Promise<GatewayResult<PriceHistoryPoint[]> | RateLimitError> {
  const key = getClientKey(opts);
  const rl = await historyLimiter.check(`history:${key}`);
  if (!rl.allowed) {
    return { error: "Rate limit exceeded", retryAfter: Math.ceil((rl.resetAt - Date.now()) / 1000) };
  }

  // Check cache
  const cacheKey = `history:${symbol}:${range}`;
  const cached = historyCache.get(cacheKey);
  if (cached) {
    return { data: cached, cached: true, provider: "cache" };
  }

  let history: PriceHistoryPoint[] = [];
  let provider = "yahoo";

  // For crypto, try CoinGecko first
  if (isCrypto(symbol)) {
    try {
      history = await coingeckoProvider.history(symbol, range);
      provider = "coingecko";
    } catch {
      // Fallback to Yahoo
      try {
        history = await yahooProvider.history(symbol, range);
        provider = "yahoo";
      } catch {
        return { data: [], cached: false, provider: "none" };
      }
    }
  } else {
    try {
      history = await yahooProvider.history(symbol, range);
    } catch {
      return { data: [], cached: false, provider: "none" };
    }
  }

  historyCache.set(cacheKey, history, HISTORY_TTL);
  return { data: history, cached: false, provider };
}

// ─── Rate Limit Helper for API Routes ─────────────────

export function isRateLimitError(result: unknown): result is RateLimitError {
  return !!result && typeof (result as RateLimitError).error === "string" && typeof (result as RateLimitError).retryAfter === "number";
}
