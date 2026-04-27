"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ASSET_CATEGORIES, getAssetCategoryLabel } from "@/lib/utils/constants";
import { formatTHB, formatPercent, abbreviateNumber } from "@/lib/utils/format";
import { useAssets } from "@/hooks/useAssets";
import { useTranslation } from "@/lib/i18n";

const INVESTMENT_CATEGORIES = [
  "stock_th",
  "stock_us",
  "mutual_fund",
  "crypto",
  "gold",
  "bond",
  "ssf_rmf",
];

function getCategoryColor(value: string) {
  return ASSET_CATEGORIES.find((c) => c.value === value)?.color ?? "#a1a1aa";
}

export default function PortfolioPage() {
  const { t } = useTranslation();
  const { data: assets = [], isLoading, isError } = useAssets();

  const { portfolioData, totalCurrent, totalCost, totalGain, totalGainPct, chartData, isEmpty } = useMemo(() => {
    const investmentAssets = assets.filter((a) =>
      INVESTMENT_CATEGORIES.includes(a.category)
    );

    const grouped = investmentAssets.reduce<
      Record<string, { currentValue: number; costBasis: number }>
    >((acc, a) => {
      if (!acc[a.category]) acc[a.category] = { currentValue: 0, costBasis: 0 };
      acc[a.category].currentValue += a.current_value;
      acc[a.category].costBasis += a.cost_basis;
      return acc;
    }, {});

    const pd = Object.entries(grouped).map(([category, data]) => ({
      category,
      ...data,
    }));

    const tc = pd.reduce((s, p) => s + p.currentValue, 0);
    const tco = pd.reduce((s, p) => s + p.costBasis, 0);
    const tg = tc - tco;

    return {
      portfolioData: pd,
      totalCurrent: tc,
      totalCost: tco,
      totalGain: tg,
      totalGainPct: tco > 0 ? (tg / tco) * 100 : 0,
      chartData: pd.map((p) => ({
        name: getAssetCategoryLabel(p.category, t.assetCategories),
        value: p.currentValue,
        color: getCategoryColor(p.category),
      })),
      isEmpty: pd.length === 0,
    };
  }, [assets, t.assetCategories]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-muted-foreground">{t.common.loading}</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-red-600">{t.common.errorLoadData}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t.portfolio.title}</h1>
        {!isEmpty && (
          <p className="text-sm text-muted-foreground">
            {t.portfolio.totalValue} {formatTHB(totalCurrent)} · {t.portfolio.gainLoss}{" "}
            <span
              className={totalGain >= 0 ? "text-emerald-600" : "text-red-600"}
            >
              {totalGain >= 0 ? "+" : ""}
              {formatTHB(totalGain)} ({formatPercent(totalGainPct)})
            </span>
          </p>
        )}
      </div>

      {isEmpty ? (
        <Card>
          <CardContent className="flex h-40 items-center justify-center text-muted-foreground">
            {t.portfolio.noInvestmentData}
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t.portfolio.valueByType}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" barSize={28}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                      strokeOpacity={0.5}
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                      tickFormatter={(v) => `฿${abbreviateNumber(v)}`}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                      width={120}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(value) => formatTHB(Number(value))}
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        backgroundColor: 'rgba(12, 31, 63, 0.95)',
                        backdropFilter: 'blur(8px)',
                        color: '#fff',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                        padding: '12px 16px',
                      }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} name={t.portfolio.value}>
                      {chartData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t.portfolio.returnsByType}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm" aria-label={t.portfolio.returnsByType}>
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-3 font-medium">{t.portfolio.type}</th>
                      <th className="pb-3 text-right font-medium">{t.portfolio.cost}</th>
                      <th className="pb-3 text-right font-medium">{t.portfolio.currentValue}</th>
                      <th className="pb-3 text-right font-medium">{t.portfolio.gainLoss}</th>
                      <th className="pb-3 text-right font-medium">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolioData.map((p) => {
                      const gain = p.currentValue - p.costBasis;
                      const gainPct = p.costBasis > 0 ? (gain / p.costBasis) * 100 : 0;
                      return (
                        <tr key={p.category} className="border-b last:border-0">
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <div
                                className="h-3 w-3 rounded-full"
                                style={{
                                  backgroundColor: getCategoryColor(p.category),
                                }}
                              />
                              {getAssetCategoryLabel(p.category, t.assetCategories)}
                            </div>
                          </td>
                          <td className="py-3 text-right">
                            {formatTHB(p.costBasis)}
                          </td>
                          <td className="py-3 text-right font-medium">
                            {formatTHB(p.currentValue)}
                          </td>
                          <td
                            className={`py-3 text-right font-medium ${
                              gain >= 0 ? "text-emerald-600" : "text-red-600"
                            }`}
                          >
                            {gain >= 0 ? "+" : ""}
                            {formatTHB(gain)}
                          </td>
                          <td
                            className={`py-3 text-right font-medium ${
                              gain >= 0 ? "text-emerald-600" : "text-red-600"
                            }`}
                          >
                            {formatPercent(gainPct)}
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="font-semibold">
                      <td className="pt-3">{t.common.total}</td>
                      <td className="pt-3 text-right">{formatTHB(totalCost)}</td>
                      <td className="pt-3 text-right">{formatTHB(totalCurrent)}</td>
                      <td
                        className={`pt-3 text-right ${
                          totalGain >= 0 ? "text-emerald-600" : "text-red-600"
                        }`}
                      >
                        {totalGain >= 0 ? "+" : ""}
                        {formatTHB(totalGain)}
                      </td>
                      <td
                        className={`pt-3 text-right ${
                          totalGain >= 0 ? "text-emerald-600" : "text-red-600"
                        }`}
                      >
                        {formatPercent(totalGainPct)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
