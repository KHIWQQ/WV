"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Target, TrendingUp, CalendarDays, CheckCircle2, AlertTriangle } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { formatTHB } from "@/lib/utils/format";
import { useAppStore, selectTotalAssets } from "@/stores/useAppStore";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { abbreviateNumber } from "@/lib/utils/format";

interface RetirementResult {
  projectedWealth: number;
  requiredWealth: number;
  surplus: number;
  isOnTrack: boolean;
  additionalMonthlyNeeded: number;
  chartData: { age: number; projected: number; target: number }[];
}

function calculateRetirement(
  currentAge: number,
  retireAge: number,
  lifeExpectancy: number,
  currentSavings: number,
  monthlyContribution: number,
  expectedReturn: number,
  inflationRate: number,
  monthlyExpenseRetire: number,
): RetirementResult {
  const yearsToRetire = Math.max(retireAge - currentAge, 1);
  const yearsInRetirement = Math.max(lifeExpectancy - retireAge, 1);
  const realReturn = (1 + expectedReturn / 100) / (1 + inflationRate / 100) - 1;
  const monthlyRealReturn = Math.pow(1 + realReturn, 1 / 12) - 1;

  // Future value of current savings + monthly contributions at retirement
  let projectedWealth = currentSavings;
  const chartData: { age: number; projected: number; target: number }[] = [];

  // Calculate required wealth at retirement (present value of retirement expenses)
  const annualExpense = monthlyExpenseRetire * 12;
  let requiredWealth = 0;
  if (realReturn > 0.0001) {
    requiredWealth = annualExpense * ((1 - Math.pow(1 + realReturn, -yearsInRetirement)) / realReturn);
  } else {
    requiredWealth = annualExpense * yearsInRetirement;
  }

  // Build chart data year by year
  let wealth = currentSavings;
  for (let year = 0; year <= yearsToRetire; year++) {
    const age = currentAge + year;
    // Linear interpolation for target line
    const targetAtAge = requiredWealth * (year / yearsToRetire);
    chartData.push({
      age,
      projected: Math.round(wealth),
      target: Math.round(targetAtAge),
    });
    // Compound for next year
    for (let m = 0; m < 12; m++) {
      wealth = wealth * (1 + monthlyRealReturn) + monthlyContribution;
    }
  }

  projectedWealth = Math.round(wealth);
  const surplus = projectedWealth - requiredWealth;

  // Calculate additional monthly savings needed if shortfall
  let additionalMonthlyNeeded = 0;
  if (surplus < 0) {
    const shortfall = -surplus;
    // PMT formula: shortfall = pmt * ((1+r)^n - 1) / r
    const totalMonths = yearsToRetire * 12;
    if (monthlyRealReturn > 0.0001) {
      additionalMonthlyNeeded = shortfall * monthlyRealReturn / (Math.pow(1 + monthlyRealReturn, totalMonths) - 1);
    } else {
      additionalMonthlyNeeded = shortfall / totalMonths;
    }
  }

  return {
    projectedWealth,
    requiredWealth: Math.round(requiredWealth),
    surplus: Math.round(surplus),
    isOnTrack: surplus >= 0,
    additionalMonthlyNeeded: Math.round(additionalMonthlyNeeded),
    chartData,
  };
}

export default function RetirementPage() {
  const { t } = useTranslation();
  const totalAssets = useAppStore(selectTotalAssets);

  const [currentAge, setCurrentAge] = useState(30);
  const [retireAge, setRetireAge] = useState(60);
  const [lifeExpectancy, setLifeExpectancy] = useState(85);
  const [currentSavings, setCurrentSavings] = useState(totalAssets);
  const [monthlyContribution, setMonthlyContribution] = useState(10000);
  const [expectedReturn, setExpectedReturn] = useState(7);
  const [inflationRate, setInflationRate] = useState(3);
  const [monthlyExpenseRetire, setMonthlyExpenseRetire] = useState(30000);
  const [calculated, setCalculated] = useState(false);

  const result = useMemo(() => {
    if (!calculated) return null;
    return calculateRetirement(
      currentAge, retireAge, lifeExpectancy,
      currentSavings, monthlyContribution,
      expectedReturn, inflationRate, monthlyExpenseRetire,
    );
  }, [calculated, currentAge, retireAge, lifeExpectancy, currentSavings, monthlyContribution, expectedReturn, inflationRate, monthlyExpenseRetire]);

  const handleCalculate = () => setCalculated(true);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t.retirement.title}</h1>
          <p className="text-sm text-muted-foreground">{t.retirement.subtitle}</p>
        </div>
      </div>

      {/* Step cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card variant="glass">
          <CardContent className="flex flex-col items-center justify-center p-6 text-center">
            <div className="mb-4 rounded-full bg-emerald-500/10 p-3 text-emerald-500">
              <Target className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold">{t.retirement.step1Title}</h3>
            <p className="text-sm text-muted-foreground mt-2">{t.retirement.step1Desc}</p>
          </CardContent>
        </Card>
        <Card variant="glass">
          <CardContent className="flex flex-col items-center justify-center p-6 text-center">
            <div className="mb-4 rounded-full bg-blue-500/10 p-3 text-blue-500">
              <TrendingUp className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold">{t.retirement.step2Title}</h3>
            <p className="text-sm text-muted-foreground mt-2">{t.retirement.step2Desc}</p>
          </CardContent>
        </Card>
        <Card variant="glass">
          <CardContent className="flex flex-col items-center justify-center p-6 text-center">
            <div className="mb-4 rounded-full bg-gold/10 p-3 text-gold">
              <CalendarDays className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold">{t.retirement.step3Title}</h3>
            <p className="text-sm text-muted-foreground mt-2">{t.retirement.step3Desc}</p>
          </CardContent>
        </Card>
      </div>

      {/* Calculator form */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle>{t.retirement.calculate}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="currentAge">{t.retirement.currentAge}</Label>
              <Input id="currentAge" type="number" value={currentAge} onChange={(e) => { setCurrentAge(+e.target.value); setCalculated(false); }} min={18} max={80} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="retireAge">{t.retirement.retireAge}</Label>
              <Input id="retireAge" type="number" value={retireAge} onChange={(e) => { setRetireAge(+e.target.value); setCalculated(false); }} min={currentAge + 1} max={90} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lifeExpectancy">{t.retirement.lifeExpectancy}</Label>
              <Input id="lifeExpectancy" type="number" value={lifeExpectancy} onChange={(e) => { setLifeExpectancy(+e.target.value); setCalculated(false); }} min={retireAge + 1} max={120} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currentSavings">{t.retirement.currentSavings}</Label>
              <Input id="currentSavings" type="number" value={currentSavings} onChange={(e) => { setCurrentSavings(+e.target.value); setCalculated(false); }} min={0} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="monthlyContribution">{t.retirement.monthlyContribution}</Label>
              <Input id="monthlyContribution" type="number" value={monthlyContribution} onChange={(e) => { setMonthlyContribution(+e.target.value); setCalculated(false); }} min={0} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expectedReturn">{t.retirement.expectedReturn}</Label>
              <Input id="expectedReturn" type="number" value={expectedReturn} onChange={(e) => { setExpectedReturn(+e.target.value); setCalculated(false); }} min={0} max={30} step={0.5} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inflationRate">{t.retirement.inflationRate}</Label>
              <Input id="inflationRate" type="number" value={inflationRate} onChange={(e) => { setInflationRate(+e.target.value); setCalculated(false); }} min={0} max={20} step={0.5} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="monthlyExpenseRetire">{t.retirement.monthlyExpenseRetire}</Label>
              <Input id="monthlyExpenseRetire" type="number" value={monthlyExpenseRetire} onChange={(e) => { setMonthlyExpenseRetire(+e.target.value); setCalculated(false); }} min={0} />
            </div>
          </div>
          <Button variant="gold" className="mt-6 w-full sm:w-auto" onClick={handleCalculate}>
            {t.retirement.calculate}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card variant="glass">
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">{t.retirement.projectedWealth}</p>
                <p className="text-2xl font-bold text-foreground mt-1">{formatTHB(result.projectedWealth)}</p>
              </CardContent>
            </Card>
            <Card variant="glass">
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">{t.retirement.requiredWealth}</p>
                <p className="text-2xl font-bold text-foreground mt-1">{formatTHB(result.requiredWealth)}</p>
              </CardContent>
            </Card>
            <Card variant="glass" className={result.isOnTrack ? "border-emerald-500/30" : "border-red-500/30"}>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">
                  {result.isOnTrack ? t.retirement.surplus : t.retirement.shortfall}
                </p>
                <p className={`text-2xl font-bold mt-1 ${result.isOnTrack ? "text-emerald-500" : "text-red-500"}`}>
                  {formatTHB(Math.abs(result.surplus))}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Status message */}
          <Card variant="glass" className={result.isOnTrack ? "border-emerald-500/20" : "border-red-500/20"}>
            <CardContent className="flex items-center gap-4 p-6">
              {result.isOnTrack ? (
                <>
                  <div className="rounded-full bg-emerald-500/10 p-3">
                    <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                  </div>
                  <div>
                    <p className="font-bold text-emerald-500">{t.retirement.onTrack}</p>
                    <p className="text-sm text-muted-foreground">
                      {t.retirement.surplus}: {formatTHB(result.surplus)}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="rounded-full bg-red-500/10 p-3">
                    <AlertTriangle className="h-6 w-6 text-red-500" />
                  </div>
                  <div>
                    <p className="font-bold text-red-500">{t.retirement.needMore}</p>
                    <p className="text-sm text-muted-foreground">
                      +{formatTHB(result.additionalMonthlyNeeded)} {t.retirement.perMonth}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Projection chart */}
          <Card variant="glass">
            <CardHeader>
              <CardTitle>{t.retirement.wealthProjection}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={result.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="projectedGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#D4A843" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#D4A843" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="targetGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.5} />
                    <XAxis
                      dataKey="age"
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                      tickLine={false}
                      axisLine={false}
                      label={{ value: t.retirement.age, position: "insideBottom", offset: -5, fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `฿${abbreviateNumber(v)}`}
                    />
                    <Tooltip
                      formatter={(value) => `฿${Number(value).toLocaleString("th-TH")}`}
                      labelFormatter={(label) => `${t.retirement.age} ${label}`}
                      labelStyle={{ fontWeight: 600, color: '#fff', marginBottom: '8px' }}
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        backgroundColor: 'rgba(12, 31, 63, 0.95)',
                        backdropFilter: 'blur(8px)',
                        color: '#fff',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                        padding: '12px 16px',
                      }}
                      itemStyle={{ color: '#fff', padding: '2px 0' }}
                    />
                    <ReferenceLine
                      y={result.requiredWealth}
                      stroke="#ef4444"
                      strokeDasharray="6 4"
                      strokeWidth={2}
                      label={{ value: t.retirement.targetLine, position: "insideTopRight", fill: "#ef4444", fontSize: 12 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="projected"
                      stroke="#D4A843"
                      strokeWidth={3}
                      fill="url(#projectedGrad)"
                      name={t.retirement.projectedLine}
                      animationDuration={1500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
