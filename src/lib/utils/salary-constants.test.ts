import {
  sumAmountMap,
  netRtaPay,
  extraIncome,
  summarizeSalary,
  salaryTrend,
} from "./salary-constants";

function rec(over: Partial<Parameters<typeof summarizeSalary>[0][number]> = {}) {
  return {
    period: "2025-01-01",
    gross_rta: 50000,
    income_tiny: 0,
    income_sckt: 0,
    deductions: {},
    gov_contrib: {},
    ...over,
  };
}

describe("sumAmountMap", () => {
  it("sums values and tolerates null/undefined/NaN", () => {
    expect(sumAmountMap({ a: 10, b: 5 })).toBe(15);
    expect(sumAmountMap(null)).toBe(0);
    expect(sumAmountMap(undefined)).toBe(0);
    // Non-numeric entries are coerced to 0.
    expect(sumAmountMap({ a: 10, b: NaN as unknown as number })).toBe(10);
  });
});

describe("netRtaPay / extraIncome", () => {
  it("nets gross minus deduction total", () => {
    expect(netRtaPay(50000, { kbkk_save: 3000, coop: 2000 })).toBe(45000);
  });
  it("sums extra income streams", () => {
    expect(extraIncome({ income_tiny: 8000, income_sckt: 5000 })).toBe(13000);
  });
});

describe("summarizeSalary", () => {
  it("aggregates totals, GPF contributions, and breakdowns", () => {
    const summary = summarizeSalary([
      rec({
        period: "2025-01-01",
        gross_rta: 50000,
        income_tiny: 8000,
        income_sckt: 2000,
        deductions: { kbkk_save: 3000, kbkk_extra: 1000, coop: 2000 },
        gov_contrib: { kbkk_match: 3000, kbkk_compensate: 1000 },
      }),
      rec({
        period: "2025-02-01",
        gross_rta: 50000,
        deductions: { kbkk_save: 3000 },
        gov_contrib: { kbkk_match: 3000 },
      }),
    ]);

    expect(summary.totalGross).toBe(100000);
    expect(summary.totalDeductions).toBe(9000); // 6000 + 3000
    expect(summary.totalNet).toBe(91000);
    expect(summary.totalExtraIncome).toBe(10000);
    expect(summary.grandTotal).toBe(101000); // net + extra
    // Personal GPF = kbkk_save + kbkk_extra across rows: (3000+1000) + 3000
    expect(summary.ownGpfContributed).toBe(7000);
    // Government GPF = all gov_contrib: (3000+1000) + 3000
    expect(summary.govGpfContributed).toBe(7000);
    expect(summary.monthsTracked).toBe(2);

    // Breakdown is sorted desc and carries percentages summing to ~100.
    const total = summary.deductionBreakdown.reduce((s, d) => s + d.percent, 0);
    expect(Math.round(total)).toBe(100);
    expect(summary.deductionBreakdown[0].amount).toBeGreaterThanOrEqual(
      summary.deductionBreakdown[1].amount
    );
  });

  it("returns zeroed summary for no records", () => {
    const s = summarizeSalary([]);
    expect(s.totalGross).toBe(0);
    expect(s.monthsTracked).toBe(0);
    expect(s.deductionBreakdown).toEqual([]);
  });
});

describe("salaryTrend", () => {
  it("orders oldest→newest and folds back-pay into the same month", () => {
    const trend = salaryTrend([
      rec({ period: "2025-02-01", gross_rta: 50000, deductions: { coop: 2000 } }),
      rec({ period: "2025-01-01", gross_rta: 48000, deductions: { coop: 1000 } }),
      // A back-pay row for Jan folds into the Jan point.
      rec({ period: "2025-01-01", gross_rta: 2000, deductions: {} }),
    ]);

    expect(trend.map((p) => p.period)).toEqual(["2025-01-01", "2025-02-01"]);
    expect(trend[0].gross).toBe(50000); // 48000 + 2000
    expect(trend[0].net).toBe(49000); // 50000 - 1000
    expect(trend[1].net).toBe(48000); // 50000 - 2000
  });
});
