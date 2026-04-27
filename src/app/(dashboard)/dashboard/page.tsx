"use client";

import { Wallet, CreditCard, TrendingUp, ArrowLeftRight } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { NetWorthChart } from "@/components/dashboard/net-worth-chart";
import { AssetAllocationChart } from "@/components/dashboard/asset-allocation-chart";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { MonthlyCashflowChart } from "@/components/dashboard/monthly-cashflow-chart";
import { AssetWorldMap } from "@/components/assets/asset-world-map";
import { formatTHB } from "@/lib/utils/format";
import { useDashboard } from "@/hooks/useDashboard";
import { useAutoSync } from "@/hooks/useAutoSync";
import { useTranslation } from "@/lib/i18n";

export default function DashboardPage() {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useDashboard();
  useAutoSync();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-muted-foreground">{t.common.loading}</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-red-600">{t.common.errorLoadData}</div>
      </div>
    );
  }

  const totalAssets = data?.totalAssets ?? 0;
  const totalLiabilities = data?.totalLiabilities ?? 0;
  const netWorth = data?.netWorth ?? 0;
  const monthlyIncome = data?.monthlyIncome ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t.dashboard.wealthOverview}</h1>
        <p className="text-sm text-muted-foreground">
          {t.dashboard.wealthSummary}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t.dashboard.netWorth}
          value={formatTHB(netWorth)}
          changeType="neutral"
          icon={TrendingUp}
          iconColor="text-navy"
        />
        <StatCard
          title={t.dashboard.totalAssets}
          value={formatTHB(totalAssets)}
          changeType="neutral"
          icon={Wallet}
          iconColor="text-emerald-600"
        />
        <StatCard
          title={t.dashboard.totalLiabilities}
          value={formatTHB(totalLiabilities)}
          changeType="neutral"
          icon={CreditCard}
          iconColor="text-red-600"
        />
        <StatCard
          title={t.dashboard.thisMonthIncome}
          value={formatTHB(monthlyIncome)}
          changeType="neutral"
          icon={ArrowLeftRight}
          iconColor="text-blue-600"
        />
      </div>

      <NetWorthChart data={data?.netWorthHistory} />

      <div className="grid gap-6 lg:grid-cols-2">
        <AssetAllocationChart assets={data?.assets} />
        <RecentTransactions transactions={data?.transactions} />
      </div>

      <AssetWorldMap assets={data?.assets || []} />

      <MonthlyCashflowChart transactions={data?.transactions} />
    </div>
  );
}
