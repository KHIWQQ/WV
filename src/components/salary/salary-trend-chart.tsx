"use client";

import {
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTHB } from "@/lib/utils/format";
import {
  CHART_TOOLTIP_CONTENT,
  CHART_TOOLTIP_LABEL,
  CHART_TOOLTIP_ITEM,
} from "@/lib/utils/chart-style";
import type { SalaryTrendPoint } from "@/types";
import { useTranslation } from "@/lib/i18n";

interface SalaryTrendChartProps {
  data: SalaryTrendPoint[];
}

export function SalaryTrendChart({ data }: SalaryTrendChartProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">{t.salary.monthlyTrend}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
            {t.common.noData}
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={250}>
              <ComposedChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10 }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={50}
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v))}
                />
                <Tooltip
                  formatter={(value, name) => {
                    const labels: Record<string, string> = {
                      gross: t.salary.grossRta,
                      deductions: t.salary.totalDeductions,
                      net: t.salary.netRta,
                    };
                    return [formatTHB(Number(value ?? 0)), labels[String(name)] ?? name];
                  }}
                  contentStyle={CHART_TOOLTIP_CONTENT}
                  labelStyle={CHART_TOOLTIP_LABEL}
                  itemStyle={CHART_TOOLTIP_ITEM}
                />
                <Bar dataKey="gross" fill="#0C1F3F" radius={[2, 2, 0, 0]} barSize={16} />
                <Bar dataKey="deductions" fill="#ef4444" radius={[2, 2, 0, 0]} barSize={16} />
                <Line type="monotone" dataKey="net" stroke="#D4A843" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
            <div className="mt-2 flex justify-center gap-4">
              <div className="flex items-center gap-1 text-xs">
                <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: "#0C1F3F" }} />
                {t.salary.grossRta}
              </div>
              <div className="flex items-center gap-1 text-xs">
                <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
                {t.salary.totalDeductions}
              </div>
              <div className="flex items-center gap-1 text-xs">
                <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: "#D4A843" }} />
                {t.salary.netRta}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
