import type {
  MarketProvider,
  MarketQuote,
  MarketSearchResult,
  PriceHistoryPoint,
  TimeRange,
} from "./types";

const BASE_URL = "https://api.coingecko.com/api/v3";

// Map common crypto symbols to CoinGecko IDs
const SYMBOL_TO_ID: Record<string, string> = {
  "BTC-USD": "bitcoin",
  "ETH-USD": "ethereum",
  "SOL-USD": "solana",
  "BNB-USD": "binancecoin",
  "XRP-USD": "ripple",
  "ADA-USD": "cardano",
  "DOGE-USD": "dogecoin",
  "DOT-USD": "polkadot",
  "AVAX-USD": "avalanche-2",
  "MATIC-USD": "matic-network",
  "LINK-USD": "chainlink",
  "UNI-USD": "uniswap",
};

function symbolToId(symbol: string): string | null {
  return SYMBOL_TO_ID[symbol] || null;
}

function rangeTodays(range: TimeRange): number {
  switch (range) {
    case "1d": return 1;
    case "5d": return 5;
    case "1mo": return 30;
    case "3mo": return 90;
    case "6mo": return 180;
    case "1y": return 365;
    case "5y": return 1825;
    case "max": return 3650;
    default: return 30;
  }
}

async function fetchCG<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`CoinGecko API error: ${res.status}`);
  return res.json();
}

export const coingeckoProvider: MarketProvider = {
  async search(query: string): Promise<MarketSearchResult[]> {
    const data = await fetchCG<{ coins: Record<string, unknown>[] }>(`/search?query=${encodeURIComponent(query)}`);
    return (data.coins ?? []).slice(0, 10).map((c) => ({
      symbol: `${(c.symbol as string).toUpperCase()}-USD`,
      shortName: c.name as string,
      longName: c.name as string,
      exchange: "CoinGecko",
      assetType: "crypto" as const,
    }));
  },

  async quote(symbols: string[]): Promise<MarketQuote[]> {
    const ids = symbols.map(symbolToId).filter(Boolean) as string[];
    if (ids.length === 0) return [];

    const data = await fetchCG<Record<string, unknown>[]>(
      `/coins/markets?vs_currency=usd&ids=${ids.join(",")}&sparkline=false&price_change_percentage=24h`
    );

    return data.map((c) => {
      // Reverse lookup symbol from ID
      const sym = Object.entries(SYMBOL_TO_ID).find(([, id]) => id === c.id)?.[0] || `${(c.symbol as string).toUpperCase()}-USD`;
      return {
        symbol: sym,
        shortName: c.name as string,
        longName: c.name as string,
        price: (c.current_price as number) ?? 0,
        change: (c.price_change_24h as number) ?? 0,
        changePercent: (c.price_change_percentage_24h as number) ?? 0,
        currency: "USD",
        volume: c.total_volume as number,
        marketCap: c.market_cap as number,
        exchange: "CoinGecko",
        assetType: "crypto" as const,
        fetchedAt: new Date().toISOString(),
      };
    });
  },

  async history(symbol: string, range: TimeRange): Promise<PriceHistoryPoint[]> {
    const id = symbolToId(symbol);
    if (!id) return [];

    const days = rangeTodays(range);
    const data = await fetchCG<{ prices: [number, number][] }>(
      `/coins/${id}/market_chart?vs_currency=usd&days=${days}`
    );

    return (data.prices ?? []).map(([ts, price]) => ({
      date: new Date(ts).toISOString().split("T")[0],
      open: null,
      high: null,
      low: null,
      close: price,
      volume: null,
    }));
  },
};
