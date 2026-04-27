"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAssets, createAsset, updateAsset, deleteAsset } from "@/lib/actions/assets";
import { toast } from "@/hooks/useToast";
import { useTranslation } from "@/lib/i18n";

export function useAssets() {
  return useQuery({
    queryKey: ["assets"],
    queryFn: () => getAssets(),
  });
}

export function useCreateAsset() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (data: unknown) => createAsset(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast({ title: t.assets.added });
    },
    onError: () => {
      toast({ title: t.common.error, description: t.assets.addError, variant: "destructive" });
    },
  });
}

export function useUpdateAsset() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) => updateAsset(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast({ title: t.assets.edited });
    },
    onError: () => {
      toast({ title: t.common.error, description: t.assets.editError, variant: "destructive" });
    },
  });
}

export function useDeleteAsset() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (id: string) => deleteAsset(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast({ title: t.assets.deleted });
    },
    onError: () => {
      toast({ title: t.common.error, description: t.assets.deleteError, variant: "destructive" });
    },
  });
}
