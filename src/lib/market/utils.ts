/**
 * Market hours detection for smart polling.
 * Returns whether a given market is currently open.
 */

interface MarketHours {
  open: number; // hour in local timezone (24h)
  close: number;
  timezone: string;
  days: number[]; // 0=Sun, 1=Mon ... 6=Sat
}

const MARKET_SCHEDULES: Record<string, MarketHours> = {
  SET: { open: 10, close: 17, timezone: "Asia/Bangkok", days: [1, 2, 3, 4, 5] },
  US: { open: 9, close: 16, timezone: "America/New_York", days: [1, 2, 3, 4, 5] },
  CRYPTO: { open: 0, close: 24, timezone: "UTC", days: [0, 1, 2, 3, 4, 5, 6] },
};

function getHourInTimezone(timezone: string): { hour: number; day: number } {
  const now = new Date();
  const str = now.toLocaleString("en-US", { timeZone: timezone, hour12: false });
  const date = new Date(str);
  return { hour: date.getHours(), day: date.getDay() };
}

export function isMarketOpen(market: "SET" | "US" | "CRYPTO"): boolean {
  const schedule = MARKET_SCHEDULES[market];
  if (!schedule) return false;

  const { hour, day } = getHourInTimezone(schedule.timezone);
  if (!schedule.days.includes(day)) return false;
  return hour >= schedule.open && hour < schedule.close;
}

/**
 * Returns appropriate polling interval based on market status.
 * - Market open: 30s
 * - Market closed: 5min
 * - Crypto: always 60s
 */
export function getPollingInterval(symbol: string): number {
  if (symbol.includes("-USD") || symbol.includes("-BTC")) {
    // Crypto — always active but less frequent
    return 60_000;
  }

  if (symbol.endsWith(".BK")) {
    return isMarketOpen("SET") ? 30_000 : 5 * 60_000;
  }

  // Default to US market hours
  return isMarketOpen("US") ? 30_000 : 5 * 60_000;
}

// Free tier limits
export const FREE_WATCHLIST_LIMIT = 1;
export const FREE_WATCHLIST_ITEMS_LIMIT = 10;
export const PREMIUM_WATCHLIST_LIMIT = 10;
export const PREMIUM_WATCHLIST_ITEMS_LIMIT = 50;
