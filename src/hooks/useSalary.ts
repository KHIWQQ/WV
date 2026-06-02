"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSalaryRecords,
  createSalaryRecord,
  updateSalaryRecord,
  deleteSalaryRecord,
  importSalaryRecords,
  getSalaryGpfSummary,
  upsertSalaryGpfSummary,
} from "@/lib/actions/salary";
import { toast } from "@/hooks/useToast";
import { useTranslation } from "@/lib/i18n";

export function useSalaryRecords() {
  return useQuery({
    queryKey: ["salary-records"],
    queryFn: () => getSalaryRecords(),
  });
}

export function useSalaryGpf() {
  return useQuery({
    queryKey: ["salary-gpf"],
    queryFn: () => getSalaryGpfSummary(),
  });
}

export function useCreateSalaryRecord() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (data: unknown) => createSalaryRecord(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salary-records"] });
      toast({ title: t.salary.added });
    },
    onError: () => {
      toast({ title: t.common.error, description: t.salary.addError, variant: "destructive" });
    },
  });
}

export function useUpdateSalaryRecord() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) => updateSalaryRecord(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salary-records"] });
      toast({ title: t.salary.edited });
    },
    onError: () => {
      toast({ title: t.common.error, description: t.salary.editError, variant: "destructive" });
    },
  });
}

export function useDeleteSalaryRecord() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (id: string) => deleteSalaryRecord(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salary-records"] });
      toast({ title: t.salary.deleted });
    },
    onError: () => {
      toast({ title: t.common.error, description: t.salary.deleteError, variant: "destructive" });
    },
  });
}

export function useImportSalaryRecords() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (rows: unknown) => importSalaryRecords(rows),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["salary-records"] });
      toast({
        title: t.salary.importDone,
        description: `+${result.inserted} · ${result.skipped} skipped`,
      });
    },
    onError: () => {
      toast({ title: t.common.error, description: t.salary.importError, variant: "destructive" });
    },
  });
}

export function useUpsertSalaryGpf() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (data: unknown) => upsertSalaryGpfSummary(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salary-gpf"] });
      toast({ title: t.salary.gpfSaved });
    },
    onError: () => {
      toast({ title: t.common.error, description: t.salary.gpfSaveError, variant: "destructive" });
    },
  });
}
