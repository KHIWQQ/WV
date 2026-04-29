import { cache } from "react";
import { getPortfolioHealth } from "@/lib/actions/portfolio-health";
import { PnLCard } from "@/components/dashboard/portfolio-health/pnl-card";
import { CurrencyExposureCard } from "@/components/dashboard/portfolio-health/currency-exposure-card";
import { WarningsBanner } from "@/components/dashboard/portfolio-health/warnings-banner";

const fetchHealth = cache(getPortfolioHealth);

/**
 * Renders ONLY the warning banner — placed near the top of the dashboard
 * so users see it before scrolling. Returns null when no warnings.
 */
export async function PortfolioWarningsSection() {
  const health = await fetchHealth();
  return <WarningsBanner warnings={health.warnings} />;
}

/**
 * Renders the P&L summary + currency exposure pair.
 * Two-column on lg, single column below.
 */
export async function PortfolioHealthSection() {
  const health = await fetchHealth();
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <PnLCard pnl={health.pnl} />
      <CurrencyExposureCard exposure={health.currencyExposure} />
    </div>
  );
}
