import {
  computeSavingsRatePct,
  savingsRateTone,
  sortMovers,
  type AssetMover,
} from "./movers";

describe("computeSavingsRatePct", () => {
  it("returns positive % when income > expense", () => {
    // 60k income, 40k expense → 33.33% saved
    expect(computeSavingsRatePct(60000, 40000)).toBeCloseTo(33.333, 2);
  });

  it("returns 0 when income = 0 (avoids NaN)", () => {
    expect(computeSavingsRatePct(0, 5000)).toBe(0);
  });

  it("returns 100 when expense = 0", () => {
    expect(computeSavingsRatePct(50000, 0)).toBe(100);
  });

  it("returns negative when overspending", () => {
    // 30k income, 50k expense → −66.67%
    expect(computeSavingsRatePct(30000, 50000)).toBeCloseTo(-66.667, 2);
  });

  it("treats negative income as zero (defensive)", () => {
    expect(computeSavingsRatePct(-100, 50)).toBe(0);
  });

  it("guards against non-finite inputs", () => {
    expect(computeSavingsRatePct(NaN, 100)).toBe(0);
    expect(computeSavingsRatePct(100, NaN)).toBe(100); // expense → 0
    expect(computeSavingsRatePct(Infinity, 100)).toBe(0);
  });
});

describe("savingsRateTone", () => {
  it("≥20% → positive", () => {
    expect(savingsRateTone(20)).toBe("positive");
    expect(savingsRateTone(50)).toBe("positive");
  });

  it("0–20% → neutral", () => {
    expect(savingsRateTone(0)).toBe("neutral");
    expect(savingsRateTone(10)).toBe("neutral");
    expect(savingsRateTone(19.9)).toBe("neutral");
  });

  it("<0 → negative", () => {
    expect(savingsRateTone(-1)).toBe("negative");
    expect(savingsRateTone(-100)).toBe("negative");
  });

  it("non-finite → neutral", () => {
    expect(savingsRateTone(NaN)).toBe("neutral");
    expect(savingsRateTone(Infinity)).toBe("neutral");
  });
});

describe("sortMovers", () => {
  function mover(
    id: string,
    pct: number,
    overrides: Partial<AssetMover> = {}
  ): AssetMover {
    return {
      id,
      name: `asset-${id}`,
      symbol: id.toUpperCase(),
      currency: "THB",
      currentValue: 1000,
      changePercent: pct,
      ...overrides,
    };
  }

  it("returns top N gainers and losers", () => {
    const movers = [
      mover("a", 5),
      mover("b", -3),
      mover("c", 10),
      mover("d", -8),
      mover("e", 1),
      mover("f", -1),
    ];
    const { winners, losers } = sortMovers(movers, 2);
    expect(winners.map((m) => m.id)).toEqual(["c", "a"]);
    expect(losers.map((m) => m.id)).toEqual(["d", "b"]);
  });

  it("excludes flat (0%) movers from both lists", () => {
    const movers = [mover("a", 0), mover("b", 5), mover("c", -5)];
    const { winners, losers } = sortMovers(movers, 5);
    expect(winners.map((m) => m.id)).toEqual(["b"]);
    expect(losers.map((m) => m.id)).toEqual(["c"]);
  });

  it("limits result count to `limit` per side", () => {
    const movers = Array.from({ length: 10 }, (_, i) => mover(`g${i}`, i + 1));
    const { winners, losers } = sortMovers(movers, 3);
    expect(winners).toHaveLength(3);
    expect(losers).toHaveLength(0);
  });

  it("returns empty lists when no movers", () => {
    const { winners, losers } = sortMovers([], 3);
    expect(winners).toEqual([]);
    expect(losers).toEqual([]);
  });

  it("does not pad losers with positive movers when no negatives exist", () => {
    const movers = [mover("a", 5), mover("b", 3), mover("c", 1)];
    const { winners, losers } = sortMovers(movers, 5);
    expect(winners.map((m) => m.id)).toEqual(["a", "b", "c"]);
    expect(losers).toEqual([]);
  });

  it("does not mutate the input array", () => {
    const movers = [mover("a", 5), mover("b", -3)];
    const before = movers.map((m) => m.id);
    sortMovers(movers, 5);
    expect(movers.map((m) => m.id)).toEqual(before);
  });
});
