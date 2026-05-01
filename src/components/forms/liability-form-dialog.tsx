"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { liabilitySchema, type LiabilitySchemaType } from "@/lib/validations/schemas";
import { useCreateLiability, useUpdateLiability } from "@/hooks/useLiabilities";
import { LIABILITY_TYPES } from "@/lib/utils/constants";
import type { Liability } from "@/types";
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

interface LiabilityFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  liability?: Liability | null;
}

function getEmptyDefaults(): LiabilitySchemaType {
  return {
    name: "",
    type: "",
    principal: 0,
    balance: 0,
    interest_rate: 0,
    monthly_payment: 0,
    start_date: new Date().toISOString().split("T")[0],
    end_date: "",
    notes: "",
  };
}

export function LiabilityFormDialog({ open, onOpenChange, liability }: LiabilityFormDialogProps) {
  const { t } = useTranslation();
  const createMutation = useCreateLiability();
  const updateMutation = useUpdateLiability();
  const isEditing = !!liability;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<LiabilitySchemaType>({
    resolver: zodResolver(liabilitySchema),
    defaultValues: getEmptyDefaults(),
  });

  // Reset form when dialog opens or liability changes
  useEffect(() => {
    if (open) {
      reset(
        liability
          ? {
              name: liability.name,
              type: liability.type,
              principal: liability.principal,
              balance: liability.balance,
              interest_rate: liability.interest_rate,
              monthly_payment: liability.monthly_payment,
              start_date: liability.start_date,
              end_date: liability.end_date ?? "",
              notes: liability.notes ?? "",
            }
          : getEmptyDefaults()
      );
    }
  }, [open, liability, reset]);

  const liabilityType = watch("type");

  async function onSubmit(data: LiabilitySchemaType) {
    try {
      if (liability) {
        await updateMutation.mutateAsync({ id: liability.id, data });
      } else {
        await createMutation.mutateAsync(data);
      }
      onOpenChange(false);
    } catch {
      // Error toast is handled by mutation onError callback
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>
            {isEditing ? t.liabilities.editLiability : t.liabilities.addLiability}
          </DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col flex-1 min-h-0 gap-4"
        >
          <div className="flex-1 min-h-0 overflow-y-auto space-y-4 -mr-2 pr-2">
          <div className="space-y-2">
            <Label>{t.liabilities.name}</Label>
            <Input {...register("name")} placeholder={t.liabilities.nameExample} />
            {errors.name && (
              <p className="text-xs text-red-600 dark:text-red-400">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>{t.liabilities.type}</Label>
            <Select
              value={liabilityType}
              onValueChange={(val) => setValue("type", val, { shouldValidate: true })}
            >
              <SelectTrigger>
                <SelectValue placeholder={t.liabilities.selectType} />
              </SelectTrigger>
              <SelectContent>
                {LIABILITY_TYPES.map((lt) => (
                  <SelectItem key={lt.value} value={lt.value}>
                    {t.liabilityTypes[lt.labelKey as keyof typeof t.liabilityTypes]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-xs text-red-600 dark:text-red-400">{errors.type.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t.liabilities.loanAmount}</Label>
              <Input type="number" step="any" {...register("principal", { valueAsNumber: true })} />
              {errors.principal && (
                <p className="text-xs text-red-600 dark:text-red-400">{errors.principal.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>{t.liabilities.balance}</Label>
              <Input type="number" step="any" {...register("balance", { valueAsNumber: true })} />
              {errors.balance && (
                <p className="text-xs text-red-600 dark:text-red-400">{errors.balance.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t.liabilities.interestRate} ({t.common.perYear})</Label>
              <Input type="number" step="any" {...register("interest_rate", { valueAsNumber: true })} />
              {errors.interest_rate && (
                <p className="text-xs text-red-600 dark:text-red-400">{errors.interest_rate.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>{t.liabilities.monthlyPayment}</Label>
              <Input type="number" step="any" {...register("monthly_payment", { valueAsNumber: true })} />
              {errors.monthly_payment && (
                <p className="text-xs text-red-600 dark:text-red-400">{errors.monthly_payment.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t.liabilities.startDate}</Label>
              <Input type="date" {...register("start_date")} />
              {errors.start_date && (
                <p className="text-xs text-red-600 dark:text-red-400">{errors.start_date.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>{t.liabilities.endDate}</Label>
              <Input type="date" {...register("end_date")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t.liabilities.notes}</Label>
            <Input {...register("notes")} placeholder={t.liabilities.additionalNotes} />
          </div>
          </div>

          <div className="flex justify-end gap-2 border-t pt-4 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
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
