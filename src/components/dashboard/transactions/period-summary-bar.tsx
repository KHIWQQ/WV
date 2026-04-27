"use client";

import { ArrowDownLeft, ArrowUpRight, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatTHB } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { useTranslation } from "@/lib/i18n";

interface PeriodSummaryBarProps {
  totalIncome: number;
  totalExpense: number;
  net: number;
  isLoading?: boolean;
}

export function PeriodSummaryBar({
  totalIncome,
  totalExpense,
  net,
  isLoading,
}: PeriodSummaryBarProps) {
  const { t } = useTranslation();
  const items = [
    {
      label: t.transactions.income,
      value: totalIncome,
      icon: ArrowDownLeft,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: t.transactions.expense,
      value: totalExpense,
      icon: ArrowUpRight,
      color: "text-red-600",
      bg: "bg-red-50",
    },
    {
      label: t.transactions.balance,
      value: net,
      icon: Wallet,
      color: net >= 0 ? "text-emerald-600" : "text-red-600",
      bg: net >= 0 ? "bg-emerald-50" : "bg-red-50",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                  item.bg
                )}
              >
                <Icon className={cn("h-4 w-4", item.color)} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p
                  className={cn(
                    "truncate text-sm font-semibold",
                    isLoading && "animate-pulse",
                    item.color
                  )}
                >
                  {isLoading ? "..." : formatTHB(item.value)}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
