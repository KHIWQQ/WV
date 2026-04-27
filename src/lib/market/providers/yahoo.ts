import YahooFinance from "yahoo-finance2";
import type {
  MarketProvider,
  MarketQuote,
  MarketSearchResult,
  PriceHistoryPoint,
  AssetType,
  TimeRange,
} from "./types";

function mapQuoteType(quoteType?: string): AssetType {
  switch (quoteType?.toUpperCase()) {
    case "EQUITY":
      return "stock";
    case "CRYPTOCURRENCY":
      return "crypto";
    case "CURRENCY":
      return "forex";
    case "FUTURE":
    case "COMMODITY":
      return "commodity";
    case "INDEX":
      return "index";
    case "ETF":
      return "etf";
    case "MUTUALFUND":
      return "mutualfund";
    default:
      return "unknown";
  }
}

function mapRange(range: TimeRange): { period1: string; interval: "1d" | "1wk" | "1mo" } {
  const now = new Date();
  let period1: Date;
  let interval: "1d" | "1wk" | "1mo" = "1d";

  switch (range) {
    case "1d":
      period1 = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
      break;
    case "5d":
      period1 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "1mo":
      period1 = new Date(now);
      period1.setMonth(period1.getMonth() - 1);
      break;
    case "3mo":
      period1 = new Date(now);
      period1.setMonth(period1.getMonth() - 3);
      break;
    case "6mo":
      period1 = new Date(now);
      period1.setMonth(period1.getMonth() - 6);
      break;
    case "1y":
      period1 = new Date(now);
      period1.setFullYear(period1.getFullYear() - 1);
      break;
    case "5y":
      period1 = new Date(now);
      period1.setFullYear(period1.getFullYear() - 5);
      interval = "1wk";
      break;
    case "max":
      period1 = new Date("1970-01-01");
      interval = "1mo";
      break;
    default:
      period1 = new Date(now);
      period1.setMonth(period1.getMonth() - 1);
  }

  return { period1: period1.toISOString().split("T")[0], interval };
}

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

export const yahooProvider: MarketProvider = {
  async search(query: string): Promise<MarketSearchResult[]> {
    const result = await yf.search(query, { newsCount: 0 });
    return (result.quotes ?? [])
      .filter((q: Record<string, unknown>) => q.symbol)
      .slice(0, 15)
      .map((q: Record<string, unknown>) => ({
        symbol: q.symbol as string,
        shortName: (q.shortname as string) || (q.symbol as string),
        longName: q.longname as string,
        exchange: (q.exchDisp as string) || (q.exchange as string) || "",
        assetType: mapQuoteType(q.quoteType as string),
      }));
  },

  async quote(symbols: string[]): Promise<MarketQuote[]> {
    // Fetch all symbols in parallel instead of sequentially
    const results = await Promise.allSettled(
      symbols.map((symbol) => yf.quote(symbol))
    );

    const quotes: MarketQuote[] = [];
    for (const result of results) {
      if (result.status !== "fulfilled" || !result.value) continue;
      const q = result.value;
      quotes.push({
        symbol: q.symbol,
        shortName: (q as Record<string, unknown>).shortName as string || q.symbol,
        longName: (q as Record<string, unknown>).longName as string,
        price: q.regularMarketPrice ?? 0,
        change: q.regularMarketChange ?? 0,
        changePercent: q.regularMarketChangePercent ?? 0,
        currency: (q as Record<string, unknown>).currency as string || "USD",
        volume: q.regularMarketVolume,
        marketCap: (q as Record<string, unknown>).marketCap as number,
        exchange: (q as Record<string, unknown>).fullExchangeName as string || (q as Record<string, unknown>).exchange as string,
        assetType: mapQuoteType((q as Record<string, unknown>).quoteType as string),
        fetchedAt: new Date().toISOString(),
      });
    }

    return quotes;
  },

  async history(symbol: string, range: TimeRange): Promise<PriceHistoryPoint[]> {
    const { period1, interval } = mapRange(range);

    const result = await yf.chart(symbol, {
      period1,
      interval,
    });

    return (result.quotes ?? []).map((q: Record<string, unknown>) => ({
      date: q.date instanceof Date ? q.date.toISOString().split("T")[0] : String(q.date),
      open: (q.open as number) ?? null,
      high: (q.high as number) ?? null,
      low: (q.low as number) ?? null,
      close: (q.close as number) ?? 0,
      volume: (q.volume as number) ?? null,
    }));
  },
};
