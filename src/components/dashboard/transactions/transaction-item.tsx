"use client";

import { Pencil, Trash2, ArrowDownLeft, ArrowUpRight, ShoppingCart, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatTHB } from "@/lib/utils/format";
import { getCategoryMeta, getTxCategoryLabel } from "@/lib/utils/constants";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils/cn";
import type { Transaction } from "@/types";

const TYPE_CONFIG = {
  income: { icon: ArrowDownLeft, color: "text-emerald-600", bg: "bg-emerald-50", sign: "+" },
  expense: { icon: ArrowUpRight, color: "text-red-600", bg: "bg-red-50", sign: "-" },
  buy: { icon: ShoppingCart, color: "text-blue-600", bg: "bg-blue-50", sign: "-" },
  sell: { icon: Banknote, color: "text-amber-600", bg: "bg-amber-50", sign: "+" },
};

interface TransactionItemProps {
  transaction: Transaction;
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
}

export function TransactionItem({ transaction, onEdit, onDelete }: TransactionItemProps) {
  const { t } = useTranslation();
  const config = TYPE_CONFIG[transaction.type];
  const Icon = config.icon;
  const meta = getCategoryMeta(transaction.category);
  const categoryLabel = getTxCategoryLabel(transaction.category, t.incomeCategories, t.expenseCategories);

  return (
    <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/50">
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: meta.color + "18" }}
      >
        <Icon className={cn("h-4 w-4", config.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium">
          {transaction.description || categoryLabel}
        </p>
        <p className="text-xs text-muted-foreground">{categoryLabel}</p>
      </div>
      <div className="flex items-center gap-1">
        <span className={cn("text-sm font-semibold", config.color)}>
          {config.sign}
          {formatTHB(transaction.amount)}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          onClick={() => onEdit(transaction)}
        >
          <Pencil className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-red-600"
          onClick={() => onDelete(transaction.id)}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
