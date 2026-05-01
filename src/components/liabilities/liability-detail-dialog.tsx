"use client";

import { Fragment, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/lib/i18n";
import { formatTHB, formatNumber } from "@/lib/utils/format";
import { buildAmortization, comparePayoff } from "@/lib/finance/amortization";
import type { Liability } from "@/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  liability: Liability | null;
}

/**
 * Read-only detail view for a liability: amortization schedule + payoff
 * what-if slider. Editing still happens through LiabilityFormDialog.
 */
export function LiabilityDetailDialog({ open, onOpenChange, liability }: Props) {
  const { t } = useTranslation();
  const [extraPayment, setExtraPayment] = useState(0);

  const schedule = useMemo(() => {
    if (!liability) return null;
    // Use balance (not principal) so the schedule reflects what's left.
    return buildAmortization(
      liability.balance,
      liability.interest_rate,
      liability.monthly_payment,
      liability.start_date || new Date().toISOString().split("T")[0]
    );
  }, [liability]);

  const payoffComparison = useMemo(() => {
    if (!liability) return null;
    return comparePayoff(
      liability.balance,
      liability.interest_rate,
      liability.monthly_payment,
      extraPayment,
      liability.start_date || new Date().toISOString().split("T")[0]
    );
  }, [liability, extraPayment]);

  if (!liability) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>{liability.name}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col flex-1 min-h-0 gap-4 overflow-y-auto -mr-2 pr-2">
          {/* Underwater warning */}
          {schedule?.underwater && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-700 dark:text-red-300">
              ⚠️ {t.liabilities.underwaterWarning}
            </div>
          )}

          {/* Payoff what-if */}
          {!schedule?.underwater && payoffComparison && (
            <div className="space-y-3 rounded-lg border bg-muted/40 p-4">
              <div>
                <h3 className="text-sm font-semibold">{t.liabilities.payoffCalc}</h3>
                <p className="text-xs text-muted-foreground">
                  {t.liabilities.payoffCalcHint}
                </p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">
                  {t.liabilities.extraPerMonth}
                  <span className="ml-2 font-medium text-foreground">
                    {formatTHB(extraPayment)}
                  </span>
                </Label>
                <Input
                  type="range"
                  min={0}
                  max={Math.max(liability.monthly_payment, 50_000)}
                  step={500}
                  value={extraPayment}
                  onChange={(e) => setExtraPayment(Number(e.target.value))}
                />
              </div>
              {extraPayment > 0 && payoffComparison.monthsSaved > 0 && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded bg-emerald-500/10 px-3 py-2">
                    <p className="text-muted-foreground">{t.liabilities.monthsSaved}</p>
                    <p className="text-base font-bold text-emerald-700 dark:text-emerald-400">
                      {payoffComparison.monthsSaved}{" "}
                      <span className="text-xs font-normal">
                        {t.liabilities.months}
                      </span>
                    </p>
                  </div>
                  <div className="rounded bg-emerald-500/10 px-3 py-2">
                    <p className="text-muted-foreground">{t.liabilities.interestSaved}</p>
                    <p className="text-base font-bold text-emerald-700 dark:text-emerald-400">
                      {formatTHB(payoffComparison.interestSaved)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Amortization schedule */}
          {schedule && schedule.schedule.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">{t.liabilities.amortizationSchedule}</h3>
              <p className="text-xs text-muted-foreground">
                {t.liabilities.amortizationHint} —{" "}
                {t.liabilities.totalInterest}{" "}
                <span className="font-medium text-foreground">
                  {formatTHB(schedule.totalInterest)}
                </span>
                {" · "}
                {t.liabilities.payoffIn}{" "}
                <span className="font-medium text-foreground">
                  {schedule.monthsToPayoff} {t.liabilities.months}
                </span>
              </p>
              <ScheduleTable rows={schedule.schedule} />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ScheduleTable({
  rows,
}: {
  rows: ReturnType<typeof buildAmortization>["schedule"];
}) {
  // Show first 12 + last 12 if > 36 rows; otherwise show all
  const useEllipsis = rows.length > 36;
  const display = useEllipsis
    ? [...rows.slice(0, 12), ...rows.slice(-12)]
    : rows;
  const ellipsisAt = useEllipsis ? 11 : -1;

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-xs">
        <thead className="bg-muted/50 text-muted-foreground">
          <tr>
            <th className="px-2 py-1.5 text-left">#</th>
            <th className="px-2 py-1.5 text-left">Date</th>
            <th className="px-2 py-1.5 text-right">Principal</th>
            <th className="px-2 py-1.5 text-right">Interest</th>
            <th className="px-2 py-1.5 text-right">Balance</th>
          </tr>
        </thead>
        <tbody>
          {display.map((row, i) => (
            <Fragment key={row.month}>
              <tr className="border-t border-border/50 tabular-nums">
                <td className="px-2 py-1">{row.month}</td>
                <td className="px-2 py-1 text-muted-foreground">
                  {row.paymentDate}
                </td>
                <td className="px-2 py-1 text-right">
                  {formatNumber(row.principalPaid, 2)}
                </td>
                <td className="px-2 py-1 text-right text-red-600 dark:text-red-400">
                  {formatNumber(row.interestPaid, 2)}
                </td>
                <td className="px-2 py-1 text-right font-medium">
                  {formatNumber(row.balanceAfter, 2)}
                </td>
              </tr>
              {i === ellipsisAt && (
                <tr className="border-t border-border/50">
                  <td colSpan={5} className="px-2 py-1 text-center text-muted-foreground">
                    ⋯ {rows.length - 24} months hidden ⋯
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
