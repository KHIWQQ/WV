"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { salaryGpfSchema, type SalaryGpfSchemaType } from "@/lib/validations/schemas";
import { useUpsertSalaryGpf } from "@/hooks/useSalary";
import { formatTHB } from "@/lib/utils/format";
import type { SalaryGpfSummary } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/lib/i18n";

// Blank / non-numeric input → 0 so the GPF schema never sees NaN.
function numFromInput(v: unknown): number {
  if (v === "" || v == null) return 0;
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
}

interface GpfFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  summary?: SalaryGpfSummary | null;
}

function getEmptyDefaults(): SalaryGpfSchemaType {
  return {
    own_principal: 0,
    own_gain: 0,
    gov_principal: 0,
    gov_gain: 0,
    atb_balance: 0,
    as_of: "",
  };
}

export function GpfFormDialog({ open, onOpenChange, summary }: GpfFormDialogProps) {
  const { t } = useTranslation();
  const upsertMutation = useUpsertSalaryGpf();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<SalaryGpfSchemaType>({
    resolver: zodResolver(salaryGpfSchema),
    defaultValues: getEmptyDefaults(),
  });

  useEffect(() => {
    if (open) {
      reset(
        summary
          ? {
              own_principal: summary.own_principal,
              own_gain: summary.own_gain,
              gov_principal: summary.gov_principal,
              gov_gain: summary.gov_gain,
              atb_balance: summary.atb_balance,
              as_of: summary.as_of ?? "",
            }
          : getEmptyDefaults()
      );
    }
  }, [open, summary, reset]);

  const v = watch();
  const ownTotal = (Number(v.own_principal) || 0) + (Number(v.own_gain) || 0);
  const govTotal = (Number(v.gov_principal) || 0) + (Number(v.gov_gain) || 0);
  const grand = ownTotal + govTotal + (Number(v.atb_balance) || 0);

  async function onSubmit(data: SalaryGpfSchemaType) {
    try {
      await upsertMutation.mutateAsync(data);
      onOpenChange(false);
    } catch {
      // Error toast handled by mutation onError.
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>{t.salary.editGpf}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0 gap-4">
          <div className="flex-1 min-h-0 overflow-y-auto space-y-5 -mr-2 pr-2">
            <div className="space-y-3">
              <p className="text-sm font-semibold">{t.salary.ownPortion}</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t.salary.principal}</Label>
                  <Input type="number" step="any" {...register("own_principal", { setValueAs: numFromInput })} />
                  {errors.own_principal && (
                    <p className="text-xs text-red-600 dark:text-red-400">{errors.own_principal.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>{t.salary.gain}</Label>
                  <Input type="number" step="any" {...register("own_gain", { setValueAs: numFromInput })} />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold">{t.salary.govPortion}</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t.salary.principal}</Label>
                  <Input type="number" step="any" {...register("gov_principal", { setValueAs: numFromInput })} />
                </div>
                <div className="space-y-2">
                  <Label>{t.salary.gain}</Label>
                  <Input type="number" step="any" {...register("gov_gain", { setValueAs: numFromInput })} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t.salary.atbBalance}</Label>
                <Input type="number" step="any" {...register("atb_balance", { setValueAs: numFromInput })} />
              </div>
              <div className="space-y-2">
                <Label>{t.salary.asOf}</Label>
                <Input type="date" {...register("as_of")} />
              </div>
            </div>
          </div>

          <div className="shrink-0 rounded-lg bg-muted/60 px-3 py-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t.salary.gpfTotal}</span>
              <span className="font-semibold">{formatTHB(grand)}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t pt-4 shrink-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t.common.cancel}
            </Button>
            <Button type="submit" disabled={upsertMutation.isPending}>
              {upsertMutation.isPending ? t.common.saving : t.common.save}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
