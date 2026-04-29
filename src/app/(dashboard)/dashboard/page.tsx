import { Suspense } from "react";
import { DashboardTitle } from "@/components/dashboard/dashboard-title";
import {
  StatCardsSkeleton,
  ChartSkeleton,
  ListSkeleton,
} from "@/components/dashboard/skeletons";
import { StatCardsSection } from "@/components/dashboard/sections/stat-cards-section";
import { NetWorthSection } from "@/components/dashboard/sections/net-worth-section";
import { AllocationSection } from "@/components/dashboard/sections/allocation-section";
import { RecentTransactionsSection } from "@/components/dashboard/sections/recent-transactions-section";
import { WorldMapSection } from "@/components/dashboard/sections/world-map-section";
import { CashflowSection } from "@/components/dashboard/sections/cashflow-section";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <DashboardTitle />

      <Suspense fallback={<StatCardsSkeleton />}>
        <StatCardsSection />
      </Suspense>

      <Suspense fallback={<ChartSkeleton height={320} />}>
        <NetWorthSection />
      </Suspense>

      <div className="grid gap-6 lg:grid-cols-2">
        <Suspense fallback={<ChartSkeleton height={300} />}>
          <AllocationSection />
        </Suspense>
        <Suspense fallback={<ListSkeleton rows={5} />}>
          <RecentTransactionsSection />
        </Suspense>
      </div>

      <Suspense fallback={<ChartSkeleton height={400} />}>
        <WorldMapSection />
      </Suspense>

      <Suspense fallback={<ChartSkeleton height={280} />}>
        <CashflowSection />
      </Suspense>
    </div>
  );
}
