"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { priceChangeClass } from "@/lib/utils/gain-loss";
import type { MarketQuote } from "@/types";

interface PriceTickerProps {
  quote: MarketQuote;
  onClick?: () => void;
  compact?: boolean;
}

export function PriceTicker({ quote, onClick, compact = false }: PriceTickerProps) {
  const isPositive = quote.change > 0;
  const isNegative = quote.change < 0;

  const priceStr = quote.price.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const changeStr = `${isPositive ? "+" : ""}${quote.change.toFixed(2)}`;
  const pctStr = `${isPositive ? "+" : ""}${quote.changePercent.toFixed(2)}%`;

  const Wrapper = onClick ? "button" : "div";

  return (
    <Wrapper
      onClick={onClick}
      className={cn(
        "flex items-center justify-between rounded-lg border p-3 transition-colors",
        onClick && "hover:bg-muted/50 cursor-pointer w-full text-left"
      )}
    >
      <div className="min-w-0">
        <p className="font-medium truncate">{quote.symbol}</p>
        {!compact && (
          <p className="text-xs text-muted-foreground truncate">{quote.shortName}</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <div className="text-right">
          <p className="font-semibold tabular-nums">{priceStr}</p>
          <div
            className={cn(
              "flex items-center justify-end gap-1 text-xs font-medium",
              priceChangeClass(quote.change)
            )}
          >
            {isPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : isNegative ? (
              <TrendingDown className="h-3 w-3" />
            ) : (
              <Minus className="h-3 w-3" />
            )}
            <span className="tabular-nums">
              {changeStr} ({pctStr})
            </span>
          </div>
        </div>
      </div>
    </Wrapper>
  );
}
