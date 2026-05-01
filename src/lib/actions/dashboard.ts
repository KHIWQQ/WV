"use server";

import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { prefetchFxRates, sumInHome } from "@/lib/currency/aggregate";
import { gatewayQuote, isRateLimitError } from "@/lib/market/gateway";
import { computeSavingsRatePct, sortMovers, type AssetMover } from "@/lib/dashboard/movers";
import type { Asset, Liability, Transaction, NetWorthHistory, Profile } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────

export interface DashboardStats {
  profile: Profile | null;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  monthlyIncome: number;
  monthlyExpense: number;
  // (income − expense) / income × 100. Returns 0 when income is 0.
  savingsRatePct: number;
}

export interface TopMoversResult {
  winners: AssetMover[];
  losers: AssetMover[];
  // Echoed back so the UI can show "no auto-tracked assets" vs "no movement"
  trackedCount: number;
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

  const [profileRes, assetsRes, liabilitiesRes, monthlyTxnRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("assets")
      .select("current_value, currency")
      .eq("user_id", user.id)
      .is("deleted_at", null),
    supabase
      .from("liabilities")
      .select("balance")
      .eq("user_id", user.id)
      .is("deleted_at", null),
    // One query covers both income and expense for the month — split client-side
    supabase
      .from("transactions")
      .select("amount, type")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .gte("date", bounds.monthStart)
      .lt("date", bounds.monthEnd)
      .in("type", ["income", "sell", "expense", "buy"]),
  ]);

  if (assetsRes.error) {
    logger.error({ err: assetsRes.error, userId: user.id }, "dashboard.stats: assets query failed");
  }
  if (liabilitiesRes.error) {
    logger.error({ err: liabilitiesRes.error, userId: user.id }, "dashboard.stats: liabilities query failed");
  }
  if (monthlyTxnRes.error) {
    logger.error({ err: monthlyTxnRes.error, userId: user.id }, "dashboard.stats: monthly txn query failed");
  }

  // Multi-currency: each asset stores values in its own currency.
  // Convert all to THB for portfolio totals using a single batched FX prefetch.
  const assets = assetsRes.data ?? [];
  const fxRates = await prefetchFxRates(assets);
  const totalAssets = sumInHome(assets, (a) => Number(a.current_value) || 0, fxRates);

  // Liabilities + transactions are assumed THB-only for MVP. If/when those
  // grow a currency field, swap to sumInHome.
  const totalLiabilities = (liabilitiesRes.data ?? []).reduce(
    (sum, l) => sum + Number(l.balance),
    0
  );

  // Split month transactions into income vs expense buckets. "sell" counts
  // as cash inflow (was income side previously); "buy" as expense outflow
  // for the savings-rate metric (the cash actually left the wallet).
  let monthlyIncome = 0;
  let monthlyExpense = 0;
  for (const t of monthlyTxnRes.data ?? []) {
    const amount = Number(t.amount) || 0;
    if (t.type === "income" || t.type === "sell") monthlyIncome += amount;
    else if (t.type === "expense" || t.type === "buy") monthlyExpense += amount;
  }

  return {
    profile: profileRes.data ?? null,
    totalAssets,
    totalLiabilities,
    netWorth: totalAssets - totalLiabilities,
    monthlyIncome,
    monthlyExpense,
    savingsRatePct: computeSavingsRatePct(monthlyIncome, monthlyExpense),
  };
}

// ─── Top Movers ────────────────────────────────────────────────────────

/**
 * Look up live quotes for every auto-update asset the user owns and return
 * the biggest gainers and losers by 24h % change. Live fetch — sync-prices
 * doesn't persist `changePercent`, so we re-fetch through the gateway
 * (which has its own 30s memory cache plus rate limit) at render time.
 *
 * One gatewayQuote() call covers all symbols and counts as one rate-limit
 * slot regardless of holding count.
 */
export async function getTopMovers(limit = 3): Promise<TopMoversResult> {
  const { supabase, user } = await requireUser();

  const { data: rows, error } = await supabase
    .from("assets")
    .select("id, name, symbol, currency, current_value, current_price")
    .eq("user_id", user.id)
    .eq("is_auto_update", true)
    .is("deleted_at", null)
    .not("symbol", "is", null);

  if (error) {
    logger.error({ err: error, userId: user.id }, "dashboard.movers: assets query failed");
    return { winners: [], losers: [], trackedCount: 0 };
  }

  const tracked = (rows ?? []).filter((r) => !!r.symbol);
  if (tracked.length === 0) {
    return { winners: [], losers: [], trackedCount: 0 };
  }

  const symbols = Array.from(new Set(tracked.map((r) => r.symbol as string)));

  let result;
  try {
    result = await gatewayQuote(symbols, { userId: user.id });
  } catch (e) {
    logger.warn({ err: e, userId: user.id }, "dashboard.movers: gateway threw");
    return { winners: [], losers: [], trackedCount: tracked.length };
  }

  if (isRateLimitError(result)) {
    logger.warn({ userId: user.id }, "dashboard.movers: gateway rate-limited");
    return { winners: [], losers: [], trackedCount: tracked.length };
  }

  const quoteMap = new Map(result.data.map((q) => [q.symbol, q]));
  const movers: AssetMover[] = tracked
    .map((r) => {
      const q = quoteMap.get(r.symbol as string);
      if (!q || !Number.isFinite(q.changePercent)) return null;
      return {
        id: r.id,
        name: r.name,
        symbol: r.symbol as string,
        currency: r.currency || "THB",
        currentValue: Number(r.current_value) || 0,
        changePercent: q.changePercent,
      };
    })
    .filter((m): m is AssetMover => m !== null);

  return { ...sortMovers(movers, limit), trackedCount: tracked.length };
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
