"use client";

import { formatTHB } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { gainLossClass } from "@/lib/utils/gain-loss";
import { TransactionItem } from "./transaction-item";
import type { TransactionGroup as TxGroup } from "@/lib/utils/period";
import type { Transaction } from "@/types";

interface TransactionGroupProps {
  group: TxGroup;
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
}

export function TransactionGroup({ group, onEdit, onDelete }: TransactionGroupProps) {
  return (
    <div>
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-xs font-medium text-muted-foreground">
          {group.label}
        </span>
        <span
          className={cn("text-xs font-medium", gainLossClass(group.total))}
        >
          {group.total >= 0 ? "+" : ""}
          {formatTHB(group.total)}
        </span>
      </div>
      <div className="space-y-0.5">
        {group.transactions.map((tx) => (
          <TransactionItem
            key={tx.id}
            transaction={tx}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}
