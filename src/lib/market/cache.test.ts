import { quoteCache, QUOTE_TTL } from "./cache";

describe("MemoryCache (via quoteCache)", () => {
  beforeEach(() => quoteCache.clear());

  const fakeQuote = (price: number) =>
    ({
      symbol: "TEST",
      shortName: "Test",
      price,
      change: 0,
      changePercent: 0,
      currency: "USD" as const,
      assetType: "stock" as const,
      fetchedAt: new Date().toISOString(),
    }) as Parameters<typeof quoteCache.set>[1];

  it("returns null for missing keys", () => {
    expect(quoteCache.get("missing")).toBeNull();
  });

  it("returns the value before TTL expires", () => {
    quoteCache.set("aapl", fakeQuote(100), QUOTE_TTL);
    expect(quoteCache.get("aapl")?.price).toBe(100);
  });

  it("returns null after TTL expires", () => {
    quoteCache.set("aapl", fakeQuote(100), 10);
    jest.useFakeTimers().setSystemTime(Date.now() + 100);
    expect(quoteCache.get("aapl")).toBeNull();
    jest.useRealTimers();
  });

  it("delete removes a single key", () => {
    quoteCache.set("a", fakeQuote(1), QUOTE_TTL);
    quoteCache.set("b", fakeQuote(2), QUOTE_TTL);
    quoteCache.delete("a");
    expect(quoteCache.get("a")).toBeNull();
    expect(quoteCache.get("b")?.price).toBe(2);
  });

  it("clear empties the cache", () => {
    quoteCache.set("a", fakeQuote(1), QUOTE_TTL);
    quoteCache.clear();
    expect(quoteCache.size).toBe(0);
  });
});
