"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePremium } from "@/lib/subscription/server";
import {
  salaryRecordServerSchema,
  salaryGpfServerSchema,
  salaryImportServerSchema,
} from "@/lib/validations/schemas";
import { logAudit } from "@/lib/audit";
import type {
  SalaryRecord,
  SalaryGpfSummary,
  SalaryImportResult,
} from "@/types";

const FEATURE = "salary_management" as const;

// Shared: resolve the authed user or throw. requirePremium guards the feature.
async function authedClient() {
  await requirePremium(FEATURE);
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return { supabase, user };
}

// ─── salary_records ──────────────────────────────────────────────
export async function getSalaryRecords(): Promise<SalaryRecord[]> {
  const { supabase, user } = await authedClient();

  const { data, error } = await supabase
    .from("salary_records")
    .select("*")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("period", { ascending: false })
    .order("is_backpay", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createSalaryRecord(formData: unknown) {
  const { supabase, user } = await authedClient();
  const parsed = salaryRecordServerSchema.parse(formData);

  const { data, error } = await supabase
    .from("salary_records")
    .insert({
      user_id: user.id,
      period: parsed.period,
      rank: parsed.rank || null,
      pay_step: parsed.pay_step || null,
      gross_rta: parsed.gross_rta,
      income_tiny: parsed.income_tiny,
      income_sckt: parsed.income_sckt,
      deductions: parsed.deductions,
      gov_contrib: parsed.gov_contrib,
      is_backpay: parsed.is_backpay,
      note: parsed.note || null,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  await logAudit("salary.create", "salary_record", data?.id ?? null, {
    diff: { after: parsed },
  });
  revalidatePath("/dashboard/salary");
}

export async function updateSalaryRecord(id: string, formData: unknown) {
  const { supabase, user } = await authedClient();
  const parsed = salaryRecordServerSchema.parse(formData);

  const { error } = await supabase
    .from("salary_records")
    .update({
      period: parsed.period,
      rank: parsed.rank || null,
      pay_step: parsed.pay_step || null,
      gross_rta: parsed.gross_rta,
      income_tiny: parsed.income_tiny,
      income_sckt: parsed.income_sckt,
      deductions: parsed.deductions,
      gov_contrib: parsed.gov_contrib,
      is_backpay: parsed.is_backpay,
      note: parsed.note || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .is("deleted_at", null);

  if (error) throw new Error(error.message);

  await logAudit("salary.update", "salary_record", id, {
    diff: { after: parsed },
  });
  revalidatePath("/dashboard/salary");
}

export async function deleteSalaryRecord(id: string) {
  const { supabase } = await authedClient();

  const { error } = await supabase.rpc("soft_delete_salary_record", {
    p_id: id,
  });

  if (error) throw new Error(error.message);

  await logAudit("salary.delete", "salary_record", id);
  revalidatePath("/dashboard/salary");
}

export async function importSalaryRecords(
  rows: unknown
): Promise<SalaryImportResult> {
  const { supabase, user } = await authedClient();
  const parsed = salaryImportServerSchema.parse(rows);

  // Skip periods that already have a (live, non-backpay) record so re-imports
  // are idempotent rather than creating duplicate months.
  const { data: existing, error: existingErr } = await supabase
    .from("salary_records")
    .select("period")
    .eq("user_id", user.id)
    .eq("is_backpay", false)
    .is("deleted_at", null);

  if (existingErr) throw new Error(existingErr.message);
  // `taken` guards against both already-saved months AND duplicate periods
  // within this same upload, so one CSV can't create two rows for a month.
  const taken = new Set((existing ?? []).map((r) => r.period));

  const toInsert = [];
  for (const r of parsed) {
    if (r.is_backpay || taken.has(r.period)) continue;
    taken.add(r.period);
    toInsert.push({
      user_id: user.id,
      period: r.period,
      rank: r.rank || null,
      pay_step: r.pay_step || null,
      gross_rta: r.gross_rta,
      income_tiny: r.income_tiny,
      income_sckt: r.income_sckt,
      deductions: r.deductions,
      gov_contrib: r.gov_contrib,
      is_backpay: false,
      note: r.note || null,
    });
  }

  const skipped = parsed.length - toInsert.length;
  if (toInsert.length === 0) {
    return { inserted: 0, skipped };
  }

  const { error } = await supabase.from("salary_records").insert(toInsert);
  if (error) throw new Error(error.message);

  await logAudit("salary.import", "salary_record", null, {
    diff: { inserted: toInsert.length, skipped },
  });
  revalidatePath("/dashboard/salary");
  return { inserted: toInsert.length, skipped };
}

// ─── salary_gpf_summary ──────────────────────────────────────────
export async function getSalaryGpfSummary(): Promise<SalaryGpfSummary | null> {
  const { supabase, user } = await authedClient();

  const { data, error } = await supabase
    .from("salary_gpf_summary")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ?? null;
}

export async function upsertSalaryGpfSummary(formData: unknown) {
  const { supabase, user } = await authedClient();
  const parsed = salaryGpfServerSchema.parse(formData);

  const { error } = await supabase.from("salary_gpf_summary").upsert(
    {
      user_id: user.id,
      own_principal: parsed.own_principal,
      own_gain: parsed.own_gain,
      gov_principal: parsed.gov_principal,
      gov_gain: parsed.gov_gain,
      atb_balance: parsed.atb_balance,
      as_of: parsed.as_of || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) throw new Error(error.message);

  await logAudit("salary.gpf_update", "salary_gpf_summary", user.id, {
    diff: { after: parsed },
  });
  revalidatePath("/dashboard/salary");
}
