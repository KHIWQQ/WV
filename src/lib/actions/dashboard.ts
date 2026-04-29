"use server";

import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import type { Asset, Liability, Transaction, NetWorthHistory, Profile } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────

export interface DashboardStats {
  profile: Profile | null;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  monthlyIncome: number;
}

/** @deprecated Prefer the focused server actions below — kept for backwards compat */
export interface DashboardData extends DashboardStats {
  assets: Asset[];
  liabilities: Liability[];
  transactions: Transaction[];
  netWorthHistory: NetWorthHistory[];
}

// ─── Helpers ──────────────────────────────────────────────────────────

function currentMonthBounds() {
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const monthEnd = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}-01`;
  return { monthStart, monthEnd };
}

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return { supabase, user };
}

// ─── Focused fetchers (used by Suspense boundaries) ───────────────────

/**
 * Cheapest query — totals only. Renders first in the dashboard.
 * Sums are computed server-side via two narrow column reads + one filtered txn read.
 */
export async function getDashboardStats(
  monthStart?: string,
  monthEnd?: string
): Promise<DashboardStats> {
  const { supabase, user } = await requireUser();
  const bounds = monthStart && monthEnd ? { monthStart, monthEnd } : currentMonthBounds();

  const [profileRes, assetsRes, liabilitiesRes, monthlyIncomeRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("assets")
      .select("current_value")
      .eq("user_id", user.id)
      .is("deleted_at", null),
    supabase
      .from("liabilities")
      .select("balance")
      .eq("user_id", user.id)
      .is("deleted_at", null),
    supabase
      .from("transactions")
      .select("amount")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .gte("date", bounds.monthStart)
      .lt("date", bounds.monthEnd)
      .in("type", ["income", "sell"]),
  ]);

  if (assetsRes.error) {
    logger.error({ err: assetsRes.error, userId: user.id }, "dashboard.stats: assets query failed");
  }
  if (liabilitiesRes.error) {
    logger.error({ err: liabilitiesRes.error, userId: user.id }, "dashboard.stats: liabilities query failed");
  }
  if (monthlyIncomeRes.error) {
    logger.error({ err: monthlyIncomeRes.error, userId: user.id }, "dashboard.stats: income query failed");
  }

  const totalAssets = (assetsRes.data ?? []).reduce((sum, a) => sum + Number(a.current_value), 0);
  const totalLiabilities = (liabilitiesRes.data ?? []).reduce(
    (sum, l) => sum + Number(l.balance),
    0
  );
  const monthlyIncome = (monthlyIncomeRes.data ?? []).reduce(
    (sum, t) => sum + Number(t.amount),
    0
  );

  return {
    profile: profileRes.data ?? null,
    totalAssets,
    totalLiabilities,
    netWorth: totalAssets - totalLiabilities,
    monthlyIncome,
  };
}

/** Net worth history for the last 12 entries (used by NetWorthChart). */
export async function getNetWorthHistory(): Promise<NetWorthHistory[]> {
  const { supabase, user } = await requireUser();

  const { data, error } = await supabase
    .from("net_worth_history")
    .select("*")
    .eq("user_id", user.id)
    .order("recorded_at", { ascending: true })
    .limit(12);

  if (error) {
    logger.error({ err: error, userId: user.id }, "dashboard.history: query failed");
    return [];
  }
  return data ?? [];
}

/** Full assets list — used by AssetAllocationChart + AssetWorldMap. */
export async function getDashboardAssets(): Promise<Asset[]> {
  const { supabase, user } = await requireUser();

  const { data, error } = await supabase
    .from("assets")
    .select(
      "id, user_id, category, name, symbol, quantity, cost_basis, current_price, current_value, currency, country_code, is_auto_update, notes, created_at, updated_at"
    )
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("current_value", { ascending: false });

  if (error) {
    logger.error({ err: error, userId: user.id }, "dashboard.assets: query failed");
    return [];
  }
  return (data ?? []) as Asset[];
}

/** Recent transactions — used by RecentTransactions widget + MonthlyCashflowChart. */
export async function getRecentTransactions(limit = 50): Promise<Transaction[]> {
  const { supabase, user } = await requireUser();

  const { data, error } = await supabase
    .from("transactions")
    .select("id, user_id, type, category, amount, description, date, created_at, updated_at")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    logger.error({ err: error, userId: user.id }, "dashboard.transactions: query failed");
    return [];
  }
  return (data ?? []) as Transaction[];
}

// ─── Legacy aggregate fetcher ─────────────────────────────────────────

/**
 * @deprecated Use `getDashboardStats`, `getNetWorthHistory`, `getDashboardAssets`,
 * and `getRecentTransactions` separately so each can stream into its own
 * Suspense boundary. Kept here to avoid breaking call sites that still
 * import it; will be removed once all consumers migrate.
 */
export async function getDashboardData(
  monthStart?: string,
  monthEnd?: string
): Promise<DashboardData> {
  const [stats, history, assets, transactions, liabilities] = await Promise.all([
    getDashboardStats(monthStart, monthEnd),
    getNetWorthHistory(),
    getDashboardAssets(),
    getRecentTransactions(50),
    (async () => {
      const { supabase, user } = await requireUser();
      const { data, error } = await supabase
        .from("liabilities")
        .select(
          "id, user_id, name, type, principal, balance, interest_rate, monthly_payment, start_date, end_date, notes, created_at, updated_at"
        )
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (error) {
        logger.error({ err: error, userId: user.id }, "dashboard.legacy: liabilities query failed");
        return [] as Liability[];
      }
      return (data ?? []) as Liability[];
    })(),
  ]);

  return {
    ...stats,
    assets,
    liabilities,
    transactions,
    netWorthHistory: history,
  };
}
