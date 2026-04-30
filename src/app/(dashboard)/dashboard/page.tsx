import { Suspense } from "react";
import { DashboardTitle } from "@/components/dashboard/dashboard-title";
import {
  StatCardsSkeleton,
  ChartSkeleton,
  ListSkeleton,
  PortfolioHealthSkeleton,
} from "@/components/dashboard/skeletons";
import { StatCardsSection } from "@/components/dashboard/sections/stat-cards-section";
import { AllocationDriftSection } from "@/components/dashboard/sections/allocation-drift-section";
import { NetWorthSection } from "@/components/dashboard/sections/net-worth-section";
import { AllocationSection } from "@/components/dashboard/sections/allocation-section";
import { RecentTransactionsSection } from "@/components/dashboard/sections/recent-transactions-section";
import { WorldMapSection } from "@/components/dashboard/sections/world-map-section";
import { CashflowSection } from "@/components/dashboard/sections/cashflow-section";
import {
  PortfolioWarningsSection,
  PortfolioHealthSection,
} from "@/components/dashboard/sections/portfolio-health-section";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <DashboardTitle />

      {/* Warning banner streams in silently — renders nothing if no warnings,
          so no skeleton needed */}
      <Suspense fallback={null}>
        <PortfolioWarningsSection />
      </Suspense>

      <Suspense fallback={<StatCardsSkeleton />}>
        <StatCardsSection />
      </Suspense>

      {/* Drift alert renders nothing when there's no concentration risk */}
      <Suspense fallback={null}>
        <AllocationDriftSection />
      </Suspense>

      <Suspense fallback={<PortfolioHealthSkeleton />}>
        <PortfolioHealthSection />
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
