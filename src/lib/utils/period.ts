import {
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  addDays,
  addMonths,
  addYears,
  format,
  parseISO,

} from "date-fns";
import { th } from "date-fns/locale";
import type { PeriodState, PeriodView } from "@/types/transaction";
import type { Transaction } from "@/types";

// ──────────────────────────────
// Buddhist Year
// ──────────────────────────────

export function toBuddhistYear(year: number): number {
  return year + 543;
}

// ──────────────────────────────
// Period Range (for DB queries)
// ──────────────────────────────

export function getPeriodRange(period: PeriodState): { dateFrom: string; dateTo: string } {
  const { view, year, month, day } = period;

  if (view === "daily") {
    const d = new Date(year, month - 1, day);
    return {
      dateFrom: format(startOfDay(d), "yyyy-MM-dd"),
      dateTo: format(endOfDay(d), "yyyy-MM-dd"),
    };
  }

  if (view === "monthly") {
    const d = new Date(year, month - 1, 1);
    return {
      dateFrom: format(startOfMonth(d), "yyyy-MM-dd"),
      dateTo: format(endOfMonth(d), "yyyy-MM-dd"),
    };
  }

  // yearly
  const d = new Date(year, 0, 1);
  return {
    dateFrom: format(startOfYear(d), "yyyy-MM-dd"),
    dateTo: format(endOfYear(d), "yyyy-MM-dd"),
  };
}

// ──────────────────────────────
// Period Label (Thai + พ.ศ.)
// ──────────────────────────────

const THAI_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน",
  "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม",
  "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

const THAI_MONTHS_SHORT = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.",
  "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.",
  "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
];

export function getPeriodLabel(period: PeriodState): string {
  const { view, year, month, day } = period;
  const buddhistYear = toBuddhistYear(year);

  if (view === "daily") {
    return `${day} ${THAI_MONTHS[month - 1]} ${buddhistYear}`;
  }
  if (view === "monthly") {
    return `${THAI_MONTHS[month - 1]} ${buddhistYear}`;
  }
  return `ปี ${buddhistYear}`;
}

export function getThaiMonthShort(monthIndex: number): string {
  return THAI_MONTHS_SHORT[monthIndex] ?? "";
}

// ──────────────────────────────
// Navigate Period
// ──────────────────────────────

export function navigatePeriod(period: PeriodState, direction: 1 | -1): PeriodState {
  const { view, year, month, day } = period;

  if (view === "daily") {
    const d = addDays(new Date(year, month - 1, day), direction);
    return { view, year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
  }

  if (view === "monthly") {
    const d = addMonths(new Date(year, month - 1, 1), direction);
    return { view, year: d.getFullYear(), month: d.getMonth() + 1, day: 1 };
  }

  // yearly
  const d = addYears(new Date(year, 0, 1), direction);
  return { view, year: d.getFullYear(), month: 1, day: 1 };
}

// ──────────────────────────────
// Today's period
// ──────────────────────────────

export function getInitialPeriod(view: PeriodView = "monthly"): PeriodState {
  const now = new Date();
  return {
    view,
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
  };
}

// ──────────────────────────────
// Group transactions by date
// ──────────────────────────────

export interface TransactionGroup {
  date: string;
  label: string;
  transactions: Transaction[];
  total: number;
}

export function groupTransactionsByDate(transactions: Transaction[]): TransactionGroup[] {
  const groups = new Map<string, Transaction[]>();

  for (const tx of transactions) {
    const dateKey = tx.date.split("T")[0];
    if (!groups.has(dateKey)) {
      groups.set(dateKey, []);
    }
    groups.get(dateKey)!.push(tx);
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, txs]) => {
      const d = parseISO(date);
      const buddhistYear = toBuddhistYear(d.getFullYear());
      const label = format(d, "d", { locale: th }) + " " +
        THAI_MONTHS_SHORT[d.getMonth()] + " " + buddhistYear;

      const total = txs.reduce((sum, tx) => {
        if (tx.type === "income" || tx.type === "sell") return sum + tx.amount;
        return sum - tx.amount;
      }, 0);

      return { date, label, transactions: txs, total };
    });
}
