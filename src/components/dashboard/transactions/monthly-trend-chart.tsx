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
import type { MonthlyTrendPoint } from "@/types";
import { useTranslation } from "@/lib/i18n";

interface MonthlyTrendChartProps {
  data: MonthlyTrendPoint[];
  isLoading?: boolean;
}

export function MonthlyTrendChart({ data, isLoading }: MonthlyTrendChartProps) {
  const { t } = useTranslation();
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">{t.transactions.monthlyTrend}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
            {t.common.loading}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">{t.transactions.monthlyTrend}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
            {t.common.noData}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">{t.transactions.monthlyTrend}</CardTitle>
      </CardHeader>
      <CardContent>
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
              tickFormatter={(v) =>
                v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)
              }
            />
            <Tooltip
              formatter={(value, name) => {
                const labels: Record<string, string> = {
                  income: t.transactions.income,
                  expense: t.transactions.expense,
                  net: t.transactions.balance,
                };
                return [formatTHB(Number(value ?? 0)), labels[String(name)] ?? name];
              }}
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid hsl(var(--border))",
                fontSize: "12px",
              }}
            />
            <Bar dataKey="income" fill="#22c55e" radius={[2, 2, 0, 0]} barSize={16} />
            <Bar dataKey="expense" fill="#ef4444" radius={[2, 2, 0, 0]} barSize={16} />
            <Line
              type="monotone"
              dataKey="net"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
        <div className="mt-2 flex justify-center gap-4">
          <div className="flex items-center gap-1 text-xs">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
            {t.transactions.income}
          </div>
          <div className="flex items-center gap-1 text-xs">
            <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
            {t.transactions.expense}
          </div>
          <div className="flex items-center gap-1 text-xs">
            <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
            {t.transactions.balance}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
