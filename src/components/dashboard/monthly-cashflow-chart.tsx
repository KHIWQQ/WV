"use client";

import { useMemo } from "react";
import { useTranslation } from "@/lib/i18n";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CHART_TOOLTIP_CONTENT,
  CHART_TOOLTIP_LABEL,
  CHART_TOOLTIP_ITEM,
  CHART_TOOLTIP_CURSOR,
} from "@/lib/utils/chart-style";
import { abbreviateNumber } from "@/lib/utils/format";
import type { Transaction } from "@/types";

interface MonthlyCashflowChartProps {
  transactions?: Transaction[];
}

export function MonthlyCashflowChart({ transactions = [] }: MonthlyCashflowChartProps) {
  const { t } = useTranslation();
  const monthLabels = Object.values(t.monthsShort);

  const { months, isEmpty } = useMemo(() => {
    const now = new Date();
    const ms: { key: string; month: string; income: number; expense: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      ms.push({
        key,
        month: monthLabels[d.getMonth()],
        income: 0,
        expense: 0,
      });
    }

    for (const tx of transactions) {
      // Parse date string directly to avoid timezone issues
      const parts = String(tx.date).split("T")[0].split("-");
      const key = `${parts[0]}-${parts[1]}`;
      const bucket = ms.find((m) => m.key === key);
      if (!bucket) continue;
      // Only count actual income/expense, not buy/sell (investment transactions)
      if (tx.type === "income") {
        bucket.income += tx.amount;
      } else if (tx.type === "expense") {
        bucket.expense += tx.amount;
      }
    }

    return { months: ms, isEmpty: transactions.length === 0 };
  }, [transactions, monthLabels]);

  return (
    <Card variant="glass" className="transition-all duration-300 hover:shadow-glow/50">
      <CardHeader>
        <CardTitle className="text-lg font-bold bg-clip-text">{t.dashboard.cashflow6Months}</CardTitle>
      </CardHeader>
      <CardContent>
        {isEmpty ? (
          <div className="flex h-[300px] items-center justify-center text-muted-foreground/70 font-medium">
            {t.dashboard.noIncomeExpenseData}
          </div>
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={months} barGap={6} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                  cursor={CHART_TOOLTIP_CURSOR}
                />
                <Legend
                  formatter={(value) =>
                    <span className="text-foreground font-medium">{value === "income" ? t.transactions.income : t.transactions.expense}</span>
                  }
                  wrapperStyle={{ paddingTop: '20px' }}
                />
                <Bar
                  dataKey="income"
                  fill="#10b981"
                  radius={[6, 6, 0, 0]}
                  name="income"
                  animationDuration={1500}
                />
                <Bar
                  dataKey="expense"
                  fill="#f43f5e"
                  radius={[6, 6, 0, 0]}
                  name="expense"
                  animationDuration={1500}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
