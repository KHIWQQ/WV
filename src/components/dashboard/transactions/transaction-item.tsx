"use client";

import { Pencil, Trash2, ArrowDownLeft, ArrowUpRight, ShoppingCart, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatTHB } from "@/lib/utils/format";
import { getCategoryMeta, getTxCategoryLabel } from "@/lib/utils/constants";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils/cn";
import type { Transaction } from "@/types";

// `bg` removed: the icon background is rendered inline via meta.color + opacity
// (line 35), so the static bg-*-50 classes here were dead code AND unthemed for
// dark mode. Keep `color` for the amount text and the icon stroke.
const TYPE_CONFIG = {
  income: { icon: ArrowDownLeft, color: "text-emerald-600 dark:text-emerald-400", sign: "+" },
  expense: { icon: ArrowUpRight, color: "text-red-600 dark:text-red-400", sign: "-" },
  buy: { icon: ShoppingCart, color: "text-blue-600 dark:text-blue-400", sign: "-" },
  sell: { icon: Banknote, color: "text-amber-600 dark:text-amber-400", sign: "+" },
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
          className="h-7 w-7 text-muted-foreground hover:text-red-600 dark:hover:text-red-400"
          onClick={() => onDelete(transaction.id)}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
