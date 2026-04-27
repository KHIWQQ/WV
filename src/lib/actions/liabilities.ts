"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { liabilityServerSchema } from "@/lib/validations/schemas";
import { logAudit } from "@/lib/audit";
import type { Liability } from "@/types";

export async function getLiabilities(): Promise<Liability[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("liabilities")
    .select("*")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createLiability(formData: unknown) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const parsed = liabilityServerSchema.parse(formData);

  const { data, error } = await supabase.from("liabilities").insert({
    user_id: user.id,
    name: parsed.name,
    type: parsed.type,
    principal: parsed.principal,
    balance: parsed.balance,
    interest_rate: parsed.interest_rate,
    monthly_payment: parsed.monthly_payment,
    start_date: parsed.start_date,
    end_date: parsed.end_date || null,
    notes: parsed.notes || null,
  }).select("id").single();

  if (error) throw new Error(error.message);

  await logAudit("liability.create", "liability", data?.id ?? null, { diff: { after: parsed } });
  revalidatePath("/dashboard");
}

export async function updateLiability(id: string, formData: unknown) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const parsed = liabilityServerSchema.parse(formData);

  const { error } = await supabase
    .from("liabilities")
    .update({
      name: parsed.name,
      type: parsed.type,
      principal: parsed.principal,
      balance: parsed.balance,
      interest_rate: parsed.interest_rate,
      monthly_payment: parsed.monthly_payment,
      start_date: parsed.start_date,
      end_date: parsed.end_date || null,
      notes: parsed.notes || null,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .is("deleted_at", null);

  if (error) throw new Error(error.message);

  await logAudit("liability.update", "liability", id, { diff: { after: parsed } });
  revalidatePath("/dashboard");
}

export async function deleteLiability(id: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase.rpc("soft_delete_liability", { p_id: id });

  if (error) throw new Error(error.message);

  await logAudit("liability.delete", "liability", id);
  revalidatePath("/dashboard");
}
