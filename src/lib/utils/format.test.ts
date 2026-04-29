import { formatTHB, formatNumber, formatPercent, formatCurrency } from "./format";

describe("formatTHB", () => {
  it("formats positive integers with the THB symbol", () => {
    expect(formatTHB(1234567)).toMatch(/1,234,567/);
    expect(formatTHB(1234567)).toMatch(/฿/);
  });

  it("formats zero", () => {
    expect(formatTHB(0)).toMatch(/0/);
  });

  it("formats negative amounts", () => {
    expect(formatTHB(-500)).toMatch(/-/);
  });
});

describe("formatNumber", () => {
  it("formats with no decimals by default", () => {
    expect(formatNumber(1234)).toBe("1,234");
  });

  it("respects the decimals param", () => {
    expect(formatNumber(1234.567, 2)).toBe("1,234.57");
  });
});

describe("formatPercent", () => {
  it("prefixes positive values with +", () => {
    expect(formatPercent(2.5)).toBe("+2.5%");
  });

  it("keeps the minus sign for negatives", () => {
    expect(formatPercent(-3.14)).toBe("-3.1%");
  });

  it("supports custom decimals", () => {
    expect(formatPercent(1.2345, 3)).toBe("+1.234%");
  });
});

describe("formatCurrency", () => {
  it("formats THB through formatTHB", () => {
    expect(formatCurrency(1000, "THB")).toBe(formatTHB(1000));
  });

  it("formats USD with $ symbol", () => {
    expect(formatCurrency(1500, "USD")).toMatch(/\$/);
    expect(formatCurrency(1500, "USD")).toMatch(/1,500/);
  });

  it("normalizes case", () => {
    expect(formatCurrency(100, "usd")).toBe(formatCurrency(100, "USD"));
  });

  it("defaults to THB when currency missing", () => {
    expect(formatCurrency(500, null)).toBe(formatTHB(500));
    expect(formatCurrency(500, undefined)).toBe(formatTHB(500));
  });

  it("falls back gracefully for unknown currency", () => {
    // Intl is lenient and accepts arbitrary 3-letter codes — just make
    // sure we don't throw and the number survives.
    const out = formatCurrency(123.45, "ZZZ");
    expect(typeof out).toBe("string");
    expect(out).toMatch(/123/);
  });
});
