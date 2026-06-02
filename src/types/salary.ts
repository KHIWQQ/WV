// ──────────────────────────────
// Salary Management types
// ──────────────────────────────

/** A monthly salary ledger row (or a back-pay adjustment). */
export interface SalaryRecord {
  id: string;
  user_id: string;
  /** First day of the salary month (YYYY-MM-DD). */
  period: string;
  rank: string | null;
  pay_step: string | null;
  gross_rta: number;
  income_tiny: number;
  income_sckt: number;
  /** Map of deduction typeKey → amount withheld from gross_rta. */
  deductions: Record<string, number>;
  /** Map of government GPF contribution typeKey → amount (not withheld). */
  gov_contrib: Record<string, number>;
  is_backpay: boolean;
  note: string | null;
  created_at: string;
  updated_at: string;
}

/** Form payload for creating/updating a salary record. */
export interface SalaryRecordFormData {
  period: string;
  rank?: string;
  pay_step?: string;
  gross_rta: number;
  income_tiny: number;
  income_sckt: number;
  deductions: Record<string, number>;
  gov_contrib: Record<string, number>;
  is_backpay: boolean;
  note?: string;
}

/** Per-user cumulative GPF (กบข.) snapshot. */
export interface SalaryGpfSummary {
  user_id: string;
  own_principal: number;
  own_gain: number;
  gov_principal: number;
  gov_gain: number;
  atb_balance: number;
  as_of: string | null;
  updated_at: string;
}

/** GPF snapshot edit payload (no user_id / timestamps). */
export interface SalaryGpfFormData {
  own_principal: number;
  own_gain: number;
  gov_principal: number;
  gov_gain: number;
  atb_balance: number;
  as_of?: string;
}

/** A single named amount used by breakdown charts/legends. */
export interface SalaryBreakdownItem {
  key: string;
  amount: number;
  percent: number;
}

/** A point on the monthly salary trend chart. */
export interface SalaryTrendPoint {
  period: string;
  label: string;
  gross: number;
  deductions: number;
  net: number;
  extraIncome: number;
}

/** Aggregate stats across all (live) salary records. */
export interface SalarySummary {
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  totalExtraIncome: number;
  grandTotal: number;
  /** Cumulative own GPF contributions (สะสม + ส่วนเพิ่ม). */
  ownGpfContributed: number;
  /** Cumulative government GPF contributions (สมทบ + ชดเชย). */
  govGpfContributed: number;
  deductionBreakdown: SalaryBreakdownItem[];
  incomeBreakdown: SalaryBreakdownItem[];
  monthsTracked: number;
}

/** Result of a bulk CSV import. */
export interface SalaryImportResult {
  inserted: number;
  skipped: number;
}
