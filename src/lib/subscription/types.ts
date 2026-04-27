export type SubscriptionTier = "free" | "premium";

export const PREMIUM_FEATURES = [
  "portfolio_analytics",
  "retirement_planning",
  "advanced_market_data",
  "family_sharing",
  "estate_vault",
] as const;

export type PremiumFeature = (typeof PREMIUM_FEATURES)[number];

export class PremiumRequiredError extends Error {
  feature: PremiumFeature;
  constructor(feature: PremiumFeature) {
    super(`Premium subscription required for: ${feature}`);
    this.name = "PremiumRequiredError";
    this.feature = feature;
  }
}
