"use client";

import { useMarketQuote } from "@/hooks/useMarket";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils/cn";

const DEFAULT_INDICES = ["^SET.BK", "^GSPC", "BTC-USD", "GC=F"];

export function MarketIndicesBar() {
  const { t } = useTranslation();

  const INDEX_LABELS: Record<string, string> = {
    "^SET.BK": "SET",
    "^GSPC": "S&P 500",
    "BTC-USD": "BTC",
    "GC=F": t.market.gold,
  };
  const { data: quotes = [], isLoading } = useMarketQuote(DEFAULT_INDICES);

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-1">
        {DEFAULT_INDICES.map((s) => (
          <div key={s} className="h-14 w-40 shrink-0 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-1">
      {quotes.map((q) => {
        const isPositive = q.change > 0;
        const isNegative = q.change < 0;
        return (
          <div
            key={q.symbol}
            className="flex shrink-0 items-center gap-3 rounded-lg border bg-card px-4 py-2.5"
          >
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                {INDEX_LABELS[q.symbol] || q.shortName}
              </p>
              <p className="font-semibold tabular-nums">
                {q.price.toLocaleString("th-TH", { maximumFractionDigits: 2 })}
              </p>
            </div>
            <span
              className={cn(
                "text-xs font-semibold tabular-nums",
                isPositive && "text-emerald-600",
                isNegative && "text-red-600",
                !isPositive && !isNegative && "text-muted-foreground"
              )}
            >
              {isPositive ? "+" : ""}
              {q.changePercent.toFixed(2)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
