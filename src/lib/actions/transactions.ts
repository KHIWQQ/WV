"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { transactionServerSchema } from "@/lib/validations/schemas";
import { getUserTier } from "@/lib/subscription/server";
import { logAudit } from "@/lib/audit";
import type {
  GetTransactionsParams,
  PaginatedTransactions,
  TransactionSummary,
  MonthlyTrendPoint,
} from "@/types";

const FREE_TIER_TREND_MONTHS_MAX = 12;
const PREMIUM_TIER_TREND_MONTHS_MAX = 60;

// ──────────────────────────────
// Get Transactions (with filter, search, pagination)
// ──────────────────────────────

export async function getTransactions(
  params: GetTransactionsParams = {}
): Promise<PaginatedTransactions> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const {
    dateFrom,
    dateTo,
    type,
    category,
    search,
    page = 1,
    pageSize = 20,
  } = params;

  let query = supabase
    .from("transactions")
    .select("*", { count: "exact" })
    .eq("user_id", user.id)
    .is("deleted_at", null);

  if (dateFrom) query = query.gte("date", dateFrom);
  if (dateTo) query = query.lte("date", dateTo);
  if (type) query = query.eq("type", type);
  if (category) query = query.eq("category", category);
  if (search) {
    // Sanitize: strip PostgREST filter metacharacters and escape LIKE wildcards
    const sanitized = search
      .replace(/[,.()*\\;~?@&\n\r]/g, "")
      .replace(/%/g, "")
      .replace(/_/g, "\\_")
      .trim()
      .slice(0, 200);
    if (sanitized) {
      query = query.or(
        `description.ilike.%${sanitized}%,category.ilike.%${sanitized}%`
      );
    }
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw new Error(error.message);

  const total = count ?? 0;
  return {
    data: data ?? [],
    total,
    page,
    pageSize,
    hasMore: from + pageSize < total,
  };
}

// ──────────────────────────────
// Get Transaction Summary (aggregate)
// ──────────────────────────────

export async function getTransactionSummary(
  dateFrom: string,
  dateTo: string
): Promise<TransactionSummary> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("transactions")
    .select("type, category, amount")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .gte("date", dateFrom)
    .lte("date", dateTo);

  if (error) throw new Error(error.message);

  let totalIncome = 0;
  let totalExpense = 0;
  const incomeCategoryMap = new Map<string, { amount: number; count: number }>();
  const expenseCategoryMap = new Map<string, { amount: number; count: number }>();

  for (const tx of data || []) {
    if (tx.type === "income") {
      totalIncome += tx.amount;
      const cat = incomeCategoryMap.get(tx.category) || { amount: 0, count: 0 };
      cat.amount += tx.amount;
      cat.count += 1;
      incomeCategoryMap.set(tx.category, cat);
    } else if (tx.type === "expense") {
      totalExpense += tx.amount;
      const cat = expenseCategoryMap.get(tx.category) || { amount: 0, count: 0 };
      cat.amount += tx.amount;
      cat.count += 1;
      expenseCategoryMap.set(tx.category, cat);
    }
  }

  const incomeByCategory = Array.from(incomeCategoryMap.entries())
    .map(([category, stats]) => ({
      category,
      amount: stats.amount,
      count: stats.count,
      percent: totalIncome > 0 ? (stats.amount / totalIncome) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const expenseByCategory = Array.from(expenseCategoryMap.entries())
    .map(([category, stats]) => ({
      category,
      amount: stats.amount,
      count: stats.count,
      percent: totalExpense > 0 ? (stats.amount / totalExpense) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  return {
    totalIncome,
    totalExpense,
    net: totalIncome - totalExpense,
    incomeByCategory,
    expenseByCategory,
  };
}

// ──────────────────────────────
// Monthly Trend (last N months)
// ──────────────────────────────

export async function getMonthlyTrend(
  months = 12
): Promise<MonthlyTrendPoint[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const tier = await getUserTier();
  const cap = tier === "premium" ? PREMIUM_TIER_TREND_MONTHS_MAX : FREE_TIER_TREND_MONTHS_MAX;
  const effectiveMonths = Math.min(Math.max(months, 1), cap);

  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - effectiveMonths + 1, 1);
  const dateFrom = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, "0")}-01`;

  const { data, error } = await supabase
    .from("transactions")
    .select("type, amount, date")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .gte("date", dateFrom);

  if (error) throw new Error(error.message);

  const THAI_MONTHS_SHORT = [
    "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.",
    "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.",
    "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
  ];

  // Build empty month buckets
  const points: MonthlyTrendPoint[] = [];
  for (let i = 0; i < effectiveMonths; i++) {
    const d = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    points.push({
      month: key,
      label: `${THAI_MONTHS_SHORT[d.getMonth()]} ${d.getFullYear() + 543}`,
      income: 0,
      expense: 0,
      net: 0,
    });
  }

  const pointMap = new Map(points.map((p) => [p.month, p]));

  for (const tx of data || []) {
    if (tx.type !== "income" && tx.type !== "expense") continue;
    
    // date is 'YYYY-MM-DDT...' or 'YYYY-MM-DD'
    const monthKey = tx.date.substring(0, 7);
    const point = pointMap.get(monthKey);
    if (point) {
      if (tx.type === "income") point.income += tx.amount;
      if (tx.type === "expense") point.expense += tx.amount;
    }
  }

  for (const p of points) {
    p.net = p.income - p.expense;
  }

  return points;
}

// ──────────────────────────────
// Create Transaction
// ──────────────────────────────

export async function createTransaction(formData: unknown) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const parsed = transactionServerSchema.parse(formData);

  const { data, error } = await supabase.from("transactions").insert({
    user_id: user.id,
    type: parsed.type,
    category: parsed.category,
    amount: parsed.amount,
    description: parsed.description || null,
    date: parsed.date,
  }).select("id").single();

  if (error) throw new Error(error.message);

  await logAudit("transaction.create", "transaction", data?.id ?? null, { diff: { after: parsed } });
  revalidatePath("/dashboard/transactions");
  revalidatePath("/dashboard");
}

// ──────────────────────────────
// Update Transaction
// ──────────────────────────────

export async function updateTransaction(id: string, formData: unknown) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const parsed = transactionServerSchema.parse(formData);

  const { error } = await supabase
    .from("transactions")
    .update({
      type: parsed.type,
      category: parsed.category,
      amount: parsed.amount,
      description: parsed.description || null,
      date: parsed.date,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .is("deleted_at", null);

  if (error) throw new Error(error.message);

  await logAudit("transaction.update", "transaction", id, { diff: { after: parsed } });
  revalidatePath("/dashboard/transactions");
  revalidatePath("/dashboard");
}

// ──────────────────────────────
// Delete Transaction
// ──────────────────────────────

export async function deleteTransaction(id: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase.rpc("soft_delete_transaction", { p_id: id });

  if (error) throw new Error(error.message);

  await logAudit("transaction.delete", "transaction", id);
  revalidatePath("/dashboard/transactions");
  revalidatePath("/dashboard");
}
