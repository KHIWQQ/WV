"use client";

import { Wallet, CreditCard, TrendingUp, ArrowLeftRight } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { formatTHB } from "@/lib/utils/format";
import { useTranslation } from "@/lib/i18n";
import type { DashboardStats } from "@/lib/actions/dashboard";

interface Props {
  stats: DashboardStats;
}

export function StatCardsGrid({ stats }: Props) {
  const { t } = useTranslation();

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title={t.dashboard.netWorth}
        value={formatTHB(stats.netWorth)}
        changeType="neutral"
        icon={TrendingUp}
        iconColor="text-navy"
      />
      <StatCard
        title={t.dashboard.totalAssets}
        value={formatTHB(stats.totalAssets)}
        changeType="neutral"
        icon={Wallet}
        iconColor="text-emerald-600"
      />
      <StatCard
        title={t.dashboard.totalLiabilities}
        value={formatTHB(stats.totalLiabilities)}
        changeType="neutral"
        icon={CreditCard}
        iconColor="text-red-600"
      />
      <StatCard
        title={t.dashboard.thisMonthIncome}
        value={formatTHB(stats.monthlyIncome)}
        changeType="neutral"
        icon={ArrowLeftRight}
        iconColor="text-blue-600"
      />
    </div>
  );
}
