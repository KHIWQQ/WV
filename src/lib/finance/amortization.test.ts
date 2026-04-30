import { buildAmortization, comparePayoff, MAX_MONTHS } from "./amortization";

describe("buildAmortization", () => {
  it("amortizes a simple loan to zero balance", () => {
    // 1M THB at 5% / 30 yrs → standard payment ~5,368.22
    const r = buildAmortization(1_000_000, 5, 5368.22, "2026-01-01");
    expect(r.underwater).toBe(false);
    expect(r.monthsToPayoff).toBeGreaterThan(355);
    expect(r.monthsToPayoff).toBeLessThanOrEqual(360);
    expect(r.schedule[r.schedule.length - 1].balanceAfter).toBe(0);
  });

  it("first row's principal+interest sums to the monthly payment", () => {
    const r = buildAmortization(100_000, 6, 1000, "2026-01-01");
    const first = r.schedule[0];
    expect(first.principalPaid + first.interestPaid).toBeCloseTo(first.payment, 2);
  });

  it("zero-rate loan: interest is always 0, payoff = ceil(principal/payment)", () => {
    const r = buildAmortization(10_000, 0, 1000, "2026-01-01");
    expect(r.totalInterest).toBe(0);
    expect(r.monthsToPayoff).toBe(10);
  });

  it("returns underwater when payment can't cover interest", () => {
    // 1M @ 5% → first month's interest ≈ 4,166.67; pay only 4,000 → underwater
    const r = buildAmortization(1_000_000, 5, 4000, "2026-01-01");
    expect(r.underwater).toBe(true);
    expect(r.schedule).toHaveLength(0);
  });

  it("returns empty for invalid principal", () => {
    expect(buildAmortization(0, 5, 5000, "2026-01-01").schedule).toHaveLength(0);
    expect(buildAmortization(-1000, 5, 5000, "2026-01-01").schedule).toHaveLength(0);
    expect(buildAmortization(NaN, 5, 5000, "2026-01-01").schedule).toHaveLength(0);
  });

  it("returns underwater for invalid payment", () => {
    expect(buildAmortization(100_000, 5, 0, "2026-01-01").underwater).toBe(true);
    expect(buildAmortization(100_000, 5, -100, "2026-01-01").underwater).toBe(true);
  });

  it("never exceeds MAX_MONTHS", () => {
    const r = buildAmortization(100_000, 0, 1, "2026-01-01");
    // 100k / 1 per month = 100,000 months which is > MAX_MONTHS → underwater
    expect(r.underwater).toBe(true);
    expect(MAX_MONTHS).toBeGreaterThan(0);
  });

  it("payoff date is the last scheduled payment date", () => {
    const r = buildAmortization(10_000, 0, 1000, "2026-01-01");
    expect(r.payoffDate).toBe("2026-11-01");
  });

  it("ISO dates use 2-digit month/day padding", () => {
    const r = buildAmortization(1000, 0, 500, "2026-01-01");
    expect(r.schedule[0].paymentDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("comparePayoff", () => {
  it("paying extra reduces months and interest", () => {
    const cmp = comparePayoff(1_000_000, 5, 5368.22, 1000, "2026-01-01");
    expect(cmp.monthsSaved).toBeGreaterThan(0);
    expect(cmp.interestSaved).toBeGreaterThan(0);
    expect(cmp.monthsWithExtra).toBeLessThan(cmp.monthsCurrent);
  });

  it("zero extra returns zero saved", () => {
    const cmp = comparePayoff(100_000, 5, 1000, 0, "2026-01-01");
    expect(cmp.monthsSaved).toBe(0);
    expect(cmp.interestSaved).toBe(0);
  });

  it("negative extra is treated as zero (defensive)", () => {
    const cmp = comparePayoff(100_000, 5, 1000, -500, "2026-01-01");
    expect(cmp.monthsSaved).toBe(0);
  });

  it("payoff dates differ when extra > 0", () => {
    const cmp = comparePayoff(500_000, 4, 3000, 500, "2026-01-01");
    expect(cmp.payoffDateCurrent).not.toBeNull();
    expect(cmp.payoffDateWithExtra).not.toBeNull();
    expect(cmp.payoffDateWithExtra! < cmp.payoffDateCurrent!).toBe(true);
  });
});
