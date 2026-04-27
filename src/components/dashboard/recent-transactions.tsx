"use client";

import { ArrowDownLeft, ArrowUpRight, ShoppingCart, Banknote } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTHB, formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { Transaction } from "@/types";

const TYPE_CONFIG = {
  income: {
    icon: ArrowDownLeft,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    sign: "+",
  },
  expense: {
    icon: ArrowUpRight,
    color: "text-red-500",
    bg: "bg-red-500/10",
    sign: "-",
  },
  buy: {
    icon: ShoppingCart,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    sign: "-",
  },
  sell: {
    icon: Banknote,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    sign: "+",
  },
};

interface RecentTransactionsProps {
  transactions?: Transaction[];
}

export function RecentTransactions({ transactions = [] }: RecentTransactionsProps) {
  const { t } = useTranslation();
  const recent = transactions.slice(0, 5);
  const isEmpty = recent.length === 0;

  return (
    <Card variant="glass" className="transition-all duration-300 hover:shadow-glow/50 flex flex-col h-full">
      <CardHeader>
        <CardTitle className="text-lg font-bold bg-clip-text">{t.dashboard.recentTransactions}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-center">
        {isEmpty ? (
          <div className="flex h-full items-center justify-center text-muted-foreground/70 font-medium min-h-[200px]">
            {t.dashboard.noTransactions}
          </div>
        ) : (
          <div className="space-y-3">
            {recent.map((tx) => {
              const config = TYPE_CONFIG[tx.type];
              const Icon = config.icon;
              return (
                <div key={tx.id} className="group flex items-center gap-4 rounded-xl p-3 transition-colors duration-200 hover:bg-muted/50 border border-transparent hover:border-border/50">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl shadow-sm transition-transform group-hover:scale-110",
                      config.bg
                    )}
                  >
                    <Icon className={cn("h-5 w-5", config.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground/90 group-hover:text-foreground transition-colors">
                      {tx.description || tx.category}
                    </p>
                    <p className="text-xs font-medium text-muted-foreground mt-0.5">
                      {tx.category} <span className="mx-1 opacity-50">•</span> {formatDate(tx.date)}
                    </p>
                  </div>
                  <span
                    className={cn("text-sm font-bold tracking-tight", config.color)}
                  >
                    {config.sign}
                    {formatTHB(tx.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
