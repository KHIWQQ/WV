/**
 * Amortization & payoff math.
 *
 * Conventions:
 *   - All percentages are annualised, expressed as numbers (5 = 5% per year, NOT 0.05)
 *   - Payment cadence is monthly
 *   - Currencies are agnostic — caller decides. THB throughout the app today.
 *
 * Pure functions, no I/O. Each function caps iteration at MAX_MONTHS so a
 * payment that's too small to amortize the loan returns a sentinel rather
 * than spinning forever.
 */

export const MAX_MONTHS = 12 * 60; // 60 years — beyond this we treat as "never"

export interface AmortizationRow {
  month: number; // 1-indexed
  paymentDate: string; // ISO yyyy-mm-dd
  payment: number; // total payment for the month
  principalPaid: number;
  interestPaid: number;
  balanceAfter: number;
}

export interface AmortizationResult {
  schedule: AmortizationRow[];
  totalInterest: number;
  monthsToPayoff: number;
  payoffDate: string | null;
  /** True when monthlyPayment ≤ first month's interest — loan grows, never paid off */
  underwater: boolean;
}

/**
 * Build a full amortization schedule given principal, annual rate, monthly
 * payment, and start date. Stops once balance reaches 0 (last row's payment
 * is adjusted down to whatever is owed).
 */
export function buildAmortization(
  principal: number,
  annualRatePct: number,
  monthlyPayment: number,
  startDate: Date | string
): AmortizationResult {
  if (!Number.isFinite(principal) || principal <= 0) {
    return emptyResult();
  }
  if (!Number.isFinite(monthlyPayment) || monthlyPayment <= 0) {
    return emptyResult({ underwater: true });
  }

  const monthlyRate = (annualRatePct || 0) / 100 / 12;
  let balance = principal;
  const schedule: AmortizationRow[] = [];
  let totalInterest = 0;

  // Detect runaway loan early: payment doesn't even cover first month's interest
  if (monthlyRate > 0 && monthlyPayment <= principal * monthlyRate) {
    return emptyResult({ underwater: true });
  }

  const start = typeof startDate === "string" ? new Date(startDate) : startDate;

  for (let m = 1; m <= MAX_MONTHS && balance > 0; m++) {
    const interest = balance * monthlyRate;
    let principalPaid = monthlyPayment - interest;

    // Final payment: don't overpay
    let payment = monthlyPayment;
    if (principalPaid >= balance) {
      principalPaid = balance;
      payment = balance + interest;
    }

    balance -= principalPaid;
    totalInterest += interest;

    const paymentDate = addMonths(start, m);
    schedule.push({
      month: m,
      paymentDate: toIsoDate(paymentDate),
      payment: round2(payment),
      principalPaid: round2(principalPaid),
      interestPaid: round2(interest),
      balanceAfter: round2(Math.max(balance, 0)),
    });
  }

  if (balance > 0.01) {
    // Safety: hit MAX_MONTHS without paying off → treat as underwater
    return emptyResult({ underwater: true });
  }

  return {
    schedule,
    totalInterest: round2(totalInterest),
    monthsToPayoff: schedule.length,
    payoffDate: schedule.length > 0 ? schedule[schedule.length - 1].paymentDate : null,
    underwater: false,
  };
}

export interface PayoffComparison {
  monthsCurrent: number;
  monthsWithExtra: number;
  monthsSaved: number;
  interestCurrent: number;
  interestWithExtra: number;
  interestSaved: number;
  payoffDateCurrent: string | null;
  payoffDateWithExtra: string | null;
}

/**
 * Compare current payment plan against a higher monthly payment ("what if I
 * pay an extra X each month?"). Returns months saved + interest saved.
 */
export function comparePayoff(
  principal: number,
  annualRatePct: number,
  baselineMonthlyPayment: number,
  extraPerMonth: number,
  startDate: Date | string = new Date()
): PayoffComparison {
  const baseline = buildAmortization(
    principal,
    annualRatePct,
    baselineMonthlyPayment,
    startDate
  );
  const accelerated = buildAmortization(
    principal,
    annualRatePct,
    baselineMonthlyPayment + Math.max(0, extraPerMonth),
    startDate
  );

  return {
    monthsCurrent: baseline.monthsToPayoff,
    monthsWithExtra: accelerated.monthsToPayoff,
    monthsSaved: baseline.monthsToPayoff - accelerated.monthsToPayoff,
    interestCurrent: baseline.totalInterest,
    interestWithExtra: accelerated.totalInterest,
    interestSaved: round2(baseline.totalInterest - accelerated.totalInterest),
    payoffDateCurrent: baseline.payoffDate,
    payoffDateWithExtra: accelerated.payoffDate,
  };
}

// ─── helpers ──────────────────────────────────────────────────────────

function emptyResult(overrides?: Partial<AmortizationResult>): AmortizationResult {
  return {
    schedule: [],
    totalInterest: 0,
    monthsToPayoff: 0,
    payoffDate: null,
    underwater: false,
    ...overrides,
  };
}

function addMonths(d: Date, months: number): Date {
  const r = new Date(d);
  r.setMonth(r.getMonth() + months);
  return r;
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
