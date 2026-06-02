"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { salaryRecordSchema, type SalaryRecordSchemaType } from "@/lib/validations/schemas";
import { useCreateSalaryRecord, useUpdateSalaryRecord } from "@/hooks/useSalary";
import {
  SALARY_DEDUCTION_TYPES,
  SALARY_GOV_CONTRIB_TYPES,
  MILITARY_RANKS,
  sumAmountMap,
  netRtaPay,
} from "@/lib/utils/salary-constants";
import { formatTHB } from "@/lib/utils/format";
import type { SalaryRecord } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "@/lib/i18n";

interface SalaryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record?: SalaryRecord | null;
}

// Zero-fill every taxonomy key so the inputs stay controlled.
function emptyMap(keys: readonly { key: string }[]): Record<string, number> {
  return Object.fromEntries(keys.map((k) => [k.key, 0]));
}

// Blank / non-numeric input → 0 so amount maps never carry NaN.
function numFromInput(v: unknown): number {
  if (v === "" || v == null) return 0;
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
}

function thisMonthFirstDay(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function getEmptyDefaults(): SalaryRecordSchemaType {
  return {
    period: thisMonthFirstDay(),
    rank: "",
    pay_step: "",
    gross_rta: 0,
    income_tiny: 0,
    income_sckt: 0,
    deductions: emptyMap(SALARY_DEDUCTION_TYPES),
    gov_contrib: emptyMap(SALARY_GOV_CONTRIB_TYPES),
    is_backpay: false,
    note: "",
  };
}

export function SalaryFormDialog({ open, onOpenChange, record }: SalaryFormDialogProps) {
  const { t } = useTranslation();
  const createMutation = useCreateSalaryRecord();
  const updateMutation = useUpdateSalaryRecord();
  const isEditing = !!record;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<SalaryRecordSchemaType>({
    resolver: zodResolver(salaryRecordSchema),
    defaultValues: getEmptyDefaults(),
  });

  useEffect(() => {
    if (open) {
      reset(
        record
          ? {
              period: record.period,
              rank: record.rank ?? "",
              pay_step: record.pay_step ?? "",
              gross_rta: record.gross_rta,
              income_tiny: record.income_tiny,
              income_sckt: record.income_sckt,
              deductions: { ...emptyMap(SALARY_DEDUCTION_TYPES), ...record.deductions },
              gov_contrib: { ...emptyMap(SALARY_GOV_CONTRIB_TYPES), ...record.gov_contrib },
              is_backpay: record.is_backpay,
              note: record.note ?? "",
            }
          : getEmptyDefaults()
      );
    }
  }, [open, record, reset]);

  const period = watch("period");
  const rank = watch("rank");
  const isBackpay = watch("is_backpay");
  const grossRta = watch("gross_rta");
  const deductions = watch("deductions");
  const net = netRtaPay(Number(grossRta) || 0, deductions);
  const totalDeductions = sumAmountMap(deductions);

  async function onSubmit(data: SalaryRecordSchemaType) {
    try {
      if (record) {
        await updateMutation.mutateAsync({ id: record.id, data });
      } else {
        await createMutation.mutateAsync(data);
      }
      onOpenChange(false);
    } catch {
      // Error toast handled by mutation onError.
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>{isEditing ? t.salary.editRecord : t.salary.addRecord}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0 gap-4">
          <div className="flex-1 min-h-0 overflow-y-auto space-y-5 -mr-2 pr-2">
            {/* Period + rank */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t.salary.month}</Label>
                <Input
                  type="month"
                  value={period ? period.slice(0, 7) : ""}
                  onChange={(e) =>
                    setValue("period", e.target.value ? `${e.target.value}-01` : "", {
                      shouldValidate: true,
                    })
                  }
                />
                {errors.period && (
                  <p className="text-xs text-red-600 dark:text-red-400">{errors.period.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>{t.salary.rank}</Label>
                <Select
                  value={rank || ""}
                  onValueChange={(val) => setValue("rank", val, { shouldValidate: true })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t.salary.selectRank} />
                  </SelectTrigger>
                  <SelectContent>
                    {MILITARY_RANKS.map((r) => (
                      <SelectItem key={r.key} value={r.key}>
                        {t.salary.ranks[r.labelKey]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t.salary.payStep}</Label>
              <Input {...register("pay_step")} placeholder={t.salary.payStepExample} />
            </div>

            {/* Income */}
            <div className="space-y-3">
              <p className="text-sm font-semibold">{t.salary.incomeSection}</p>
              <div className="space-y-2">
                <Label>{t.salary.grossRta}</Label>
                <Input type="number" step="any" {...register("gross_rta", { setValueAs: numFromInput })} />
                {errors.gross_rta && (
                  <p className="text-xs text-red-600 dark:text-red-400">{errors.gross_rta.message}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t.salary.streams.tiny}</Label>
                  <Input type="number" step="any" {...register("income_tiny", { setValueAs: numFromInput })} />
                </div>
                <div className="space-y-2">
                  <Label>{t.salary.streams.sckt}</Label>
                  <Input type="number" step="any" {...register("income_sckt", { setValueAs: numFromInput })} />
                </div>
              </div>
            </div>

            {/* Deductions */}
            <div className="space-y-3">
              <p className="text-sm font-semibold">{t.salary.deductionsSection}</p>
              <div className="grid grid-cols-2 gap-3">
                {SALARY_DEDUCTION_TYPES.map((d) => (
                  <div key={d.key} className="space-y-1.5">
                    <Label className="text-xs">{t.salary.deductions[d.labelKey]}</Label>
                    <Input
                      type="number"
                      step="any"
                      {...register(`deductions.${d.key}` as const, { setValueAs: numFromInput })}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Government contributions */}
            <div className="space-y-3">
              <p className="text-sm font-semibold">{t.salary.govContribSection}</p>
              <p className="text-xs text-muted-foreground">{t.salary.govContribHint}</p>
              <div className="grid grid-cols-2 gap-3">
                {SALARY_GOV_CONTRIB_TYPES.map((g) => (
                  <div key={g.key} className="space-y-1.5">
                    <Label className="text-xs">{t.salary.govContrib[g.labelKey]}</Label>
                    <Input
                      type="number"
                      step="any"
                      {...register(`gov_contrib.${g.key}` as const, { setValueAs: numFromInput })}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Note + back-pay */}
            <div className="space-y-2">
              <Label>{t.salary.note}</Label>
              <Input {...register("note")} placeholder={t.salary.noteExample} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-input"
                checked={isBackpay}
                onChange={(e) => setValue("is_backpay", e.target.checked)}
              />
              {t.salary.backpay}
            </label>
          </div>

          {/* Live net summary */}
          <div className="shrink-0 rounded-lg bg-muted/60 px-3 py-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t.salary.totalDeductions}</span>
              <span className="font-medium">{formatTHB(totalDeductions)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t.salary.netRta}</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {formatTHB(net)}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t pt-4 shrink-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t.common.cancel}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? t.common.saving : t.common.save}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
