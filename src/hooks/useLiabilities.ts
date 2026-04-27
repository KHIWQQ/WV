"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getLiabilities, createLiability, updateLiability, deleteLiability } from "@/lib/actions/liabilities";
import { toast } from "@/hooks/useToast";
import { useTranslation } from "@/lib/i18n";

export function useLiabilities() {
  return useQuery({
    queryKey: ["liabilities"],
    queryFn: () => getLiabilities(),
  });
}

export function useCreateLiability() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (data: unknown) => createLiability(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["liabilities"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast({ title: t.liabilities.added });
    },
    onError: () => {
      toast({ title: t.common.error, description: t.liabilities.addError, variant: "destructive" });
    },
  });
}

export function useUpdateLiability() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) => updateLiability(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["liabilities"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast({ title: t.liabilities.edited });
    },
    onError: () => {
      toast({ title: t.common.error, description: t.liabilities.editError, variant: "destructive" });
    },
  });
}

export function useDeleteLiability() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (id: string) => deleteLiability(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["liabilities"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast({ title: t.liabilities.deleted });
    },
    onError: () => {
      toast({ title: t.common.error, description: t.liabilities.deleteError, variant: "destructive" });
    },
  });
}
