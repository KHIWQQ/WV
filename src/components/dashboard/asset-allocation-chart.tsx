"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { useTranslation } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ASSET_CATEGORIES, getAssetCategoryLabel } from "@/lib/utils/constants";
import { formatTHB } from "@/lib/utils/format";
import type { Asset } from "@/types";

function getCategoryColor(value: string) {
  return ASSET_CATEGORIES.find((c) => c.value === value)?.color ?? "#a1a1aa";
}

interface AssetAllocationChartProps {
  assets?: Asset[];
}

export function AssetAllocationChart({ assets = [] }: AssetAllocationChartProps) {
  const { t } = useTranslation();
  const { chartData, total, isEmpty } = useMemo(() => {
    const grouped = assets.reduce<Record<string, number>>((acc, a) => {
      acc[a.category] = (acc[a.category] || 0) + a.current_value;
      return acc;
    }, {});

    const cd = Object.entries(grouped).map(([category, value]) => ({
      category,
      value,
    }));

    return {
      chartData: cd,
      total: cd.reduce((sum, d) => sum + d.value, 0),
      isEmpty: cd.length === 0,
    };
  }, [assets]);

  return (
    <Card variant="glass" className="overflow-hidden transition-all duration-300 hover:shadow-glow/50">
      <CardHeader>
        <CardTitle className="text-lg font-bold bg-clip-text">{t.dashboard.assetAllocation}</CardTitle>
      </CardHeader>
      <CardContent>
        {isEmpty ? (
          <div className="flex h-[250px] items-center justify-center text-muted-foreground/70 font-medium">
            {t.dashboard.noAssetData}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 md:flex-row">
            <div className="h-[250px] w-[250px] relative">
              {/* Optional: Add a subtle glow behind the chart */}
              <div className="absolute inset-0 bg-gold/5 blur-2xl rounded-full" />
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {chartData.map((entry) => (
                      <Cell
                        key={entry.category}
                        fill={getCategoryColor(entry.category)}
                        className="transition-all duration-300 hover:opacity-80 cursor-pointer"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatTHB(Number(value))}
                    labelFormatter={(_, payload) =>
                      payload?.[0]
                        ? getAssetCategoryLabel(
                          payload[0].payload.category as string,
                          t.assetCategories
                        )
                        : ""
                    }
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid rgba(255,255,255,0.1)',
                      backgroundColor: 'rgba(12, 31, 63, 0.95)',
                      backdropFilter: 'blur(8px)',
                      color: '#fff',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                      padding: '12px'
                    }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="flex-1 w-full space-y-3">
              {chartData.map((item) => {
                const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0.0";
                return (
                  <div
                    key={item.category}
                    className="group flex items-center justify-between text-sm p-2 rounded-lg transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="h-3 w-3 rounded-full shadow-sm"
                        style={{
                          backgroundColor: getCategoryColor(item.category),
                        }}
                      />
                      <span className="font-medium text-foreground/90 group-hover:text-foreground transition-colors">{getAssetCategoryLabel(item.category, t.assetCategories)}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground w-12 text-right">{pct}%</span>
                      <span className="w-28 text-right font-semibold text-foreground">
                        {formatTHB(item.value)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
