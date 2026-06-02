import {
  LayoutDashboard,
  Wallet,
  CreditCard,
  ArrowLeftRight,
  PieChart,
  TrendingUp,
  Target,
  Star,
  Banknote,
  type LucideIcon,
} from "lucide-react";

// ──────────────────────────────
// Asset Categories
// ──────────────────────────────

// `quantityUnitKey` is a key into i18n `assetUnits.*` so the UI can render
// "× 100 หุ้น" / "× 0.1 บาททอง" / "× 1 คัน" instead of the bare number.
// Keep aligned with the assetUnits block in src/lib/i18n/locales/{th,en,zh}.ts.
export const ASSET_CATEGORIES = [
  { value: "cash", labelKey: "cash" as const, color: "#22c55e", quantityUnitKey: "baht" as const },
  { value: "stock_th", labelKey: "stock_th" as const, color: "#3b82f6", quantityUnitKey: "share" as const },
  { value: "stock_us", labelKey: "stock_us" as const, color: "#6366f1", quantityUnitKey: "share" as const },
  { value: "mutual_fund", labelKey: "mutual_fund" as const, color: "#8b5cf6", quantityUnitKey: "fundUnit" as const },
  { value: "crypto", labelKey: "crypto" as const, color: "#f59e0b", quantityUnitKey: "coin" as const },
  { value: "gold", labelKey: "gold" as const, color: "#D4A843", quantityUnitKey: "bahtGold" as const },
  { value: "bond", labelKey: "bond" as const, color: "#14b8a6", quantityUnitKey: "bond" as const },
  { value: "real_estate", labelKey: "real_estate" as const, color: "#ef4444", quantityUnitKey: "plot" as const },
  { value: "vehicle", labelKey: "vehicle" as const, color: "#64748b", quantityUnitKey: "vehicle" as const },
  { value: "insurance", labelKey: "insurance" as const, color: "#ec4899", quantityUnitKey: "policy" as const },
  { value: "ssf_rmf", labelKey: "ssf_rmf" as const, color: "#06b6d4", quantityUnitKey: "fundUnit" as const },
  { value: "gpf", labelKey: "gpf" as const, color: "#0e7490", quantityUnitKey: "fundUnit" as const },
  { value: "other", labelKey: "other" as const, color: "#a1a1aa", quantityUnitKey: "piece" as const },
] as const;

export type AssetCategory = (typeof ASSET_CATEGORIES)[number]["value"];
export type AssetUnitKey = (typeof ASSET_CATEGORIES)[number]["quantityUnitKey"];

export function getAssetUnitKey(category: string): AssetUnitKey | undefined {
  return ASSET_CATEGORIES.find((c) => c.value === category)?.quantityUnitKey;
}

// ──────────────────────────────
// Liability Types
// ──────────────────────────────

export const LIABILITY_TYPES = [
  { value: "mortgage", labelKey: "mortgage" as const },
  { value: "car_loan", labelKey: "car_loan" as const },
  { value: "personal_loan", labelKey: "personal_loan" as const },
  { value: "credit_card", labelKey: "credit_card" as const },
  { value: "education_loan", labelKey: "education_loan" as const },
  { value: "other", labelKey: "other" as const },
] as const;

export type LiabilityType = (typeof LIABILITY_TYPES)[number]["value"];

// ──────────────────────────────
// Goal Types
// ──────────────────────────────

export const GOAL_TYPES = [
  "house",
  "car",
  "education",
  "emergency_fund",
  "retirement",
  "other",
] as const;

export type GoalType = (typeof GOAL_TYPES)[number];

// ──────────────────────────────
// Transaction Types
// ──────────────────────────────

export const TRANSACTION_TYPES = [
  { value: "income", labelKey: "income" as const },
  { value: "expense", labelKey: "expense" as const },
  { value: "buy", labelKey: "buy" as const },
  { value: "sell", labelKey: "sell" as const },
] as const;

export type TransactionType = (typeof TRANSACTION_TYPES)[number]["value"];

// ──────────────────────────────
// Income Categories
// ──────────────────────────────

export const INCOME_CATEGORIES = [
  { value: "salary", labelKey: "salary" as const, icon: "Banknote", color: "#22c55e" },
  { value: "freelance", labelKey: "freelance" as const, icon: "Laptop", color: "#3b82f6" },
  { value: "interest", labelKey: "interest" as const, icon: "Landmark", color: "#06b6d4" },
  { value: "dividend", labelKey: "dividend" as const, icon: "TrendingUp", color: "#8b5cf6" },
  { value: "rental", labelKey: "rental" as const, icon: "Home", color: "#f59e0b" },
  { value: "business", labelKey: "business" as const, icon: "Briefcase", color: "#ec4899" },
  { value: "bonus", labelKey: "bonus" as const, icon: "Gift", color: "#14b8a6" },
  { value: "asset_sale", labelKey: "asset_sale" as const, icon: "ArrowRightLeft", color: "#6366f1" },
  { value: "other_income", labelKey: "other_income" as const, icon: "CircleDot", color: "#a1a1aa" },
] as const;

export type IncomeCategory = (typeof INCOME_CATEGORIES)[number]["value"];

// ──────────────────────────────
// Expense Categories
// ──────────────────────────────

export const EXPENSE_CATEGORIES = [
  { value: "food", labelKey: "food" as const, icon: "UtensilsCrossed", color: "#ef4444" },
  { value: "housing", labelKey: "housing" as const, icon: "Home", color: "#f97316" },
  { value: "transport", labelKey: "transport" as const, icon: "Car", color: "#3b82f6" },
  { value: "shopping", labelKey: "shopping" as const, icon: "ShoppingBag", color: "#ec4899" },
  { value: "health", labelKey: "health" as const, icon: "Heart", color: "#22c55e" },
  { value: "entertainment", labelKey: "entertainment" as const, icon: "Gamepad2", color: "#8b5cf6" },
  { value: "education", labelKey: "education" as const, icon: "GraduationCap", color: "#06b6d4" },
  { value: "utilities", labelKey: "utilities" as const, icon: "Zap", color: "#f59e0b" },
  { value: "insurance", labelKey: "insurance" as const, icon: "Shield", color: "#14b8a6" },
  { value: "debt_payment", labelKey: "debt_payment" as const, icon: "CreditCard", color: "#64748b" },
  { value: "donation", labelKey: "donation" as const, icon: "HandHeart", color: "#d946ef" },
  { value: "personal", labelKey: "personal" as const, icon: "User", color: "#0ea5e9" },
  { value: "other_expense", labelKey: "other_expense" as const, icon: "CircleDot", color: "#a1a1aa" },
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]["value"];

// ──────────────────────────────
// Category Helpers
// ──────────────────────────────

const ALL_CATEGORIES = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];

export function getCategoryMeta(value: string) {
  return ALL_CATEGORIES.find((c) => c.value === value) ?? {
    value,
    labelKey: value,
    icon: "CircleDot" as const,
    color: "#a1a1aa",
  };
}

export function getCategoriesByType(type: string) {
  if (type === "income") return INCOME_CATEGORIES;
  if (type === "expense") return EXPENSE_CATEGORIES;
  return [];
}

/**
 * Resolve a category labelKey to a translated string.
 * Pass the relevant translations section (t.incomeCategories, t.expenseCategories, etc.)
 */
export function resolveLabel(
  labelKey: string,
  translations: Record<string, string>
): string {
  return translations[labelKey] ?? labelKey;
}

/**
 * Get translated label for an asset category.
 */
export function getAssetCategoryLabel(
  value: string,
  translations: Record<string, string>
): string {
  const cat = ASSET_CATEGORIES.find((c) => c.value === value);
  return cat ? (translations[cat.labelKey] ?? cat.labelKey) : value;
}

/**
 * Get translated label for a liability type.
 */
export function getLiabilityTypeLabel(
  value: string,
  translations: Record<string, string>
): string {
  const lt = LIABILITY_TYPES.find((l) => l.value === value);
  return lt ? (translations[lt.labelKey] ?? lt.labelKey) : value;
}

/**
 * Get translated label for a transaction category (income or expense).
 */
export function getTxCategoryLabel(
  value: string,
  incomeTranslations: Record<string, string>,
  expenseTranslations: Record<string, string>
): string {
  const meta = getCategoryMeta(value);
  // Try income first, then expense
  return incomeTranslations[meta.labelKey] ?? expenseTranslations[meta.labelKey] ?? meta.labelKey;
}

// ──────────────────────────────
// Navigation Items
// ──────────────────────────────

import type { PremiumFeature } from "@/lib/subscription/types";

export interface NavItem {
  href: string;
  labelKey: string;
  icon: LucideIcon;
  /**
   * Whether this nav entry is premium-gated by default. Used to show
   * the "PRO" badge and lock icon. The actual gate is decided at runtime
   * via `featureKey` + the admin app_settings overrides.
   */
  isPremium?: boolean;
  /**
   * The feature key checked against `app_settings.feature_overrides`.
   * Required for any item with `isPremium: true` so admins can toggle
   * it from /dashboard/admin/features.
   */
  featureKey?: PremiumFeature;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", labelKey: "overview", icon: LayoutDashboard },
  { href: "/dashboard/assets", labelKey: "assets", icon: Wallet },
  { href: "/dashboard/transactions", labelKey: "transactions", icon: ArrowLeftRight },
  { href: "/dashboard/salary", labelKey: "salary", icon: Banknote, isPremium: true, featureKey: "salary_management" },
  { href: "/dashboard/liabilities", labelKey: "liabilities", icon: CreditCard, isPremium: true, featureKey: "liabilities" },
  { href: "/dashboard/market", labelKey: "market", icon: TrendingUp },
  { href: "/dashboard/watchlist", labelKey: "watchlist", icon: Star },
  { href: "/dashboard/goals", labelKey: "goals", icon: Target },
  { href: "/dashboard/portfolio", labelKey: "portfolio", icon: PieChart, isPremium: true, featureKey: "portfolio_analytics" },
  { href: "/dashboard/retirement", labelKey: "retirement", icon: PieChart, isPremium: true, featureKey: "retirement_planning" },
];

// ──────────────────────────────
// Brand Colors
// ──────────────────────────────

export const BRAND = {
  navy: "#0C1F3F",
  navyLight: "#162D54",
  gold: "#D4A843",
  goldLight: "#E8C97A",
} as const;
