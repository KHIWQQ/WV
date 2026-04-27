import { PremiumRequiredError, PREMIUM_FEATURES } from "./types";

describe("PremiumRequiredError", () => {
  it("preserves the feature name", () => {
    const err = new PremiumRequiredError("retirement_planning");
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("PremiumRequiredError");
    expect(err.feature).toBe("retirement_planning");
    expect(err.message).toContain("retirement_planning");
  });
});

describe("PREMIUM_FEATURES", () => {
  it("includes the canonical premium routes", () => {
    expect(PREMIUM_FEATURES).toContain("retirement_planning");
    expect(PREMIUM_FEATURES).toContain("portfolio_analytics");
  });
});
