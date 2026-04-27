"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TransactionGroup } from "./transaction-group";
import { groupTransactionsByDate } from "@/lib/utils/period";
import type { Transaction, PaginatedTransactions } from "@/types";
import { useTranslation } from "@/lib/i18n";

interface TransactionListProps {
  data: PaginatedTransactions | undefined;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
}

export function TransactionList({
  data,
  isLoading,
  onPageChange,
  onEdit,
  onDelete,
}: TransactionListProps) {
  const { t } = useTranslation();
  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center text-muted-foreground">
        {t.common.loading}
      </div>
    );
  }

  if (!data || data.data.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-muted-foreground">
        {t.transactions.noTransactions}
      </div>
    );
  }

  const groups = groupTransactionsByDate(data.data);
  const totalPages = Math.ceil(data.total / data.pageSize);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {groups.map((group) => (
          <TransactionGroup
            key={group.date}
            group={group}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t pt-3">
          <p className="text-xs text-muted-foreground">
            {data.total} {t.common.items} · {t.common.page} {data.page}/{totalPages}
          </p>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={data.page <= 1}
              onClick={() => onPageChange(data.page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!data.hasMore}
              onClick={() => onPageChange(data.page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
