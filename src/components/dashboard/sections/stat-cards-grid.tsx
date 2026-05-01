"use client";

import { Wallet, CreditCard, TrendingUp, ArrowLeftRight, PiggyBank } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { formatTHB, formatPercent } from "@/lib/utils/format";
import { useTranslation } from "@/lib/i18n";
import { savingsRateTone } from "@/lib/dashboard/movers";
import type { DashboardStats } from "@/lib/actions/dashboard";

interface Props {
  stats: DashboardStats;
}

export function StatCardsGrid({ stats }: Props) {
  const { t } = useTranslation();
  const tone = savingsRateTone(stats.savingsRatePct);

  return (
    // 5-up on desktop, 2-up on tablet, 1-up on phone — keeps the savings rate
    // card from getting orphaned on its own row.
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <StatCard
        title={t.dashboard.netWorth}
        value={formatTHB(stats.netWorth)}
        changeType="neutral"
        icon={TrendingUp}
        iconColor="text-navy dark:text-navy-200"
      />
      <StatCard
        title={t.dashboard.totalAssets}
        value={formatTHB(stats.totalAssets)}
        changeType="neutral"
        icon={Wallet}
        iconColor="text-emerald-600 dark:text-emerald-400"
      />
      <StatCard
        title={t.dashboard.totalLiabilities}
        value={formatTHB(stats.totalLiabilities)}
        changeType="neutral"
        icon={CreditCard}
        iconColor="text-red-600 dark:text-red-400"
      />
      <StatCard
        title={t.dashboard.thisMonthIncome}
        value={formatTHB(stats.monthlyIncome)}
        changeType="neutral"
        icon={ArrowLeftRight}
        iconColor="text-blue-600 dark:text-blue-400"
      />
      <StatCard
        title={t.dashboard.savingsRate}
        value={formatPercent(stats.savingsRatePct, 1)}
        change={t.dashboard.savingsRateHint}
        changeType={tone}
        icon={PiggyBank}
        iconColor={
          tone === "positive"
            ? "text-emerald-600 dark:text-emerald-400"
            : tone === "negative"
            ? "text-red-600 dark:text-red-400"
            : "text-amber-600 dark:text-amber-400"
        }
      />
    </div>
  );
}
