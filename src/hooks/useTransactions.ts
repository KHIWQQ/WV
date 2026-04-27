"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTransactions,
  getTransactionSummary,
  getMonthlyTrend,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from "@/lib/actions/transactions";
import { toast } from "@/hooks/useToast";
import { useTranslation } from "@/lib/i18n";
import type { GetTransactionsParams } from "@/types";

const INVALIDATION_KEYS = [
  ["transactions"],
  ["transaction-summary"],
  ["monthly-trend"],
  ["dashboard"],
];

function invalidateAll(queryClient: ReturnType<typeof useQueryClient>) {
  for (const key of INVALIDATION_KEYS) {
    queryClient.invalidateQueries({ queryKey: key });
  }
}

export function useTransactions(params: GetTransactionsParams = {}) {
  return useQuery({
    queryKey: ["transactions", params],
    queryFn: () => getTransactions(params),
  });
}

export function useTransactionSummary(dateFrom?: string, dateTo?: string) {
  return useQuery({
    queryKey: ["transaction-summary", dateFrom, dateTo],
    queryFn: () => getTransactionSummary(dateFrom!, dateTo!),
    enabled: !!dateFrom && !!dateTo,
  });
}

export function useMonthlyTrend(months = 12) {
  return useQuery({
    queryKey: ["monthly-trend", months],
    queryFn: () => getMonthlyTrend(months),
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (data: unknown) => createTransaction(data),
    onSuccess: () => {
      invalidateAll(queryClient);
      toast({ title: t.transactions.added });
    },
    onError: () => {
      toast({
        title: t.common.error,
        description: t.transactions.addError,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) =>
      updateTransaction(id, data),
    onSuccess: () => {
      invalidateAll(queryClient);
      toast({ title: t.transactions.edited });
    },
    onError: () => {
      toast({
        title: t.common.error,
        description: t.transactions.editError,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (id: string) => deleteTransaction(id),
    onSuccess: () => {
      invalidateAll(queryClient);
      toast({ title: t.transactions.deleted });
    },
    onError: () => {
      toast({
        title: t.common.error,
        description: t.transactions.deleteError,
        variant: "destructive",
      });
    },
  });
}
