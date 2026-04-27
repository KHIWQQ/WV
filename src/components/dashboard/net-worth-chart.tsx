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
                  labelStyle={{ fontWeight: 600, color: '#fff', marginBottom: '8px' }}
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    backgroundColor: 'rgba(12, 31, 63, 0.95)',
                    backdropFilter: 'blur(8px)',
                    color: '#fff',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                    padding: '12px 16px'
                  }}
                  itemStyle={{ color: '#fff', padding: '2px 0' }}
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
