/**
 * Returns Tailwind classes for a gain/loss number with light + dark variants.
 *
 * Use `>= 0` semantics: zero is treated as positive (no loss). Pass an
 * explicit `negativeOnZero` flag if zero should display as a loss
 * (e.g., on a "today's change" indicator where 0% should look neutral).
 */
export function gainLossClass(value: number): string {
  return value >= 0
    ? "text-emerald-600 dark:text-emerald-400"
    : "text-red-600 dark:text-red-400";
}

/**
 * Three-way variant: separate styling for positive, negative, and zero/neutral.
 * Useful for price tickers where an unchanged price should NOT be colored.
 */
export function priceChangeClass(value: number): string {
  if (value > 0) return "text-emerald-600 dark:text-emerald-400";
  if (value < 0) return "text-red-600 dark:text-red-400";
  return "text-muted-foreground";
}
