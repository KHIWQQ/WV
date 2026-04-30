"use client";

import { AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n";
import { getAssetCategoryLabel } from "@/lib/utils/constants";
import { formatPercent } from "@/lib/utils/format";
import type { DriftAlert } from "@/lib/finance/ratios";

interface Props {
  alerts: DriftAlert[];
}

export function AllocationDriftCard({ alerts }: Props) {
  const { t } = useTranslation();

  return (
    <Card variant="glass" className="border-amber-500/40 bg-amber-500/5">
      <CardContent className="flex items-start gap-3 p-4">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="space-y-2">
          <div>
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
              {t.dashboard.driftTitle}
            </p>
            <p className="text-xs text-muted-foreground">
              {t.dashboard.driftHint}
            </p>
          </div>
          <ul className="space-y-1 text-xs">
            {alerts.map((a) => (
              <li key={a.category} className="flex items-baseline justify-between gap-2">
                <span className="font-medium">
                  {getAssetCategoryLabel(a.category, t.assetCategories)}
                </span>
                <span className="font-semibold tabular-nums text-amber-700 dark:text-amber-400">
                  {formatPercent(a.currentPct, 1)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
