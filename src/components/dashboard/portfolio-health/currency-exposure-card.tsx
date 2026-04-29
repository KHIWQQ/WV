"use client";

import { Coins } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTHB } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { CurrencyExposure } from "@/lib/portfolio/health";

interface Props {
  exposure: CurrencyExposure[];
}

// Stable color per currency. Add as we encounter more.
const CURRENCY_COLORS: Record<string, string> = {
  THB: "bg-navy-500 dark:bg-navy-400",
  USD: "bg-emerald-500",
  EUR: "bg-blue-500",
  JPY: "bg-rose-500",
  CNY: "bg-amber-500",
  GBP: "bg-purple-500",
};
const FALLBACK_COLOR = "bg-zinc-400";

function colorFor(currency: string): string {
  return CURRENCY_COLORS[currency] ?? FALLBACK_COLOR;
}

export function CurrencyExposureCard({ exposure }: Props) {
  const isEmpty = exposure.length === 0;

  return (
    <Card variant="glass">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base font-semibold">
              สัดส่วนสกุลเงิน
            </CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              สกุลเงินที่ทรัพย์สินคุณถืออยู่
            </p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted/50 text-navy">
            <Coins className="h-5 w-5" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEmpty ? (
          <p className="text-sm text-muted-foreground">
            ยังไม่มีข้อมูล — เพิ่มทรัพย์สินเพื่อดูสัดส่วน
          </p>
        ) : (
          <>
            {/* Stacked bar */}
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted/40">
              {exposure.map((e) => (
                <div
                  key={e.currency}
                  className={cn("h-full transition-all", colorFor(e.currency))}
                  style={{ width: `${e.pct}%` }}
                  title={`${e.currency} — ${e.pct.toFixed(1)}%`}
                />
              ))}
            </div>

            {/* Legend */}
            <ul className="space-y-2 text-xs">
              {exposure.map((e) => (
                <li
                  key={e.currency}
                  className="flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      aria-hidden
                      className={cn("h-2.5 w-2.5 shrink-0 rounded-full", colorFor(e.currency))}
                    />
                    <span className="font-medium text-foreground">{e.currency}</span>
                  </div>
                  <div className="flex items-baseline gap-3 shrink-0">
                    <span className="text-muted-foreground tabular-nums">
                      {formatTHB(e.valueHome)}
                    </span>
                    <span className="w-12 text-right font-semibold text-foreground tabular-nums">
                      {e.pct.toFixed(1)}%
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}
