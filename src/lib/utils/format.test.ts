import { formatTHB, formatNumber, formatPercent } from "./format";

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
