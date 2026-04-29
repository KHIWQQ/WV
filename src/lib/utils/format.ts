const thbFormatter = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/**
 * Format number as Thai Baht currency
 */
export function formatTHB(amount: number): string {
  return thbFormatter.format(amount);
}

const currencyFormatters = new Map<string, Intl.NumberFormat>();

/**
 * Format an amount in any supported currency. Uses Intl.NumberFormat under
 * the hood so the symbol/grouping match the currency's locale. Defaults to
 * THB if the currency is missing or unrecognized.
 */
export function formatCurrency(amount: number, currency: string | null | undefined): string {
  const cur = (currency ?? "THB").toUpperCase();
  if (cur === "THB") return formatTHB(amount);

  let formatter = currencyFormatters.get(cur);
  if (!formatter) {
    try {
      formatter = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: cur,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      });
      currencyFormatters.set(cur, formatter);
    } catch {
      // Unknown currency code → fall back to plain number with code suffix
      return `${formatNumber(amount, 2)} ${cur}`;
    }
  }
  return formatter.format(amount);
}

const numberFormatters = new Map<number, Intl.NumberFormat>();

function getNumberFormatter(decimals: number): Intl.NumberFormat {
  let formatter = numberFormatters.get(decimals);
  if (!formatter) {
    formatter = new Intl.NumberFormat("th-TH", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    numberFormatters.set(decimals, formatter);
  }
  return formatter;
}

/**
 * Format number with Thai locale separators (no currency symbol)
 */
export function formatNumber(amount: number, decimals = 0): string {
  return getNumberFormatter(decimals).format(amount);
}

/**
 * Format percentage
 */
export function formatPercent(value: number, decimals = 1): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(decimals)}%`;
}

const dateFormatter = new Intl.DateTimeFormat("th-TH", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

/**
 * Format date in Thai locale
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return dateFormatter.format(d);
}

/**
 * Abbreviate large numbers (e.g. 1.5M, 300K)
 */
export function abbreviateNumber(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(0)}K`;
  }
  return value.toFixed(0);
}

