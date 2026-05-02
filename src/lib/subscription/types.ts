export type SubscriptionTier = "free" | "premium";

export const PREMIUM_FEATURES = [
  "portfolio_analytics",
  "retirement_planning",
  "advanced_market_data",
  "family_sharing",
  "estate_vault",
] as const;

export type PremiumFeature = (typeof PREMIUM_FEATURES)[number];

/**
 * Human-readable labels for the admin features page.
 * Keep in sync with PREMIUM_FEATURES.
 */
export const PREMIUM_FEATURE_LABELS: Record<PremiumFeature, string> = {
  portfolio_analytics: "วิเคราะห์พอร์ตการลงทุน (Portfolio analytics)",
  retirement_planning: "วางแผนเกษียณ (Retirement planning)",
  advanced_market_data: "ข้อมูลตลาดขั้นสูง (Advanced market data)",
  family_sharing: "แชร์ข้อมูลกับครอบครัว (Family sharing)",
  estate_vault: "วางแผนมรดก (Estate vault)",
};

/**
 * App-wide feature-flag settings stored in `app_settings` (single row).
 * Hydrated to Zustand via `<AppSettingsHydrator>` so client gates can
 * react without an extra fetch.
 */
export interface AppSettings {
  /** Master kill-switch. When true, every premium gate is open. */
  allFeaturesFree: boolean;
  /**
   * Per-feature overrides. Empty object = use defaults (all PREMIUM_FEATURES
   * gated). Setting a feature to "free" makes that one accessible regardless
   * of user tier.
   */
  featureOverrides: Partial<Record<PremiumFeature, "free" | "premium">>;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  allFeaturesFree: false,
  featureOverrides: {},
};

export class PremiumRequiredError extends Error {
  feature: PremiumFeature;
  constructor(feature: PremiumFeature) {
    super(`Premium subscription required for: ${feature}`);
    this.name = "PremiumRequiredError";
    this.feature = feature;
  }
}
