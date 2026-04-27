"use client";

import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { useMarketHistory } from "@/hooks/useMarket";
import type { TimeRange } from "@/types";

const RANGES: { value: TimeRange; label: string }[] = [
  { value: "5d", label: "5D" },
  { value: "1mo", label: "1M" },
  { value: "3mo", label: "3M" },
  { value: "6mo", label: "6M" },
  { value: "1y", label: "1Y" },
  { value: "5y", label: "5Y" },
  { value: "max", label: "Max" },
];

interface PriceChartProps {
  symbol: string;
  name?: string;
}

export function PriceChart({ symbol, name }: PriceChartProps) {
  const { t } = useTranslation();
  const [range, setRange] = useState<TimeRange>("3mo");
  const { data: history = [], isLoading } = useMarketHistory(symbol, range);

  const first = history[0]?.close ?? 0;
  const last = history[history.length - 1]?.close ?? 0;
  const isUp = last >= first;
  const strokeColor = isUp ? "#10b981" : "#ef4444";

  return (
    <Card variant="glass">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg font-bold">
          {name || symbol}
        </CardTitle>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <Button
              key={r.value}
              variant={range === r.value ? "default" : "ghost"}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setRange(r.value)}
            >
              {r.label}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-[350px] items-center justify-center text-muted-foreground">
            {t.market.loadingChart}
          </div>
        ) : history.length === 0 ? (
          <div className="flex h-[350px] items-center justify-center text-muted-foreground">
            {t.market.noPriceData}
          </div>
        ) : (
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={history}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id={`priceGrad-${symbol}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={strokeColor} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="hsl(var(--border))"
                  strokeOpacity={0.5}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                  tickFormatter={(d) => {
                    const date = new Date(d);
                    return `${date.getDate()}/${date.getMonth() + 1}`;
                  }}
                  interval="preserveStartEnd"
                  minTickGap={40}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                  dx={-10}
                  domain={["auto", "auto"]}
                  tickFormatter={(v) => v.toLocaleString("th-TH")}
                />
                <Tooltip
                  formatter={(value) => [
                    Number(value).toLocaleString("th-TH", { minimumFractionDigits: 2 }),
                    t.market.price,
                  ]}
                  labelFormatter={(label) => {
                    const d = new Date(label);
                    return d.toLocaleDateString("th-TH", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    });
                  }}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    backgroundColor: "rgba(12, 31, 63, 0.95)",
                    backdropFilter: "blur(8px)",
                    color: "#fff",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
                    padding: "12px 16px",
                  }}
                  labelStyle={{ fontWeight: 600, color: "#fff", marginBottom: "8px" }}
                  itemStyle={{ color: "#fff", padding: "2px 0" }}
                />
                <Area
                  type="monotone"
                  dataKey="close"
                  stroke={strokeColor}
                  strokeWidth={2}
                  fill={`url(#priceGrad-${symbol})`}
                  animationDuration={1000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
