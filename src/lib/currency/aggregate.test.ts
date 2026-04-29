import { convertToHome, sumInHome, groupByCurrency, findMissingRates } from "./aggregate";

describe("convertToHome", () => {
  const rates = new Map([
    ["THB", 1],
    ["USD", 35],
    ["JPY", 0.23],
  ]);

  it("returns the same amount when source is home currency", () => {
    expect(convertToHome(1000, "THB", rates)).toBe(1000);
  });

  it("multiplies by the rate for non-home currencies", () => {
    expect(convertToHome(100, "USD", rates)).toBe(3500);
    expect(convertToHome(1000, "JPY", rates)).toBeCloseTo(230);
  });

  it("normalizes case", () => {
    expect(convertToHome(100, "usd", rates)).toBe(3500);
  });

  it("treats missing currency as home", () => {
    expect(convertToHome(500, null, rates)).toBe(500);
    expect(convertToHome(500, undefined, rates)).toBe(500);
  });

  it("falls back to 1:1 when rate not in map", () => {
    expect(convertToHome(100, "XYZ", rates)).toBe(100);
  });

  it("supports a custom home currency", () => {
    const usdRates = new Map([["USD", 1], ["THB", 1 / 35]]);
    expect(convertToHome(35, "THB", usdRates, "USD")).toBeCloseTo(1);
  });
});

describe("sumInHome", () => {
  const rates = new Map([
    ["THB", 1],
    ["USD", 35],
  ]);

  it("converts each item before summing", () => {
    const items = [
      { currency: "USD", value: 100 }, // 3,500
      { currency: "THB", value: 5000 },
      { currency: "USD", value: 50 },  // 1,750
    ];
    const total = sumInHome(items, (i) => i.value, rates);
    expect(total).toBeCloseTo(10250);
  });

  it("returns 0 for empty input", () => {
    expect(sumInHome([], (i: { value: number }) => i.value, rates)).toBe(0);
  });

  it("handles items with missing currency (treats as home)", () => {
    const items = [{ currency: null, value: 100 }];
    expect(sumInHome(items, (i) => i.value, rates)).toBe(100);
  });
});

describe("groupByCurrency", () => {
  it("buckets by uppercase currency", () => {
    const items = [
      { currency: "usd", id: "a" },
      { currency: "USD", id: "b" },
      { currency: "thb", id: "c" },
    ];
    const groups = groupByCurrency(items);
    expect(groups.get("USD")?.map((i) => i.id)).toEqual(["a", "b"]);
    expect(groups.get("THB")?.map((i) => i.id)).toEqual(["c"]);
  });

  it("missing currency falls into home bucket", () => {
    const items = [{ currency: undefined, id: "x" }];
    const groups = groupByCurrency(items);
    expect(groups.get("THB")?.map((i) => i.id)).toEqual(["x"]);
  });
});

describe("findMissingRates", () => {
  it("returns empty when every non-home currency has a rate", () => {
    const rates = new Map([["THB", 1], ["USD", 35], ["JPY", 0.23]]);
    const items = [
      { currency: "USD", id: "a" },
      { currency: "JPY", id: "b" },
      { currency: "THB", id: "c" },
    ];
    expect(findMissingRates(items, rates)).toEqual([]);
  });

  it("returns currencies with no rate, sorted, deduped", () => {
    const rates = new Map([["THB", 1], ["USD", 35]]);
    const items = [
      { currency: "EUR", id: "a" },
      { currency: "JPY", id: "b" },
      { currency: "EUR", id: "c" }, // dup
      { currency: "USD", id: "d" }, // present
    ];
    expect(findMissingRates(items, rates)).toEqual(["EUR", "JPY"]);
  });

  it("ignores items in the home currency", () => {
    const rates = new Map([["THB", 1]]);
    const items = [
      { currency: "THB", id: "a" },
      { currency: null, id: "b" }, // null → home
      { currency: undefined, id: "c" }, // undefined → home
    ];
    expect(findMissingRates(items, rates)).toEqual([]);
  });

  it("normalizes currency case before checking", () => {
    const rates = new Map([["THB", 1], ["USD", 35]]);
    const items = [{ currency: "usd", id: "a" }, { currency: "eur", id: "b" }];
    expect(findMissingRates(items, rates)).toEqual(["EUR"]);
  });

  it("supports a custom home currency", () => {
    const rates = new Map([["USD", 1], ["EUR", 1.1]]);
    const items = [
      { currency: "USD", id: "a" },
      { currency: "THB", id: "b" }, // missing
      { currency: "EUR", id: "c" },
    ];
    expect(findMissingRates(items, rates, "USD")).toEqual(["THB"]);
  });
});
