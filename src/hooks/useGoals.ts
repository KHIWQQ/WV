"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getGoals, createGoal, updateGoal, deleteGoal, type GoalInput } from "@/lib/actions/goals";
import { toast } from "@/hooks/useToast";
import { useTranslation } from "@/lib/i18n";

export function useGoals() {
  return useQuery({ queryKey: ["goals"], queryFn: () => getGoals() });
}

export function useCreateGoal() {
  const qc = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (input: GoalInput) => createGoal(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["goals"] });
      toast({ title: t.goals.added });
    },
    onError: () => toast({ title: t.common.error, variant: "destructive" }),
  });
}

export function useUpdateGoal() {
  const qc = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: GoalInput }) => updateGoal(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["goals"] });
      toast({ title: t.goals.edited });
    },
    onError: () => toast({ title: t.common.error, variant: "destructive" }),
  });
}

export function useDeleteGoal() {
  const qc = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (id: string) => deleteGoal(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["goals"] });
      toast({ title: t.goals.deleted });
    },
    onError: () => toast({ title: t.common.error, variant: "destructive" }),
  });
}
