import { projectHealthcare } from "./healthcare";

describe("projectHealthcare", () => {
  it("computes a positive projection for a typical input", () => {
    const r = projectHealthcare({
      currentAge: 35,
      retirementAge: 60,
      expectedLifespan: 80,
      currentMonthlyHealthExpense: 3000,
      inflationPct: 5,
      realReturnPct: 2,
    });
    expect(r.projectedMonthlyAtRetirement).toBeGreaterThan(3000);
    expect(r.totalLifetimeCost).toBeGreaterThan(0);
    expect(r.presentValueAtRetirement).toBeLessThan(r.totalLifetimeCost);
    expect(r.yearsOfRetirement).toBe(20);
  });

  it("applies post-65 multiplier when retirement age >= 65", () => {
    const before = projectHealthcare({
      currentAge: 35,
      retirementAge: 60,
      expectedLifespan: 80,
      currentMonthlyHealthExpense: 3000,
      inflationPct: 5,
      realReturnPct: 2,
    });
    const after = projectHealthcare({
      currentAge: 35,
      retirementAge: 65,
      expectedLifespan: 80,
      currentMonthlyHealthExpense: 3000,
      inflationPct: 5,
      realReturnPct: 2,
    });
    // Even with shorter retirement (15 vs 20 yrs), the post-65 ramp should
    // make per-month spending higher.
    expect(after.projectedMonthlyAtRetirement).toBeGreaterThan(
      before.projectedMonthlyAtRetirement
    );
  });

  it("zero-inflation: baseline carries forward unchanged", () => {
    const r = projectHealthcare({
      currentAge: 60,
      retirementAge: 65,
      expectedLifespan: 80,
      currentMonthlyHealthExpense: 5000,
      inflationPct: 0,
      realReturnPct: 0,
    });
    // 5000 × 1.7 (post-65 multiplier)
    expect(r.projectedMonthlyAtRetirement).toBeCloseTo(8500, 0);
    // 15 yrs × 12 months × 8500 = 1,530,000
    expect(r.totalLifetimeCost).toBeCloseTo(1_530_000, 0);
    // With realRate=0, PV equals nominal
    expect(r.presentValueAtRetirement).toBeCloseTo(r.totalLifetimeCost, 0);
  });

  it("zero baseline → all zeros", () => {
    const r = projectHealthcare({
      currentAge: 35,
      retirementAge: 60,
      expectedLifespan: 80,
      currentMonthlyHealthExpense: 0,
      inflationPct: 5,
      realReturnPct: 2,
    });
    expect(r.projectedMonthlyAtRetirement).toBe(0);
    expect(r.totalLifetimeCost).toBe(0);
    expect(r.presentValueAtRetirement).toBe(0);
  });

  it("invalid age ordering returns zeros", () => {
    const r1 = projectHealthcare({
      currentAge: 65,
      retirementAge: 60, // before current
      expectedLifespan: 80,
      currentMonthlyHealthExpense: 5000,
      inflationPct: 5,
      realReturnPct: 2,
    });
    expect(r1.totalLifetimeCost).toBe(0);

    const r2 = projectHealthcare({
      currentAge: 35,
      retirementAge: 60,
      expectedLifespan: 55, // before retirement
      currentMonthlyHealthExpense: 5000,
      inflationPct: 5,
      realReturnPct: 2,
    });
    expect(r2.totalLifetimeCost).toBe(0);
  });

  it("guards against non-finite numeric inputs", () => {
    const r = projectHealthcare({
      currentAge: NaN,
      retirementAge: 60,
      expectedLifespan: 80,
      currentMonthlyHealthExpense: 3000,
      inflationPct: 5,
      realReturnPct: 2,
    });
    expect(r.totalLifetimeCost).toBe(0);
  });
});
