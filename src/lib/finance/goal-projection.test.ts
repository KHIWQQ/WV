import {
  projectGoal,
  emergencyFundMonths,
  emergencyFundTone,
} from "./goal-projection";

describe("projectGoal", () => {
  const today = new Date("2026-01-01T00:00:00Z");

  it("computes progress % correctly", () => {
    expect(
      projectGoal(
        { targetAmount: 1_000_000, currentAmount: 250_000, monthlyContribution: 0 },
        today
      ).progressPct
    ).toBe(25);
  });

  it("returns 0 progress when target is 0", () => {
    expect(
      projectGoal(
        { targetAmount: 0, currentAmount: 50, monthlyContribution: 100 },
        today
      ).progressPct
    ).toBe(0);
  });

  it("monthsRemaining = 0 when already complete", () => {
    expect(
      projectGoal(
        { targetAmount: 100, currentAmount: 100, monthlyContribution: 10 },
        today
      ).monthsRemaining
    ).toBe(0);
  });

  it("monthsRemaining = null when contribution is 0 and not done", () => {
    expect(
      projectGoal(
        { targetAmount: 100, currentAmount: 50, monthlyContribution: 0 },
        today
      ).monthsRemaining
    ).toBeNull();
  });

  it("monthsRemaining ceils up", () => {
    // 100 - 50 = 50 / 7 = 7.14 → ceil 8
    expect(
      projectGoal(
        { targetAmount: 100, currentAmount: 50, monthlyContribution: 7 },
        today
      ).monthsRemaining
    ).toBe(8);
  });

  it("computes monthsToTargetDate from today", () => {
    const r = projectGoal(
      {
        targetAmount: 1000,
        currentAmount: 0,
        monthlyContribution: 100,
        targetDate: "2027-01-01",
      },
      today
    );
    // 2026-01-01 → 2027-01-01 = 12 months
    expect(r.monthsToTargetDate).toBeGreaterThanOrEqual(11);
    expect(r.monthsToTargetDate).toBeLessThanOrEqual(13);
  });

  it("onTrack = true when monthsRemaining ≤ monthsToTargetDate", () => {
    // 1000 / 100 = 10 months ≤ 12 months → on track
    const r = projectGoal(
      {
        targetAmount: 1000,
        currentAmount: 0,
        monthlyContribution: 100,
        targetDate: "2027-01-01",
      },
      today
    );
    expect(r.onTrack).toBe(true);
  });

  it("onTrack = false when contribution too low", () => {
    // 1000 / 50 = 20 months > 12 months → not on track
    const r = projectGoal(
      {
        targetAmount: 1000,
        currentAmount: 0,
        monthlyContribution: 50,
        targetDate: "2027-01-01",
      },
      today
    );
    expect(r.onTrack).toBe(false);
  });

  it("recommendedMonthly = remaining / monthsToTarget", () => {
    const r = projectGoal(
      {
        targetAmount: 1200,
        currentAmount: 0,
        monthlyContribution: 0,
        targetDate: "2027-01-01",
      },
      today
    );
    // 1200 / ~12 = ~100
    expect(r.recommendedMonthly).toBeCloseTo(100, 0);
  });

  it("recommendedMonthly = null when no target date", () => {
    expect(
      projectGoal(
        { targetAmount: 1000, currentAmount: 0, monthlyContribution: 100 },
        today
      ).recommendedMonthly
    ).toBeNull();
  });

  it("guards against non-finite inputs", () => {
    const r = projectGoal(
      {
        targetAmount: NaN,
        currentAmount: NaN,
        monthlyContribution: NaN,
      },
      today
    );
    expect(r.progressPct).toBe(0);
    expect(r.monthsRemaining).toBe(0);
  });
});

describe("emergencyFundMonths", () => {
  it("computes months of coverage", () => {
    // 300k cash / 50k/month = 6 months
    expect(emergencyFundMonths(300_000, 50_000)).toBe(6);
  });

  it("returns 0 for non-positive expense", () => {
    expect(emergencyFundMonths(100_000, 0)).toBe(0);
    expect(emergencyFundMonths(100_000, -100)).toBe(0);
  });

  it("returns 0 for non-positive cash", () => {
    expect(emergencyFundMonths(0, 50_000)).toBe(0);
    expect(emergencyFundMonths(-100, 50_000)).toBe(0);
  });

  it("guards against non-finite inputs", () => {
    expect(emergencyFundMonths(NaN, 50_000)).toBe(0);
    expect(emergencyFundMonths(100_000, NaN)).toBe(0);
  });
});

describe("emergencyFundTone", () => {
  it(">= 6 months → positive", () => {
    expect(emergencyFundTone(6)).toBe("positive");
    expect(emergencyFundTone(12)).toBe("positive");
  });

  it("3-6 months → neutral", () => {
    expect(emergencyFundTone(3)).toBe("neutral");
    expect(emergencyFundTone(5)).toBe("neutral");
  });

  it("< 3 months → negative", () => {
    expect(emergencyFundTone(0)).toBe("negative");
    expect(emergencyFundTone(2.5)).toBe("negative");
  });

  it("non-finite → negative (assume worst case)", () => {
    expect(emergencyFundTone(NaN)).toBe("negative");
  });
});
