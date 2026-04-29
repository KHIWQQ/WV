import {
  thaiGoldProvider,
  isThaiGoldSymbol,
  THAI_GOLD_SYMBOLS,
  getThaiGoldPrices,
  _resetThaiGoldCacheForTests,
} from "./thai-gold";

describe("thai-gold provider", () => {
  const realFetch = global.fetch;

  beforeEach(() => {
    _resetThaiGoldCacheForTests();
  });

  afterEach(() => {
    global.fetch = realFetch;
    jest.restoreAllMocks();
  });

  describe("isThaiGoldSymbol", () => {
    it("recognises the four canonical symbols", () => {
      expect(isThaiGoldSymbol("XAUTH-BAR-BUY")).toBe(true);
      expect(isThaiGoldSymbol("XAUTH-BAR-SELL")).toBe(true);
      expect(isThaiGoldSymbol("XAUTH-ORN-BUY")).toBe(true);
      expect(isThaiGoldSymbol("XAUTH-ORN-SELL")).toBe(true);
    });

    it("is case-insensitive", () => {
      expect(isThaiGoldSymbol("xauth-bar-sell")).toBe(true);
    });

    it("rejects non-gold symbols", () => {
      expect(isThaiGoldSymbol("BTC-USD")).toBe(false);
      expect(isThaiGoldSymbol("AAPL")).toBe(false);
      expect(isThaiGoldSymbol("XAUTH")).toBe(false); // bare prefix is not a valid symbol
      expect(isThaiGoldSymbol("")).toBe(false);
    });
  });

  describe("search", () => {
    it("returns all four symbols for Thai keyword", async () => {
      const results = await thaiGoldProvider.search("ทอง");
      expect(results).toHaveLength(4);
      expect(results.map((r) => r.symbol).sort()).toEqual(
        Object.keys(THAI_GOLD_SYMBOLS).sort()
      );
    });

    it("returns all four symbols for English keyword", async () => {
      const results = await thaiGoldProvider.search("gold");
      expect(results).toHaveLength(4);
    });

    it("returns all four symbols for synthetic ticker prefix", async () => {
      const results = await thaiGoldProvider.search("XAUTH");
      expect(results).toHaveLength(4);
    });

    it("returns empty for unrelated query", async () => {
      const results = await thaiGoldProvider.search("AAPL");
      expect(results).toEqual([]);
    });
  });

  describe("getThaiGoldPrices", () => {
    it("uses chnwt JSON when available", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: {
            buy: "32500",
            sell: "32600",
            OrnamentBuy: "31900",
            OrnamentSell: "33100",
          },
        }),
      }) as unknown as typeof fetch;

      const p = await getThaiGoldPrices();
      expect(p.source).toBe("chnwt");
      expect(p.barBuy).toBe(32500);
      expect(p.barSell).toBe(32600);
      expect(p.ornamentBuy).toBe(31900);
      expect(p.ornamentSell).toBe(33100);
    });

    it("strips comma separators in chnwt response", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: {
            buy: "32,500",
            sell: "32,600.50",
            OrnamentBuy: "31,900",
            OrnamentSell: "33,100",
          },
        }),
      }) as unknown as typeof fetch;

      const p = await getThaiGoldPrices();
      expect(p.barBuy).toBe(32500);
      expect(p.barSell).toBe(32600.5);
    });

    it("falls back to goldtraders HTML scrape when chnwt fails", async () => {
      const html = `
        <html><body>
          <span id="DetailPlace_uc_goldprices1_lblBLBuy">51,500.00</span>
          <span id="DetailPlace_uc_goldprices1_lblBLSell">51,600.00</span>
          <span id="DetailPlace_uc_goldprices1_lblOMBuy">50,580.00</span>
          <span id="DetailPlace_uc_goldprices1_lblOSSell">52,400.00</span>
        </body></html>
      `;
      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({ ok: false }) // chnwt fails
        .mockResolvedValueOnce({ ok: true, text: async () => html }) as unknown as typeof fetch;

      const p = await getThaiGoldPrices();
      expect(p.source).toBe("goldtraders");
      expect(p.barBuy).toBe(51500);
      expect(p.barSell).toBe(51600);
      expect(p.ornamentBuy).toBe(50580);
      expect(p.ornamentSell).toBe(52400);
    });

    it("uses hardcoded fallback when both upstream sources fail", async () => {
      global.fetch = jest
        .fn()
        .mockRejectedValueOnce(new Error("network down"))
        .mockRejectedValueOnce(new Error("network down")) as unknown as typeof fetch;

      const p = await getThaiGoldPrices();
      expect(p.source).toBe("fallback");
      // All four prices must be > 0 so sync never writes nonsense
      expect(p.barBuy).toBeGreaterThan(0);
      expect(p.barSell).toBeGreaterThan(0);
      expect(p.ornamentBuy).toBeGreaterThan(0);
      expect(p.ornamentSell).toBeGreaterThan(0);
    });

    it("rejects malformed chnwt response (zero prices)", async () => {
      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            response: { buy: "0", sell: "0", OrnamentBuy: "0", OrnamentSell: "0" },
          }),
        })
        .mockRejectedValueOnce(new Error("scrape down")) as unknown as typeof fetch;

      const p = await getThaiGoldPrices();
      expect(p.source).toBe("fallback");
    });

    it("caches successful fetches for ~5 min", async () => {
      const fetchMock = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          response: {
            buy: "32500",
            sell: "32600",
            OrnamentBuy: "31900",
            OrnamentSell: "33100",
          },
        }),
      });
      global.fetch = fetchMock as unknown as typeof fetch;

      await getThaiGoldPrices();
      await getThaiGoldPrices();
      await getThaiGoldPrices();
      // Only one upstream call — subsequent calls hit the in-memory cache
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("quote", () => {
    beforeEach(() => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          response: {
            buy: "32500",
            sell: "32600",
            OrnamentBuy: "31900",
            OrnamentSell: "33100",
          },
        }),
      }) as unknown as typeof fetch;
    });

    it("returns a MarketQuote shape with THB currency", async () => {
      const quotes = await thaiGoldProvider.quote(["XAUTH-BAR-SELL"]);
      expect(quotes).toHaveLength(1);
      const q = quotes[0];
      expect(q.symbol).toBe("XAUTH-BAR-SELL");
      expect(q.currency).toBe("THB");
      expect(q.price).toBe(32600);
      expect(q.assetType).toBe("commodity");
    });

    it("maps each symbol to its correct price", async () => {
      const quotes = await thaiGoldProvider.quote([
        "XAUTH-BAR-BUY",
        "XAUTH-BAR-SELL",
        "XAUTH-ORN-BUY",
        "XAUTH-ORN-SELL",
      ]);
      const byKey = new Map(quotes.map((q) => [q.symbol, q.price]));
      expect(byKey.get("XAUTH-BAR-BUY")).toBe(32500);
      expect(byKey.get("XAUTH-BAR-SELL")).toBe(32600);
      expect(byKey.get("XAUTH-ORN-BUY")).toBe(31900);
      expect(byKey.get("XAUTH-ORN-SELL")).toBe(33100);
    });

    it("filters out unknown symbols", async () => {
      const quotes = await thaiGoldProvider.quote(["XAUTH-BAR-SELL", "AAPL", "BTC-USD"]);
      expect(quotes).toHaveLength(1);
      expect(quotes[0].symbol).toBe("XAUTH-BAR-SELL");
    });

    it("returns empty when no valid symbols requested", async () => {
      const quotes = await thaiGoldProvider.quote(["AAPL", "BTC-USD"]);
      expect(quotes).toEqual([]);
    });
  });
});
