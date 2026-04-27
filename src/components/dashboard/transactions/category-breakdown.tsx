"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTHB } from "@/lib/utils/format";
import { getCategoryMeta, getTxCategoryLabel } from "@/lib/utils/constants";
import type { CategoryStat } from "@/types";
import { useTranslation } from "@/lib/i18n";

interface CategoryBreakdownProps {
  title: string;
  stats: CategoryStat[];
  total: number;
  isLoading?: boolean;
}

export function CategoryBreakdown({
  title,
  stats,
  total,
  isLoading,
}: CategoryBreakdownProps) {
  const { t } = useTranslation();
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
            {t.common.loading}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (stats.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
            {t.common.noData}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {stats.map((stat) => {
          const meta = getCategoryMeta(stat.category);
          return (
            <div key={stat.category} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: meta.color }}
                  />
                  <span>{getTxCategoryLabel(stat.category, t.incomeCategories, t.expenseCategories)}</span>
                  <span className="text-xs text-muted-foreground">
                    ({stat.count})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{formatTHB(stat.amount)}</span>
                  <span className="text-xs text-muted-foreground w-10 text-right">
                    {stat.percent.toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${stat.percent}%`,
                    backgroundColor: meta.color,
                  }}
                />
              </div>
            </div>
          );
        })}
        <div className="flex items-center justify-between border-t pt-2 text-sm font-medium">
          <span>{t.common.total}</span>
          <span>{formatTHB(total)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
