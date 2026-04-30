"use client";

import { ArrowUpRight, ArrowDownRight, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/lib/i18n";
import { formatCurrency, formatPercent } from "@/lib/utils/format";
import type { AssetMover } from "@/lib/dashboard/movers";

interface Props {
  winners: AssetMover[];
  losers: AssetMover[];
  trackedCount: number;
}

export function TopMoversCard({ winners, losers, trackedCount }: Props) {
  const { t } = useTranslation();
  const isEmpty = winners.length === 0 && losers.length === 0;

  return (
    <Card variant="glass">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold">
              {t.dashboard.topMovers}
            </CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              {t.dashboard.topMoversHint}
            </p>
          </div>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted/50 text-blue-600 dark:text-blue-400">
            <Activity className="h-5 w-5" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {trackedCount === 0 || isEmpty ? (
          <p className="text-sm text-muted-foreground">
            {t.dashboard.noMoversData}
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <MoverList
              title={t.dashboard.topGainers}
              tone="positive"
              movers={winners}
            />
            <MoverList
              title={t.dashboard.topLosers}
              tone="negative"
              movers={losers}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MoverList({
  title,
  tone,
  movers,
}: {
  title: string;
  tone: "positive" | "negative";
  movers: AssetMover[];
}) {
  const Icon = tone === "positive" ? ArrowUpRight : ArrowDownRight;
  const pillClass =
    tone === "positive"
      ? "text-emerald-600 dark:text-emerald-400"
      : "text-red-600 dark:text-red-400";

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className={`h-3.5 w-3.5 ${pillClass}`} />
        <span>{title}</span>
      </div>
      {movers.length === 0 ? (
        <p className="text-xs text-muted-foreground/70">—</p>
      ) : (
        <ul className="space-y-1.5">
          {movers.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between gap-2 text-sm"
            >
              <div className="flex min-w-0 items-center gap-1.5">
                <span className="truncate font-medium">{m.name}</span>
                {m.symbol && (
                  <Badge variant="secondary" className="shrink-0 text-[10px] px-1.5 py-0">
                    {m.symbol}
                  </Badge>
                )}
              </div>
              <div className="flex shrink-0 items-baseline gap-2">
                <span className="text-xs text-muted-foreground tabular-nums">
                  {formatCurrency(m.currentValue, m.currency)}
                </span>
                <span className={`font-semibold tabular-nums ${pillClass}`}>
                  {formatPercent(m.changePercent, 2)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
