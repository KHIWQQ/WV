"use client";

import { useMemo, useId } from "react";
import { useTranslation } from "@/lib/i18n";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { abbreviateNumber } from "@/lib/utils/format";
import {
  CHART_TOOLTIP_CONTENT,
  CHART_TOOLTIP_LABEL,
  CHART_TOOLTIP_ITEM,
} from "@/lib/utils/chart-style";
import type { NetWorthHistory } from "@/types";

interface NetWorthChartProps {
  data?: NetWorthHistory[];
}

export function NetWorthChart({ data = [] }: NetWorthChartProps) {
  const { t } = useTranslation();
  const id = useId();
  const netWorthGradId = `netWorthGrad-${id}`;
  const assetsGradId = `assetsGrad-${id}`;
  const monthLabels = Object.values(t.monthsShort);

  const chartData = useMemo(() => data.map((d) => {
    const date = new Date(d.recorded_at);
    return {
      month: monthLabels[date.getMonth()],
      netWorth: d.net_worth,
      assets: d.total_assets,
      liabilities: d.total_liabilities,
    };
  }), [data, monthLabels]);

  const isEmpty = chartData.length === 0;

  return (
    <Card variant="glass" className="col-span-full transition-all duration-300 hover:shadow-glow/50">
      <CardHeader>
        <CardTitle className="text-lg font-bold bg-clip-text">{t.dashboard.netWorth}</CardTitle>
      </CardHeader>
      <CardContent>
        {isEmpty ? (
          <div className="flex h-[350px] items-center justify-center text-muted-foreground/70 font-medium">
            {t.dashboard.noNetWorthHistory}
          </div>
        ) : (
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id={netWorthGradId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4A843" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#D4A843" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id={assetsGradId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.5} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `฿${abbreviateNumber(v)}`}
                  dx={-10}
                />
                <Tooltip
                  formatter={(value) =>
                    `฿${Number(value).toLocaleString("th-TH")}`
                  }
                  labelStyle={CHART_TOOLTIP_LABEL}
                  contentStyle={CHART_TOOLTIP_CONTENT}
                  itemStyle={CHART_TOOLTIP_ITEM}
                />
                <Area
                  type="monotone"
                  dataKey="assets"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill={`url(#${assetsGradId})`}
                  name={t.dashboard.totalAssets}
                  animationDuration={1500}
                />
                <Area
                  type="monotone"
                  dataKey="netWorth"
                  stroke="#D4A843"
                  strokeWidth={3}
                  fill={`url(#${netWorthGradId})`}
                  name={t.dashboard.netWorth}
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
