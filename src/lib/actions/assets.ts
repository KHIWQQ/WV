"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assetServerSchema } from "@/lib/validations/schemas";
import { logAudit } from "@/lib/audit";
import type { Asset } from "@/types";

export async function getAssets(): Promise<Asset[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("assets")
    .select("*")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createAsset(formData: unknown) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const parsed = assetServerSchema.parse(formData);

  const { data, error } = await supabase.from("assets").insert({
    user_id: user.id,
    category: parsed.category,
    name: parsed.name,
    symbol: parsed.symbol || null,
    quantity: parsed.quantity,
    cost_basis: parsed.cost_basis,
    current_price: parsed.current_price,
    current_value: parsed.current_value,
    currency: parsed.currency || "THB",
    country_code: parsed.country_code || "TH",
    is_auto_update: parsed.is_auto_update ?? false,
    notes: parsed.notes || null,
  }).select("id").single();

  if (error) throw new Error(error.message);

  await logAudit("asset.create", "asset", data?.id ?? null, { diff: { after: parsed } });
  revalidatePath("/dashboard");
}

export async function updateAsset(id: string, formData: unknown) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const parsed = assetServerSchema.parse(formData);

  const { error } = await supabase
    .from("assets")
    .update({
      category: parsed.category,
      name: parsed.name,
      symbol: parsed.symbol || null,
      quantity: parsed.quantity,
      cost_basis: parsed.cost_basis,
      current_price: parsed.current_price,
      current_value: parsed.current_value,
      currency: parsed.currency || "THB",
      country_code: parsed.country_code || "TH",
      is_auto_update: parsed.is_auto_update ?? false,
      notes: parsed.notes || null,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .is("deleted_at", null);

  if (error) throw new Error(error.message);

  await logAudit("asset.update", "asset", id, { diff: { after: parsed } });
  revalidatePath("/dashboard");
}

export async function deleteAsset(id: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase.rpc("soft_delete_asset", { p_id: id });

  if (error) throw new Error(error.message);

  await logAudit("asset.delete", "asset", id);
  revalidatePath("/dashboard");
}
