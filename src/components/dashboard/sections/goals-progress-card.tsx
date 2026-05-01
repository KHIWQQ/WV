"use client";

import Link from "next/link";
import { Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/lib/i18n";
import { formatTHB, formatPercent } from "@/lib/utils/format";
import type { Goal } from "@/types/goal";

interface Props {
  goals: (Goal & { pct: number })[];
}

export function GoalsProgressCard({ goals }: Props) {
  const { t } = useTranslation();

  return (
    <Card variant="glass">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Target className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              {t.goals.title}
            </CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              {t.goals.subtitle}
            </p>
          </div>
          <Link
            href="/dashboard/goals"
            className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            {t.common.all} →
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {goals.map((g) => {
            const pctClamped = Math.min(g.pct, 100);
            return (
              <li key={g.id} className="space-y-1">
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="truncate font-medium">{g.name}</span>
                    <Badge variant="secondary" className="shrink-0 text-[10px] px-1 py-0">
                      {t.goalTypes[g.goal_type as keyof typeof t.goalTypes]}
                    </Badge>
                  </div>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {formatTHB(g.current_amount)} / {formatTHB(g.target_amount)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full ${
                        g.pct >= 100 ? "bg-emerald-500" : "bg-blue-500 dark:bg-blue-400"
                      }`}
                      style={{ width: `${pctClamped}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold tabular-nums w-12 text-right">
                    {formatPercent(g.pct, 0)}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
