import type { TransactionType } from "@/lib/utils/constants";

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  category: string;
  amount: number;
  description: string | null;
  date: string;
  created_at: string;
  updated_at: string;
}

export interface TransactionFormData {
  type: TransactionType;
  category: string;
  amount: number;
  description?: string;
  date: string;
}

// ──────────────────────────────
// Period / View Types
// ──────────────────────────────

export type PeriodView = "daily" | "monthly" | "yearly";

export interface PeriodState {
  view: PeriodView;
  year: number;
  month: number;
  day: number;
}

// ──────────────────────────────
// Analytics Types
// ──────────────────────────────

export interface CategoryStat {
  category: string;
  amount: number;
  percent: number;
  count: number;
}

export interface TransactionSummary {
  totalIncome: number;
  totalExpense: number;
  net: number;
  incomeByCategory: CategoryStat[];
  expenseByCategory: CategoryStat[];
}

// ──────────────────────────────
// Query Params
// ──────────────────────────────

export interface GetTransactionsParams {
  dateFrom?: string;
  dateTo?: string;
  type?: string;
  category?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedTransactions {
  data: Transaction[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ──────────────────────────────
// Chart Data Types
// ──────────────────────────────

export interface MonthlyTrendPoint {
  month: string;
  label: string;
  income: number;
  expense: number;
  net: number;
}

export interface DailySpendPoint {
  date: string;
  label: string;
  amount: number;
}
