/**
 * Market module — public API.
 * All external access should go through the gateway.
 */

// Re-export types
export type {
  MarketQuote,
  MarketSearchResult,
  PriceHistoryPoint,
  AssetType,
  TimeRange,
} from "./providers/types";

// Gateway (main entry point for API routes)
export {
  gatewaySearch,
  gatewayQuote,
  gatewayHistory,
  isRateLimitError,
  type GatewayOptions,
  type GatewayResult,
  type RateLimitError,
} from "./gateway";

// Forex utilities
export { getExchangeRate, convertCurrency, getUsdThbRate } from "./forex";

// Direct provider access (for sync-prices server action)
export { yahooProvider } from "./providers/yahoo";
export { coingeckoProvider } from "./providers/coingecko";
export {
  thaiGoldProvider,
  isThaiGoldSymbol,
  THAI_GOLD_SYMBOLS,
  getThaiGoldPrices,
} from "./providers/thai-gold";
export type { ThaiGoldSymbol } from "./providers/thai-gold";

// Utils
export { getPollingInterval, isMarketOpen } from "./utils";
