import { toTradingViewSymbol, tradingViewLocale } from "./tradingview";

describe("toTradingViewSymbol", () => {
  it("maps SET stocks to SET:<ticker>", () => {
    expect(toTradingViewSymbol({ symbol: "PTT.BK", assetType: "stock" })).toBe("SET:PTT");
    expect(toTradingViewSymbol({ symbol: "kbank.bk", assetType: "stock" })).toBe("SET:KBANK");
  });

  it("passes bare US tickers through", () => {
    expect(toTradingViewSymbol({ symbol: "AAPL", assetType: "stock" })).toBe("AAPL");
    expect(toTradingViewSymbol({ symbol: "VOO", assetType: "etf" })).toBe("VOO");
  });

  it("maps crypto to CRYPTO:<base>USD", () => {
    expect(toTradingViewSymbol({ symbol: "BTC-USD", assetType: "crypto" })).toBe("CRYPTO:BTCUSD");
    expect(toTradingViewSymbol({ symbol: "ETH-USD", assetType: "crypto" })).toBe("CRYPTO:ETHUSD");
  });

  it("maps forex, expanding single-leg pairs against USD", () => {
    expect(toTradingViewSymbol({ symbol: "EURUSD=X", assetType: "forex" })).toBe("FX_IDC:EURUSD");
    expect(toTradingViewSymbol({ symbol: "THB=X", assetType: "forex" })).toBe("FX_IDC:USDTHB");
  });

  it("returns null for instruments with no reliable TradingView feed", () => {
    // Thai physical gold
    expect(toTradingViewSymbol({ symbol: "XAUTH-BAR-SELL", assetType: "commodity" })).toBeNull();
    expect(
      toTradingViewSymbol({ symbol: "SOMETHING", assetType: "commodity", exchange: "Goldtraders TH" })
    ).toBeNull();
    // Caret index, foreign-suffixed stock, mutual fund, unknown
    expect(toTradingViewSymbol({ symbol: "^GSPC", assetType: "index" })).toBeNull();
    expect(toTradingViewSymbol({ symbol: "7203.T", assetType: "stock" })).toBeNull();
    expect(toTradingViewSymbol({ symbol: "ABC", assetType: "mutualfund" })).toBeNull();
    expect(toTradingViewSymbol({ symbol: "", assetType: "stock" })).toBeNull();
  });
});

describe("tradingViewLocale", () => {
  it("maps app locales to TradingView locale codes", () => {
    expect(tradingViewLocale("th")).toBe("th_TH");
    expect(tradingViewLocale("zh")).toBe("zh_CN");
    expect(tradingViewLocale("en")).toBe("en");
    expect(tradingViewLocale("xx")).toBe("en");
  });
});
