/**
 * Pure helpers for the dashboard daily-open-hook cards.
 *
 * Kept separate from `actions/dashboard.ts` so they're testable without
 * mocking Supabase / the market gateway.
 */

export interface AssetMover {
  id: string;
  name: string;
  symbol: string;
  currency: string;
  currentValue: number;
  changePercent: number;
}

/**
 * Compute (income − expense) / income × 100 with two safety rails:
 *   - income = 0 → return 0 (not NaN)
 *   - negative result allowed (savings rate can be < 0 when overspending)
 */
export function computeSavingsRatePct(
  monthlyIncome: number,
  monthlyExpense: number
): number {
  if (!Number.isFinite(monthlyIncome) || monthlyIncome <= 0) return 0;
  const exp = Number.isFinite(monthlyExpense) ? monthlyExpense : 0;
  return ((monthlyIncome - exp) / monthlyIncome) * 100;
}

/**
 * Bucket of color-coding cutoffs used by the savings-rate card.
 * Returned as a string so the caller can switch on it for tailwind classes.
 */
export function savingsRateTone(pct: number): "positive" | "neutral" | "negative" {
  if (!Number.isFinite(pct)) return "neutral";
  if (pct >= 20) return "positive";
  if (pct < 0) return "negative";
  return "neutral";
}

/**
 * Pick the top N gainers and top N losers by changePercent.
 * - Items with non-finite changePercent are dropped upstream.
 * - When all movers are positive (rare but possible), losers list is empty
 *   rather than padded with low-positive values — that would be misleading.
 */
export function sortMovers(
  movers: AssetMover[],
  limit = 3
): { winners: AssetMover[]; losers: AssetMover[] } {
  const sorted = [...movers].sort((a, b) => b.changePercent - a.changePercent);
  const winners = sorted.filter((m) => m.changePercent > 0).slice(0, limit);
  const losers = sorted
    .filter((m) => m.changePercent < 0)
    .slice(-limit)
    .reverse();
  return { winners, losers };
}
