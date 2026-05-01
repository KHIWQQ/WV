"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTHB } from "@/lib/utils/format";
import { getCategoryMeta, getTxCategoryLabel } from "@/lib/utils/constants";
import { CHART_TOOLTIP_CONTENT, CHART_TOOLTIP_ITEM } from "@/lib/utils/chart-style";
import type { CategoryStat } from "@/types";
import { useTranslation } from "@/lib/i18n";

interface ExpenseDonutChartProps {
  stats: CategoryStat[];
  isLoading?: boolean;
}

export function ExpenseDonutChart({ stats, isLoading }: ExpenseDonutChartProps) {
  const { t } = useTranslation();
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">{t.transactions.expenseRatio}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
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
          <CardTitle className="text-sm">{t.transactions.expenseRatio}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
            {t.common.noData}
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = stats.map((s) => {
    const meta = getCategoryMeta(s.category);
    return {
      name: getTxCategoryLabel(s.category, t.incomeCategories, t.expenseCategories),
      value: s.amount,
      color: meta.color,
    };
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">{t.transactions.expenseRatio}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              dataKey="value"
              stroke="none"
            >
              {chartData.map((entry, idx) => (
                <Cell key={idx} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => formatTHB(Number(value ?? 0))}
              contentStyle={CHART_TOOLTIP_CONTENT}
              itemStyle={CHART_TOOLTIP_ITEM}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
          {chartData.slice(0, 5).map((d) => (
            <div key={d.name} className="flex items-center gap-1 text-xs">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: d.color }}
              />
              {d.name}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
