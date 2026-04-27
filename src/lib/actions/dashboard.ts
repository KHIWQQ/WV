"use server";

import { createClient } from "@/lib/supabase/server";
import type { Asset, Liability, Transaction, NetWorthHistory, Profile } from "@/types";

export interface DashboardData {
  profile: Profile | null;
  assets: Asset[];
  liabilities: Liability[];
  transactions: Transaction[];
  netWorthHistory: NetWorthHistory[];
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  monthlyIncome: number;
}

export async function getDashboardData(
  monthStart?: string,
  monthEnd?: string
): Promise<DashboardData> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Fallback to server time if client didn't provide dates (safety net)
  if (!monthStart || !monthEnd) {
    const now = new Date();
    monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    monthEnd = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}-01`;
  }

  const [profileRes, assetsRes, liabilitiesRes, transactionsRes, historyRes, monthlyIncomeRes] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single(),
      supabase
        .from("assets")
        .select("id, user_id, category, name, symbol, quantity, cost_basis, current_price, current_value, currency, country_code, is_auto_update, notes, created_at, updated_at")
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false }),
      supabase
        .from("liabilities")
        .select("id, user_id, name, type, principal, balance, interest_rate, monthly_payment, start_date, end_date, notes, created_at, updated_at")
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false }),
      supabase
        .from("transactions")
        .select("id, user_id, type, category, amount, description, date, created_at, updated_at")
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .order("date", { ascending: false })
        .limit(50),
      supabase
        .from("net_worth_history")
        .select("*")
        .eq("user_id", user.id)
        .order("recorded_at", { ascending: true })
        .limit(12),
      // Separate query for monthly income — not limited by the 50-row cap
      supabase
        .from("transactions")
        .select("amount")
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .gte("date", monthStart)
        .lt("date", monthEnd)
        .in("type", ["income", "sell"]),
    ]);

  const profile: Profile | null = profileRes.data ?? null;
  const assets: Asset[] = assetsRes.data ?? [];
  const liabilities: Liability[] = liabilitiesRes.data ?? [];
  const transactions: Transaction[] = transactionsRes.data ?? [];
  const netWorthHistory: NetWorthHistory[] = historyRes.data ?? [];

  const totalAssets = assets.reduce((sum, a) => sum + a.current_value, 0);
  const totalLiabilities = liabilities.reduce((sum, l) => sum + l.balance, 0);
  const netWorth = totalAssets - totalLiabilities;

  const monthlyIncome = (monthlyIncomeRes.data ?? []).reduce(
    (sum, t) => sum + t.amount,
    0
  );

  return {
    profile,
    assets,
    liabilities,
    transactions,
    netWorthHistory,
    totalAssets,
    totalLiabilities,
    netWorth,
    monthlyIncome,
  };
}
