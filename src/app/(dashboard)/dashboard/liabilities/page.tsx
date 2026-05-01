"use client";

import { useState, useMemo } from "react";
import { Plus, Pencil, Trash2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getLiabilityTypeLabel } from "@/lib/utils/constants";
import { formatTHB, formatPercent } from "@/lib/utils/format";
import { useAssets } from "@/hooks/useAssets";
import { useFxRates, toHome } from "@/hooks/useFxRates";
import { useLiabilities, useDeleteLiability } from "@/hooks/useLiabilities";
import { LiabilityFormDialog } from "@/components/forms/liability-form-dialog";
import { LiabilityDetailDialog } from "@/components/liabilities/liability-detail-dialog";
import { loanToAssetPct, loanToAssetTone } from "@/lib/finance/ratios";
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
import { useTranslation } from "@/lib/i18n";
import type { Liability } from "@/types";


export default function LiabilitiesPage() {
  const { t } = useTranslation();
  const { data: liabilities = [], isLoading, isError } = useLiabilities();
  const { data: assets = [] } = useAssets();
  const deleteMutation = useDeleteLiability();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLiability, setEditingLiability] = useState<Liability | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLiability, setDetailLiability] = useState<Liability | null>(null);

  // FX prefetch needed because each asset stores value in its own currency.
  // Liabilities are THB-only per existing convention (see dashboard.ts:96).
  const assetCurrencies = useMemo(
    () => assets.map((a) => a.currency || "THB"),
    [assets]
  );
  const { data: fxRates } = useFxRates(assetCurrencies);

  const { totalBalance, totalMonthly, totalAssetsHome, ltvPct } = useMemo(() => {
    const balance = liabilities.reduce((s, l) => s + l.balance, 0);
    const monthly = liabilities.reduce((s, l) => s + l.monthly_payment, 0);
    const assetsHome = assets.reduce(
      (s, a) => s + toHome(a.current_value, a.currency, fxRates),
      0
    );
    return {
      totalBalance: balance,
      totalMonthly: monthly,
      totalAssetsHome: assetsHome,
      ltvPct: loanToAssetPct(assetsHome, balance),
    };
  }, [liabilities, assets, fxRates]);

  const ltvTone = loanToAssetTone(ltvPct);

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

  function handleEdit(liability: Liability) {
    setEditingLiability(liability);
    setDialogOpen(true);
  }

  function handleAdd() {
    setEditingLiability(null);
    setDialogOpen(true);
  }

  function handleDetails(liability: Liability) {
    setDetailLiability(liability);
    setDetailOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t.liabilities.title}</h1>
          <p className="text-sm text-muted-foreground">
            {t.liabilities.outstandingBalance} {formatTHB(totalBalance)} · {t.liabilities.totalPayment}{" "}
            {formatTHB(totalMonthly)}{t.common.perMonth}
          </p>
        </div>
        <Button className="gap-2" onClick={handleAdd}>
          <Plus className="h-4 w-4" />
          {t.liabilities.addLiability}
        </Button>
      </div>

      {/* LTV (Loan-to-Asset) summary — only show when there's data on both sides */}
      {liabilities.length > 0 && totalAssetsHome > 0 && (
        <Card variant="glass">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">{t.liabilities.ltvTitle}</p>
                <p className="text-xs text-muted-foreground">
                  {t.liabilities.ltvHint}
                </p>
              </div>
              <div className="text-right">
                <p
                  className={`text-2xl font-bold tabular-nums ${
                    ltvTone === "positive"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : ltvTone === "negative"
                      ? "text-red-600 dark:text-red-400"
                      : "text-amber-600 dark:text-amber-400"
                  }`}
                >
                  {formatPercent(ltvPct, 1)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatTHB(totalBalance)} / {formatTHB(totalAssetsHome)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {liabilities.length === 0 ? (
        <Card>
          <CardContent className="flex h-40 items-center justify-center text-muted-foreground">
            {t.liabilities.noLiabilities}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {liabilities.map((liability) => {
            const paidPct = liability.principal > 0
              ? ((liability.principal - liability.balance) / liability.principal) * 100
              : 0;
            return (
              <Card key={liability.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{liability.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium">
                        {getLiabilityTypeLabel(liability.type, t.liabilityTypes)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleDetails(liability)}
                        aria-label={`${t.liabilities.viewDetails} ${liability.name}`}
                      >
                        <Info className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleEdit(liability)}
                        aria-label={`${t.common.edit} ${liability.name}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            aria-label={`${t.common.delete} ${liability.name}`}
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
                              onClick={() => deleteMutation.mutate(liability.id)}
                            >
                              {t.common.delete}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t.liabilities.balance}</span>
                    <span className="font-semibold text-red-600 dark:text-red-400">
                      {formatTHB(liability.balance)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t.liabilities.loanAmount}</span>
                    <span>{formatTHB(liability.principal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t.liabilities.interestRate}</span>
                    <span>{liability.interest_rate}{t.common.perYear}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t.liabilities.monthlyPayment}</span>
                    <span className="font-medium">
                      {formatTHB(liability.monthly_payment)}
                    </span>
                  </div>

                  <div>
                    <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                      <span>{t.liabilities.paid}</span>
                      <span>{paidPct.toFixed(0)}%</span>
                    </div>
                    <div
                      className="h-2 overflow-hidden rounded-full bg-muted"
                      role="progressbar"
                      aria-valuenow={Math.round(Math.min(paidPct, 100))}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${t.liabilities.paid} ${paidPct.toFixed(0)}%`}
                    >
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all"
                        style={{ width: `${Math.min(paidPct, 100)}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <LiabilityFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        liability={editingLiability}
      />
      <LiabilityDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        liability={detailLiability}
      />
    </div>
  );
}
