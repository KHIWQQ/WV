"use client";

import { useState, useMemo } from "react";
import { Bell, TrendingUp, TrendingDown, Wallet, PiggyBank, CircleDot } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppStore, useNetWorth } from "@/stores/useAppStore";
import { useTranslation } from "@/lib/i18n";
import { formatTHB } from "@/lib/utils/format";

interface Notification {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

export function NotificationDropdown() {
  const { t } = useTranslation();
  const assets = useAppStore((s) => s.assets);
  const liabilities = useAppStore((s) => s.liabilities);
  const transactions = useAppStore((s) => s.transactions);
  const { totalAssets: totalAssetsVal, totalLiabilities: totalLiabilitiesVal, netWorth: netWorthVal } = useNetWorth();

  const [dismissed, setDismissed] = useState(false);

  const notifications = useMemo<Notification[]>(() => {
    const items: Notification[] = [];

    if (netWorthVal > 0) {
      items.push({
        id: "net-worth",
        icon: <TrendingUp className="h-4 w-4" />,
        title: `${t.dashboard.netWorth}: ${formatTHB(netWorthVal)}`,
        description: `${t.dashboard.totalAssets} ${formatTHB(totalAssetsVal)}`,
        color: "text-emerald-500",
      });
    }

    if (liabilities.length > 0) {
      items.push({
        id: "liabilities",
        icon: <TrendingDown className="h-4 w-4" />,
        title: `${t.liabilities.outstandingBalance}: ${formatTHB(totalLiabilitiesVal)}`,
        description: `${liabilities.length} ${t.common.items}`,
        color: "text-red-500",
      });
    }

    // Recent transaction summary
    const thisMonth = new Date();
    const monthTx = transactions.filter((tx) => {
      const d = new Date(tx.date);
      return d.getMonth() === thisMonth.getMonth() && d.getFullYear() === thisMonth.getFullYear();
    });
    const incomeThisMonth = monthTx.filter((tx) => tx.type === "income").reduce((s, tx) => s + tx.amount, 0);
    const expenseThisMonth = monthTx.filter((tx) => tx.type === "expense").reduce((s, tx) => s + tx.amount, 0);

    if (incomeThisMonth > 0 || expenseThisMonth > 0) {
      items.push({
        id: "cashflow",
        icon: <Wallet className="h-4 w-4" />,
        title: `${t.transactions.income}: ${formatTHB(incomeThisMonth)}`,
        description: `${t.transactions.expense}: ${formatTHB(expenseThisMonth)}`,
        color: "text-blue-500",
      });
    }

    if (assets.length === 0 && liabilities.length === 0 && transactions.length === 0) {
      items.push({
        id: "welcome",
        icon: <PiggyBank className="h-4 w-4" />,
        title: t.dashboard.wealthOverview,
        description: t.assets.noAssets,
        color: "text-gold",
      });
    }

    return items;
  }, [assets, liabilities, transactions, totalAssetsVal, totalLiabilitiesVal, netWorthVal, t]);

  const hasNotifications = notifications.length > 0 && !dismissed;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-white/70 hover:bg-navy-500 hover:text-white transition-colors"
        >
          <Bell className="h-5 w-5" />
          {hasNotifications && (
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-gold animate-pulse" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>{t.header.notifications}</span>
          {hasNotifications && (
            <button
              onClick={() => setDismissed(true)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              aria-label={t.header.markAllRead}
            >
              {t.header.markAllRead}
            </button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 || dismissed ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            {t.header.noNotifications}
          </div>
        ) : (
          notifications.map((n) => (
            <DropdownMenuItem key={n.id} className="flex items-start gap-3 py-3 cursor-default">
              <div className={`mt-0.5 ${n.color}`}>
                {n.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{n.title}</p>
                <p className="text-xs text-muted-foreground truncate">{n.description}</p>
              </div>
              {!dismissed && (
                <CircleDot className="h-2 w-2 mt-1.5 text-gold flex-shrink-0" />
              )}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
