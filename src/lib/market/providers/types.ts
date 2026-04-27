// Unified market data types across all providers

export interface MarketQuote {
  symbol: string;
  shortName: string;
  longName?: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
  volume?: number;
  marketCap?: number;
  exchange?: string;
  assetType: AssetType;
  fetchedAt: string;
}

export interface MarketSearchResult {
  symbol: string;
  shortName: string;
  longName?: string;
  exchange: string;
  assetType: AssetType;
}

export interface PriceHistoryPoint {
  date: string;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number;
  volume: number | null;
}

export type AssetType =
  | "stock"
  | "crypto"
  | "forex"
  | "commodity"
  | "index"
  | "etf"
  | "mutualfund"
  | "unknown";

export type TimeRange = "1d" | "5d" | "1mo" | "3mo" | "6mo" | "1y" | "5y" | "max";

export interface MarketProvider {
  search(query: string): Promise<MarketSearchResult[]>;
  quote(symbols: string[]): Promise<MarketQuote[]>;
  history(symbol: string, range: TimeRange): Promise<PriceHistoryPoint[]>;
}
