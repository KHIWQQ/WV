"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { logger } from "@/lib/logger";

export const GOAL_TYPES = [
  "house",
  "car",
  "education",
  "emergency_fund",
  "retirement",
  "other",
] as const;
export type GoalType = (typeof GOAL_TYPES)[number];

export interface Goal {
  id: string;
  user_id: string;
  name: string;
  goal_type: GoalType;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  monthly_contribution: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const goalSchema = z.object({
  name: z.string().min(1).max(120).trim(),
  goal_type: z.enum(GOAL_TYPES),
  target_amount: z.coerce.number().min(0),
  current_amount: z.coerce.number().min(0).optional().default(0),
  target_date: z.string().optional().nullable(),
  monthly_contribution: z.coerce.number().min(0).optional().default(0),
  notes: z.string().optional().nullable(),
});

export type GoalInput = z.infer<typeof goalSchema>;

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return { supabase, user };
}

export async function getGoals(): Promise<Goal[]> {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) {
    logger.error({ err: error, userId: user.id }, "goals.list: query failed");
    return [];
  }
  return (data ?? []) as Goal[];
}

export async function createGoal(input: GoalInput): Promise<Goal> {
  const { supabase, user } = await requireUser();
  const parsed = goalSchema.parse(input);

  const { data, error } = await supabase
    .from("goals")
    .insert({
      user_id: user.id,
      name: parsed.name,
      goal_type: parsed.goal_type,
      target_amount: parsed.target_amount,
      current_amount: parsed.current_amount ?? 0,
      target_date: parsed.target_date || null,
      monthly_contribution: parsed.monthly_contribution ?? 0,
      notes: parsed.notes || null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  await logAudit("goal.create", "goal", data.id, { diff: { name: parsed.name, target_amount: parsed.target_amount } });
  revalidatePath("/dashboard/goals");
  revalidatePath("/dashboard");
  return data as Goal;
}

export async function updateGoal(id: string, input: GoalInput): Promise<Goal> {
  const { supabase, user } = await requireUser();
  const parsed = goalSchema.parse(input);

  const { data, error } = await supabase
    .from("goals")
    .update({
      name: parsed.name,
      goal_type: parsed.goal_type,
      target_amount: parsed.target_amount,
      current_amount: parsed.current_amount ?? 0,
      target_date: parsed.target_date || null,
      monthly_contribution: parsed.monthly_contribution ?? 0,
      notes: parsed.notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  await logAudit("goal.update", "goal", id, { diff: parsed as unknown as Record<string, unknown> });
  revalidatePath("/dashboard/goals");
  revalidatePath("/dashboard");
  return data as Goal;
}

export async function deleteGoal(id: string): Promise<void> {
  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("soft_delete_goal", { p_id: id });
  if (error) throw new Error(error.message);
  await logAudit("goal.delete", "goal", id, {});
  revalidatePath("/dashboard/goals");
  revalidatePath("/dashboard");
}
