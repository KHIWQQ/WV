export type { Asset, AssetFormData } from "./asset";
export type { Liability, LiabilityFormData } from "./liability";
export type { Goal } from "./goal";
export type {
  SalaryRecord,
  SalaryRecordFormData,
  SalaryGpfSummary,
  SalaryGpfFormData,
  SalaryBreakdownItem,
  SalaryTrendPoint,
  SalarySummary,
  SalaryImportResult,
} from "./salary";
export type {
  Transaction,
  TransactionFormData,
  PeriodView,
  PeriodState,
  CategoryStat,
  TransactionSummary,
  GetTransactionsParams,
  PaginatedTransactions,
  MonthlyTrendPoint,
  DailySpendPoint,
} from "./transaction";

export type {
  MarketQuote,
  MarketSearchResult,
  PriceHistoryPoint,
  AssetType,
  TimeRange,
} from "@/lib/market/providers/types";

export type AppRole = 'superadmin' | 'admin' | 'sale' | 'user' | 'cto' | 'cfo' | 'ceo' | 'cio';

export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  currency: string;
  subscription_tier: 'free' | 'premium';
  role: AppRole;
  created_at: string;
}

export interface NetWorthHistory {
  id: string;
  user_id: string;
  total_assets: number;
  total_liabilities: number;
  net_worth: number;
  asset_breakdown: Record<string, number>;
  recorded_at: string;
}
