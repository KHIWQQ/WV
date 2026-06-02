// Maps our unified market symbols (Yahoo / CoinGecko / Goldtraders style) to
// TradingView symbol strings for the embeddable Advanced Chart widget.
//
// Returns `null` when there's no reliable TradingView feed for the instrument
// (Thai gold, mutual funds, futures-style commodities, caret indices, …) so
// callers can fall back to the in-app Lite chart instead of showing
// TradingView's "Invalid symbol" state.

import type { AssetType } from "@/lib/market/providers/types";

export interface TvSymbolInput {
  symbol: string;
  assetType: AssetType;
  exchange?: string;
}

export function toTradingViewSymbol(input: TvSymbolInput): string | null {
  const upper = (input.symbol || "").trim().toUpperCase();
  if (!upper) return null;

  // Thai physical gold (Goldtraders) has no TradingView feed.
  if (upper.startsWith("XAUTH") || (input.exchange ?? "").toLowerCase().includes("goldtraders")) {
    return null;
  }

  switch (input.assetType) {
    case "crypto": {
      // "BTC-USD" → "CRYPTO:BTCUSD"
      const base = upper.split("-")[0].replace(/USD$/, "");
      return base ? `CRYPTO:${base}USD` : null;
    }
    case "forex": {
      // "EURUSD=X" → "FX_IDC:EURUSD"; Yahoo's single-leg "THB=X" means USD/THB.
      let pair = upper.replace(/=X$/, "");
      if (pair.length === 3) pair = `USD${pair}`;
      return pair.length === 6 ? `FX_IDC:${pair}` : null;
    }
    case "stock":
    case "etf": {
      // SET (Thai) tickers come through as "PTT.BK".
      if (upper.endsWith(".BK")) return `SET:${upper.slice(0, -3)}`;
      // Bare US-style ticker — TradingView resolves it to its primary listing.
      if (!upper.includes(".") && !upper.startsWith("^")) return upper;
      // Other foreign suffixes / caret symbols aren't reliably mappable.
      return null;
    }
    // index / commodity / mutualfund / unknown → no reliable mapping.
    default:
      return null;
  }
}

// TradingView widget locale codes keyed by our app locale.
export function tradingViewLocale(locale: string): string {
  switch (locale) {
    case "th":
      return "th_TH";
    case "zh":
      return "zh_CN";
    default:
      return "en";
  }
}
