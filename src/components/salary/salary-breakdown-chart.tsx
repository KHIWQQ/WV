"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTHB } from "@/lib/utils/format";
import { CHART_TOOLTIP_CONTENT, CHART_TOOLTIP_ITEM } from "@/lib/utils/chart-style";
import type { SalaryBreakdownItem } from "@/types";
import { useTranslation } from "@/lib/i18n";

interface SalaryBreakdownChartProps {
  title: string;
  items: SalaryBreakdownItem[];
  /** Resolve a taxonomy key → display label + color. */
  resolve: (key: string) => { label: string; color: string };
}

export function SalaryBreakdownChart({ title, items, resolve }: SalaryBreakdownChartProps) {
  const { t } = useTranslation();

  const chartData = items.map((item) => {
    const meta = resolve(item.key);
    return { name: meta.label, value: item.amount, color: meta.color, percent: item.percent };
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
            {t.common.noData}
          </div>
        ) : (
          <>
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
              {chartData.map((d) => (
                <div key={d.name} className="flex items-center gap-1 text-xs">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: d.color }}
                  />
                  {d.name}
                  <span className="text-muted-foreground">{d.percent.toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
