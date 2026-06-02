"use client";

import { useState, useMemo, useCallback } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatTHB } from "@/lib/utils/format";
import {
  summarizeSalary,
  salaryTrend,
  sumAmountMap,
  netRtaPay,
  extraIncome,
  SALARY_DEDUCTION_TYPES,
  SALARY_INCOME_STREAMS,
} from "@/lib/utils/salary-constants";
import {
  useSalaryRecords,
  useSalaryGpf,
  useDeleteSalaryRecord,
} from "@/hooks/useSalary";
import { SalaryFormDialog } from "@/components/salary/salary-form-dialog";
import { GpfFormDialog } from "@/components/salary/gpf-form-dialog";
import { GpfSummaryCard } from "@/components/salary/gpf-summary-card";
import { SalaryTrendChart } from "@/components/salary/salary-trend-chart";
import { SalaryBreakdownChart } from "@/components/salary/salary-breakdown-chart";
import { SalaryImportCard } from "@/components/salary/salary-import-card";
import { useTranslation } from "@/lib/i18n";
import type { SalaryRecord } from "@/types";

const INTL_LOCALE: Record<string, string> = { th: "th-TH", en: "en-US", zh: "zh-CN" };

export default function SalaryPage() {
  const { t, locale } = useTranslation();
  const { data: records = [], isLoading, isError } = useSalaryRecords();
  const { data: gpf = null } = useSalaryGpf();
  const deleteMutation = useDeleteSalaryRecord();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SalaryRecord | null>(null);
  const [gpfOpen, setGpfOpen] = useState(false);

  const summary = useMemo(() => summarizeSalary(records), [records]);

  const monthFmt = useMemo(
    () => new Intl.DateTimeFormat(INTL_LOCALE[locale] ?? "th-TH", { month: "short", year: "numeric" }),
    [locale]
  );
  // Parse "YYYY-MM(-DD)" from its parts so the label never shifts a month in
  // negative-UTC-offset timezones (new Date("2025-01-01") would be UTC midnight).
  const periodLabel = useCallback(
    (period: string) => {
      const [y, m] = period.split("-").map(Number);
      if (!y || !m) return period.slice(0, 7);
      return monthFmt.format(new Date(y, m - 1, 1));
    },
    [monthFmt]
  );

  // Localize the trend x-axis labels (salaryTrend emits raw YYYY-MM).
  const trend = useMemo(
    () => salaryTrend(records).map((p) => ({ ...p, label: periodLabel(p.period) })),
    [records, periodLabel]
  );

  const dedLabel = (key: string) => {
    const meta = SALARY_DEDUCTION_TYPES.find((d) => d.key === key);
    return {
      label: meta ? t.salary.deductions[meta.labelKey] : key,
      color: meta?.color ?? "#94a3b8",
    };
  };
  const incomeLabel = (key: string) => {
    const meta = SALARY_INCOME_STREAMS.find((s) => s.key === key);
    return {
      label: meta ? t.salary.streams[meta.labelKey] : key,
      color: meta?.color ?? "#94a3b8",
    };
  };

  const gpfGrand = gpf
    ? gpf.own_principal + gpf.own_gain + gpf.gov_principal + gpf.gov_gain + gpf.atb_balance
    : 0;

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
        <div className="text-red-600 dark:text-red-400">{t.common.errorLoadData}</div>
      </div>
    );
  }

  function handleAdd() {
    setEditing(null);
    setDialogOpen(true);
  }
  function handleEdit(record: SalaryRecord) {
    setEditing(record);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t.salary.title}</h1>
          <p className="text-sm text-muted-foreground">{t.salary.subtitle}</p>
        </div>
        <Button className="gap-2" onClick={handleAdd}>
          <Plus className="h-4 w-4" />
          {t.salary.addRecord}
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t.salary.grandTotal}
          hint={t.salary.grandTotalHint}
          value={formatTHB(summary.grandTotal)}
          tone="positive"
        />
        <StatCard label={t.salary.totalNetLabel} value={formatTHB(summary.totalNet)} />
        <StatCard
          label={t.salary.totalDeductionsLabel}
          value={formatTHB(summary.totalDeductions)}
          tone="negative"
        />
        <StatCard
          label={t.salary.currentGpf}
          hint={`${summary.monthsTracked} ${t.salary.monthsTracked}`}
          value={formatTHB(gpfGrand)}
        />
      </div>

      <Tabs defaultValue="ledger">
        <TabsList className="flex-wrap">
          <TabsTrigger value="ledger">{t.salary.ledgerTab}</TabsTrigger>
          <TabsTrigger value="breakdown">{t.salary.breakdownTab}</TabsTrigger>
          <TabsTrigger value="gpf">{t.salary.gpfTab}</TabsTrigger>
          <TabsTrigger value="import">{t.salary.importTab}</TabsTrigger>
        </TabsList>

        {/* Ledger */}
        <TabsContent value="ledger" className="space-y-3">
          {records.length === 0 ? (
            <Card>
              <CardContent className="flex h-40 items-center justify-center text-muted-foreground">
                {t.salary.noRecords}
              </CardContent>
            </Card>
          ) : (
            records.map((r) => {
              const net = netRtaPay(r.gross_rta, r.deductions);
              const extra = extraIncome(r);
              return (
                <Card key={r.id}>
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div className="min-w-[8rem]">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{periodLabel(r.period)}</p>
                        {r.is_backpay && (
                          <Badge variant="secondary" className="text-[10px]">
                            {t.salary.backpayBadge}
                          </Badge>
                        )}
                      </div>
                      {r.rank && (
                        <p className="text-xs text-muted-foreground">
                          {t.salary.ranks[r.rank as keyof typeof t.salary.ranks] ?? r.rank}
                          {r.pay_step ? ` · ${r.pay_step}` : ""}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
                      <Metric label={t.salary.grossRta} value={formatTHB(r.gross_rta)} />
                      <Metric
                        label={t.salary.totalDeductions}
                        value={formatTHB(sumAmountMap(r.deductions))}
                        tone="negative"
                      />
                      <Metric label={t.salary.netRta} value={formatTHB(net)} tone="positive" />
                      {extra > 0 && <Metric label={t.salary.extraIncome} value={formatTHB(extra)} />}
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleEdit(r)}
                        aria-label={`${t.common.edit} ${periodLabel(r.period)}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            aria-label={`${t.common.delete} ${periodLabel(r.period)}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t.common.confirmDelete}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t.common.confirmDeleteMessage} {t.common.cannotBeUndone}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-red-600 hover:bg-red-700"
                              onClick={() => deleteMutation.mutate(r.id)}
                            >
                              {t.common.delete}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* Breakdown */}
        <TabsContent value="breakdown" className="space-y-4">
          <SalaryTrendChart data={trend} />
          <div className="grid gap-4 sm:grid-cols-2">
            <SalaryBreakdownChart
              title={t.salary.incomeBreakdown}
              items={summary.incomeBreakdown}
              resolve={incomeLabel}
            />
            <SalaryBreakdownChart
              title={t.salary.deductionBreakdown}
              items={summary.deductionBreakdown}
              resolve={dedLabel}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard
              label={t.salary.ownGpfContributed}
              value={formatTHB(summary.ownGpfContributed)}
            />
            <StatCard
              label={t.salary.govGpfContributed}
              value={formatTHB(summary.govGpfContributed)}
            />
          </div>
        </TabsContent>

        {/* GPF */}
        <TabsContent value="gpf">
          <GpfSummaryCard summary={gpf} onEdit={() => setGpfOpen(true)} />
        </TabsContent>

        {/* Import */}
        <TabsContent value="import">
          <SalaryImportCard />
        </TabsContent>
      </Tabs>

      <SalaryFormDialog open={dialogOpen} onOpenChange={setDialogOpen} record={editing} />
      <GpfFormDialog open={gpfOpen} onOpenChange={setGpfOpen} summary={gpf} />
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "positive" | "negative";
}) {
  const toneClass =
    tone === "positive"
      ? "text-emerald-600 dark:text-emerald-400"
      : tone === "negative"
      ? "text-red-600 dark:text-red-400"
      : "";
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`mt-1 text-xl font-bold tabular-nums ${toneClass}`}>{value}</p>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "positive" | "negative";
}) {
  const toneClass =
    tone === "positive"
      ? "text-emerald-600 dark:text-emerald-400"
      : tone === "negative"
      ? "text-red-600 dark:text-red-400"
      : "";
  return (
    <div className="text-right">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={`font-medium tabular-nums ${toneClass}`}>{value}</p>
    </div>
  );
}
