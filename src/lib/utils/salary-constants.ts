// ──────────────────────────────
// Salary Management constants
//
// Thai (military) payroll taxonomy. Keys are stored verbatim in the
// `salary_records.deductions` / `.gov_contrib` jsonb maps and as `rank`,
// so DO NOT rename existing keys — add new ones instead. `labelKey` points
// into the i18n `salary.*` blocks; keep aligned with src/lib/i18n/locales.
// ──────────────────────────────

/** Extra income streams tracked alongside the RTA salary. */
export const SALARY_INCOME_STREAMS = [
  { key: "rta", labelKey: "rta" as const, color: "#0C1F3F" },
  { key: "tiny", labelKey: "tiny" as const, color: "#D4A843" },
  { key: "sckt", labelKey: "sckt" as const, color: "#0e7490" },
] as const;

export type SalaryIncomeStreamKey = (typeof SALARY_INCOME_STREAMS)[number]["key"];

/**
 * Deduction line items withheld from gross RTA pay. Their sum is the
 * "หักรวม" total; net pay = gross_rta − Σ deductions.
 */
export const SALARY_DEDUCTION_TYPES = [
  { key: "kbkk_save", labelKey: "kbkk_save" as const, color: "#3b82f6" },      // กบข.สะสม
  { key: "kbkk_extra", labelKey: "kbkk_extra" as const, color: "#6366f1" },    // กบข.ส่วนเพิ่ม
  { key: "atb_deposit", labelKey: "atb_deposit" as const, color: "#22c55e" },  // อทบ.ฝาก
  { key: "funeral", labelKey: "funeral" as const, color: "#64748b" },          // ฌาปนกิจ ทบ.
  { key: "coop", labelKey: "coop" as const, color: "#8b5cf6" },                // สหกรณ์ออมทรัพย์
  { key: "atb_s", labelKey: "atb_s" as const, color: "#14b8a6" },              // อทบ.(ส)
  { key: "cyber", labelKey: "cyber" as const, color: "#f59e0b" },              // กองทุนไซเบอร์2
  { key: "yutthakoste", labelKey: "yutthakoste" as const, color: "#ec4899" },  // ยุทธโกษ
  { key: "magazine", labelKey: "magazine" as const, color: "#a1a1aa" },        // นิตยสารเสนาศึกษา
] as const;

export type SalaryDeductionKey = (typeof SALARY_DEDUCTION_TYPES)[number]["key"];

/**
 * Government GPF (กบข.) contributions. NOT withheld from pay — they flow
 * into the member's fund on top of salary.
 */
export const SALARY_GOV_CONTRIB_TYPES = [
  { key: "kbkk_match", labelKey: "kbkk_match" as const, color: "#0891b2" },        // กบข.สมทบ
  { key: "kbkk_compensate", labelKey: "kbkk_compensate" as const, color: "#0d9488" }, // กบข.ชดเชย
] as const;

export type SalaryGovContribKey = (typeof SALARY_GOV_CONTRIB_TYPES)[number]["key"];

/** Thai army officer ranks (น. — สัญญาบัตร). Extend as needed. */
export const MILITARY_RANKS = [
  { key: "2nd_lieutenant", labelKey: "2nd_lieutenant" as const },
  { key: "1st_lieutenant", labelKey: "1st_lieutenant" as const },
  { key: "captain", labelKey: "captain" as const },
  { key: "major", labelKey: "major" as const },
  { key: "lieutenant_colonel", labelKey: "lieutenant_colonel" as const },
  { key: "colonel", labelKey: "colonel" as const },
] as const;

export type MilitaryRankKey = (typeof MILITARY_RANKS)[number]["key"];

/** Sum a jsonb amount map (deductions / gov_contrib). */
export function sumAmountMap(map: Record<string, number> | null | undefined): number {
  if (!map) return 0;
  return Object.values(map).reduce((acc, v) => acc + (Number(v) || 0), 0);
}

/** Net RTA pay for a record: gross minus the deduction total (หักรวม). */
export function netRtaPay(grossRta: number, deductions: Record<string, number> | null | undefined): number {
  return grossRta - sumAmountMap(deductions);
}

/** Extra (non-RTA) income for a record. */
export function extraIncome(record: { income_tiny: number; income_sckt: number }): number {
  return (Number(record.income_tiny) || 0) + (Number(record.income_sckt) || 0);
}

// Personal GPF (กบข.) is the savings + extra-savings deduction lines.
const OWN_GPF_KEYS: SalaryDeductionKey[] = ["kbkk_save", "kbkk_extra"];

type SalaryRecordLike = {
  period: string;
  gross_rta: number;
  income_tiny: number;
  income_sckt: number;
  deductions: Record<string, number>;
  gov_contrib: Record<string, number>;
};

/** Roll a list of (live) salary records into a SalarySummary. */
export function summarizeSalary(records: SalaryRecordLike[]) {
  let totalGross = 0;
  let totalDeductions = 0;
  let totalExtraIncome = 0;
  let ownGpfContributed = 0;
  let govGpfContributed = 0;
  const deductionTotals: Record<string, number> = {};
  const incomeTotals: Record<string, number> = {};

  for (const r of records) {
    const gross = Number(r.gross_rta) || 0;
    const ded = sumAmountMap(r.deductions);
    totalGross += gross;
    totalDeductions += ded;
    totalExtraIncome += extraIncome(r);

    incomeTotals.rta = (incomeTotals.rta ?? 0) + gross;
    incomeTotals.tiny = (incomeTotals.tiny ?? 0) + (Number(r.income_tiny) || 0);
    incomeTotals.sckt = (incomeTotals.sckt ?? 0) + (Number(r.income_sckt) || 0);

    for (const [key, amount] of Object.entries(r.deductions ?? {})) {
      const v = Number(amount) || 0;
      deductionTotals[key] = (deductionTotals[key] ?? 0) + v;
      if (OWN_GPF_KEYS.includes(key as SalaryDeductionKey)) ownGpfContributed += v;
    }
    govGpfContributed += sumAmountMap(r.gov_contrib);
  }

  const totalNet = totalGross - totalDeductions;

  return {
    totalGross,
    totalDeductions,
    totalNet,
    totalExtraIncome,
    grandTotal: totalNet + totalExtraIncome,
    ownGpfContributed,
    govGpfContributed,
    deductionBreakdown: toBreakdown(deductionTotals),
    incomeBreakdown: toBreakdown(incomeTotals),
    monthsTracked: new Set(records.map((r) => r.period)).size,
  };
}

/** Map a {key: amount} total into sorted breakdown items with percentages. */
function toBreakdown(totals: Record<string, number>) {
  const sum = Object.values(totals).reduce((a, b) => a + b, 0);
  return Object.entries(totals)
    .filter(([, amount]) => amount > 0)
    .map(([key, amount]) => ({
      key,
      amount,
      percent: sum > 0 ? (amount / sum) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

/**
 * Monthly trend points, oldest→newest. Back-pay rows for a period are folded
 * into the same month so the trend stays one point per period.
 */
export function salaryTrend(records: SalaryRecordLike[]) {
  const byPeriod = new Map<
    string,
    { gross: number; deductions: number; extraIncome: number }
  >();

  for (const r of records) {
    const cur = byPeriod.get(r.period) ?? { gross: 0, deductions: 0, extraIncome: 0 };
    cur.gross += Number(r.gross_rta) || 0;
    cur.deductions += sumAmountMap(r.deductions);
    cur.extraIncome += extraIncome(r);
    byPeriod.set(r.period, cur);
  }

  return Array.from(byPeriod.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, v]) => ({
      period,
      // YYYY-MM short label; the UI may reformat for locale.
      label: period.slice(0, 7),
      gross: v.gross,
      deductions: v.deductions,
      net: v.gross - v.deductions,
      extraIncome: v.extraIncome,
    }));
}
