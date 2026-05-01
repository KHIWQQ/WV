/**
 * Goal-progress projection helpers.
 *
 * Pure functions — no I/O. Used by the goals page + dashboard goal card.
 */

export interface GoalProjection {
  /** % of the target reached today (0–100, can exceed 100 if overshot) */
  progressPct: number;
  /** Months still needed at the committed `monthlyContribution` rate */
  monthsRemaining: number | null;
  /** Months between today and the user-set target date (null when no date) */
  monthsToTargetDate: number | null;
  /** True when the user is on pace to hit target_date with current contribution */
  onTrack: boolean | null;
  /** Recommended monthly contribution to hit target_date — null if no date or already done */
  recommendedMonthly: number | null;
}

export interface GoalInput {
  targetAmount: number;
  currentAmount: number;
  monthlyContribution: number;
  targetDate?: string | null;
}

export function projectGoal(
  input: GoalInput,
  today: Date = new Date()
): GoalProjection {
  const target = Number.isFinite(input.targetAmount) ? input.targetAmount : 0;
  const current = Number.isFinite(input.currentAmount) ? input.currentAmount : 0;
  const monthly = Number.isFinite(input.monthlyContribution)
    ? input.monthlyContribution
    : 0;

  const progressPct = target > 0 ? (current / target) * 100 : 0;
  const remaining = Math.max(target - current, 0);

  // Months at current pace
  let monthsRemaining: number | null;
  if (remaining === 0) {
    monthsRemaining = 0;
  } else if (monthly <= 0) {
    monthsRemaining = null; // user has no contribution → can't project
  } else {
    monthsRemaining = Math.ceil(remaining / monthly);
  }

  // Months until user-set target date
  let monthsToTargetDate: number | null = null;
  if (input.targetDate) {
    const dateMs = new Date(input.targetDate).getTime();
    if (Number.isFinite(dateMs)) {
      const diffMs = dateMs - today.getTime();
      const diffMonths = diffMs / (1000 * 60 * 60 * 24 * 30.44); // avg month
      monthsToTargetDate = Math.max(0, Math.ceil(diffMonths));
    }
  }

  // On-track when monthsRemaining ≤ monthsToTargetDate
  let onTrack: boolean | null = null;
  if (monthsToTargetDate !== null && monthsRemaining !== null) {
    onTrack = monthsRemaining <= monthsToTargetDate;
  } else if (remaining === 0) {
    onTrack = true;
  }

  // Recommended contribution to hit target_date exactly
  let recommendedMonthly: number | null = null;
  if (
    monthsToTargetDate !== null &&
    monthsToTargetDate > 0 &&
    remaining > 0
  ) {
    recommendedMonthly = remaining / monthsToTargetDate;
  }

  return {
    progressPct,
    monthsRemaining,
    monthsToTargetDate,
    onTrack,
    recommendedMonthly,
  };
}

/**
 * Emergency-fund coverage: how many months of expenses the current cash
 * cushion covers. Convention is "3-6 months". Returns 0 when no expenses.
 */
export function emergencyFundMonths(
  cashOnHand: number,
  monthlyExpense: number
): number {
  if (!Number.isFinite(monthlyExpense) || monthlyExpense <= 0) return 0;
  if (!Number.isFinite(cashOnHand) || cashOnHand <= 0) return 0;
  return cashOnHand / monthlyExpense;
}

export function emergencyFundTone(months: number): "positive" | "neutral" | "negative" {
  if (!Number.isFinite(months) || months <= 0) return "negative";
  if (months >= 6) return "positive";
  if (months >= 3) return "neutral";
  return "negative";
}
