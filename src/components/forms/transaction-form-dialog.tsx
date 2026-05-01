"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { transactionSchema, type TransactionSchemaType } from "@/lib/validations/schemas";
import { useCreateTransaction, useUpdateTransaction } from "@/hooks/useTransactions";
import { TRANSACTION_TYPES, getCategoriesByType } from "@/lib/utils/constants";
import type { Transaction } from "@/types";
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

interface TransactionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: Transaction | null;
}

function getEmptyDefaults(): TransactionSchemaType {
  return {
    type: "expense",
    category: "",
    amount: 0,
    description: "",
    date: new Date().toISOString().split("T")[0],
  };
}

export function TransactionFormDialog({
  open,
  onOpenChange,
  transaction,
}: TransactionFormDialogProps) {
  const { t } = useTranslation();
  const createMutation = useCreateTransaction();
  const updateMutation = useUpdateTransaction();
  const isEditing = !!transaction;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<TransactionSchemaType>({
    resolver: zodResolver(transactionSchema),
    defaultValues: getEmptyDefaults(),
  });

  // Reset form when dialog opens or transaction changes
  useEffect(() => {
    if (open) {
      if (transaction) {
        reset({
          type: transaction.type,
          category: transaction.category,
          amount: transaction.amount,
          description: transaction.description ?? "",
          date: transaction.date.split("T")[0],
        });
      } else {
        reset({
          ...getEmptyDefaults(),
        });
      }
    }
  }, [open, transaction, reset]);

  const txType = watch("type");
  const txCategory = watch("category");
  const categories = getCategoriesByType(txType);
  const isBuySell = txType === "buy" || txType === "sell";

  // Reset category when type changes (only if current category is invalid)
  useEffect(() => {
    if (isBuySell) return; // buy/sell use free text
    const valid = categories.some((c) => c.value === txCategory);
    if (!valid && txCategory) {
      setValue("category", "", { shouldValidate: false });
    }
  }, [txType, txCategory, categories, isBuySell, setValue]);

  async function onSubmit(data: TransactionSchemaType) {
    try {
      if (transaction) {
        await updateMutation.mutateAsync({ id: transaction.id, data });
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
          <DialogTitle>{isEditing ? t.transactions.editTransaction : t.transactions.addTransaction}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col flex-1 min-h-0 gap-4"
        >
          <div className="flex-1 min-h-0 overflow-y-auto space-y-4 -mr-2 pr-2">
          <div className="space-y-2">
            <Label>{t.transactions.type}</Label>
            <Select
              value={txType}
              onValueChange={(val) =>
                setValue("type", val as TransactionSchemaType["type"], {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={t.transactions.selectType} />
              </SelectTrigger>
              <SelectContent>
                {TRANSACTION_TYPES.map((tt) => (
                  <SelectItem key={tt.value} value={tt.value}>
                    {t.transactions[tt.labelKey as keyof typeof t.transactions]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-xs text-red-600">{errors.type.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>{t.transactions.category}</Label>
            {isBuySell ? (
              <Input {...register("category")} placeholder={t.transactions.categoryExample} />
            ) : (
              <Select
                value={txCategory}
                onValueChange={(val) =>
                  setValue("category", val, { shouldValidate: true })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t.transactions.selectCategory} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      <span className="flex items-center gap-2">
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: c.color }}
                        />
                        {txType === "income"
                          ? t.incomeCategories[c.labelKey as keyof typeof t.incomeCategories]
                          : t.expenseCategories[c.labelKey as keyof typeof t.expenseCategories]}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {errors.category && (
              <p className="text-xs text-red-600">{errors.category.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>{t.transactions.amount}</Label>
            <Input
              type="number"
              step="any"
              {...register("amount", { valueAsNumber: true })}
            />
            {errors.amount && (
              <p className="text-xs text-red-600">{errors.amount.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>{t.transactions.details}</Label>
            <Input {...register("description")} placeholder={t.transactions.additionalDetails} />
          </div>

          <div className="space-y-2">
            <Label>{t.transactions.date}</Label>
            <Input type="date" {...register("date")} />
            {errors.date && (
              <p className="text-xs text-red-600">{errors.date.message}</p>
            )}
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
