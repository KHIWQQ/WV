/**
 * Net-worth ratios for the dashboard / liabilities page.
 *
 * Pure helpers — no Supabase, no FX. Caller pre-aggregates totals (in any
 * currency) and we compute the ratio.
 */

/**
 * Loan-to-Asset ratio = totalLiabilities / totalAssets, expressed as %.
 *   - <30%    healthy
 *   - 30–60%  watchful
 *   - >60%    stretched
 *
 * Returns 0 when assets ≤ 0 (avoids division-by-zero / Infinity).
 */
export function loanToAssetPct(totalAssets: number, totalLiabilities: number): number {
  if (!Number.isFinite(totalAssets) || totalAssets <= 0) return 0;
  if (!Number.isFinite(totalLiabilities) || totalLiabilities <= 0) return 0;
  return (totalLiabilities / totalAssets) * 100;
}

export type RatioTone = "positive" | "neutral" | "negative";

export function loanToAssetTone(pct: number): RatioTone {
  if (!Number.isFinite(pct) || pct <= 0) return "neutral";
  if (pct < 30) return "positive";
  if (pct <= 60) return "neutral";
  return "negative";
}

export interface CategoryAllocation {
  category: string;
  valueHome: number;
  pct: number;
}

/**
 * Group asset values by category and return the % of total per category.
 * The returned list is sorted desc by value, so the biggest position is first.
 */
export function computeAllocation(
  assets: { category: string; valueHome: number }[]
): CategoryAllocation[] {
  const total = assets.reduce((s, a) => s + (a.valueHome || 0), 0);
  if (total <= 0) return [];

  const buckets = new Map<string, number>();
  for (const a of assets) {
    buckets.set(a.category, (buckets.get(a.category) ?? 0) + (a.valueHome || 0));
  }

  return Array.from(buckets.entries())
    .map(([category, valueHome]) => ({
      category,
      valueHome,
      pct: (valueHome / total) * 100,
    }))
    .sort((a, b) => b.valueHome - a.valueHome);
}

export interface DriftAlert {
  category: string;
  currentPct: number;
  /** Drift magnitude — how concentrated this category is vs an even split */
  overweightVsEvenPct: number;
}

/**
 * Detect concentration risk: any single category > 50% of the portfolio,
 * OR > 2× the even-split share given the number of distinct categories.
 *
 * This is a heuristic placeholder until users can set explicit targets.
 * Returns the overweight categories (could be empty).
 */
export function detectConcentration(
  allocation: CategoryAllocation[],
  thresholdPct = 50
): DriftAlert[] {
  if (allocation.length === 0) return [];
  const evenShare = 100 / allocation.length;
  const alerts: DriftAlert[] = [];
  for (const a of allocation) {
    const overEven = a.pct - evenShare;
    if (a.pct > thresholdPct || a.pct > evenShare * 2) {
      alerts.push({
        category: a.category,
        currentPct: a.pct,
        overweightVsEvenPct: overEven,
      });
    }
  }
  return alerts.sort((a, b) => b.currentPct - a.currentPct);
}
