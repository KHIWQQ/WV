"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { assetSchema } from "@/lib/validations/schemas";
import type { z } from "zod";

type AssetSchemaType = z.input<typeof assetSchema>;
import { useCreateAsset, useUpdateAsset } from "@/hooks/useAssets";
import { ASSET_CATEGORIES } from "@/lib/utils/constants";
import type { Asset } from "@/types";
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
import { SymbolAutocomplete } from "@/components/market/symbol-autocomplete";
import { useTranslation } from "@/lib/i18n";
import { getAllCountriesAlpha2, getCountryNameFromAlpha2 } from "@/lib/utils/countries";

interface AssetFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset?: Asset | null;
}

const EMPTY_DEFAULTS: AssetSchemaType = {
  category: "",
  name: "",
  symbol: "",
  quantity: 1,
  cost_basis: 0,
  current_price: 0,
  current_value: 0,
  currency: "THB",
  country_code: "TH",
  is_auto_update: false,
  notes: "",
};

// Currencies the FX layer can convert. Keep in sync with src/lib/market/forex.ts
const SUPPORTED_CURRENCIES = ["THB", "USD", "EUR", "GBP", "JPY", "CNY"] as const;

export function AssetFormDialog({ open, onOpenChange, asset }: AssetFormDialogProps) {
  const { t } = useTranslation();
  const createMutation = useCreateAsset();
  const updateMutation = useUpdateAsset();
  const isEditing = !!asset;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<AssetSchemaType>({
    resolver: zodResolver(assetSchema),
    defaultValues: EMPTY_DEFAULTS,
  });

  // Reset form when dialog opens or asset changes
  useEffect(() => {
    if (open) {
      reset(
        asset
          ? {
            category: asset.category,
            name: asset.name,
            symbol: asset.symbol ?? "",
            quantity: asset.quantity,
            cost_basis: asset.cost_basis,
            current_price: asset.current_price,
            current_value: asset.current_value,
            currency: asset.currency || "THB",
            country_code: asset.country_code || "TH",
            is_auto_update: asset.is_auto_update,
            notes: asset.notes ?? "",
          }
          : EMPTY_DEFAULTS
      );
    }
  }, [open, asset, reset]);

  const category = watch("category");
  const symbol = watch("symbol");
  const countryCode = watch("country_code");
  const currency = watch("currency") || "THB";
  const isAutoUpdate = watch("is_auto_update");
  const quantity = watch("quantity");

  // Auto-calculate current_value when price or quantity changes
  const currentPrice = watch("current_price");
  useEffect(() => {
    if (quantity && currentPrice) {
      setValue("current_value", quantity * currentPrice);
    }
  }, [quantity, currentPrice, setValue]);

  async function onSubmit(data: AssetSchemaType) {
    try {
      if (asset) {
        await updateMutation.mutateAsync({ id: asset.id, data });
      } else {
        await createMutation.mutateAsync(data);
      }
      onOpenChange(false);
    } catch {
      // Error toast is handled by mutation onError callback
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  // Show symbol autocomplete for investment categories
  const investmentCategories = ["stock_th", "stock_us", "mutual_fund", "crypto", "gold", "ssf_rmf"];
  const showSymbolSearch = investmentCategories.includes(category);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t.assets.editAsset : t.assets.addAsset}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>{t.assets.category}</Label>
            <Select
              value={category}
              onValueChange={(val) => setValue("category", val, { shouldValidate: true })}
            >
              <SelectTrigger>
                <SelectValue placeholder={t.assets.selectCategory} />
              </SelectTrigger>
              <SelectContent>
                {ASSET_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {t.assetCategories[c.labelKey as keyof typeof t.assetCategories]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-xs text-red-600">{errors.category.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>{t.assets.name}</Label>
            <Input {...register("name")} placeholder={t.assets.nameExample} />
            {errors.name && (
              <p className="text-xs text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>{t.assets.countryRegion}</Label>
            <Select
              value={countryCode}
              onValueChange={(val) => setValue("country_code", val, { shouldValidate: true })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Country" />
              </SelectTrigger>
              <SelectContent>
                {getAllCountriesAlpha2().map((code) => (
                  <SelectItem key={code} value={code}>
                    {getCountryNameFromAlpha2(code)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.country_code && (
              <p className="text-xs text-red-600">{errors.country_code.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>{t.assets.symbol}</Label>
            {showSymbolSearch ? (
              <SymbolAutocomplete
                value={symbol || ""}
                onChange={(val) => setValue("symbol", val)}
                onPriceFound={(price) => {
                  setValue("current_price", price);
                  if (quantity) {
                    setValue("current_value", quantity * price);
                  }
                }}
              />
            ) : (
              <Input {...register("symbol")} placeholder={t.assets.symbolExample} />
            )}
          </div>

          {showSymbolSearch && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_auto_update"
                checked={isAutoUpdate}
                onChange={(e) => setValue("is_auto_update", e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="is_auto_update" className="text-sm font-normal cursor-pointer">
                {t.assets.autoUpdatePrice}
              </Label>
            </div>
          )}

          <div className="space-y-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
            <Label className="flex items-center gap-2">
              สกุลเงินที่ใช้ track
              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono">
                {currency}
              </span>
            </Label>
            <Select
              value={currency}
              onValueChange={(val) => setValue("currency", val, { shouldValidate: true })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_CURRENCIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c} {c === "THB" && "(ค่าเริ่มต้น)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground leading-snug">
              💡 สกุลที่ broker เก็บ asset นี้ — ใส่ต้นทุน/มูลค่าเป็นสกุลนี้ ระบบจะแปลงเป็น THB ตอนรวมพอร์ต
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t.assets.quantity}</Label>
              <Input type="number" step="any" {...register("quantity", { valueAsNumber: true })} />
              {errors.quantity && (
                <p className="text-xs text-red-600">{errors.quantity.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>
                {t.assets.totalCost} <span className="text-muted-foreground">({currency})</span>
              </Label>
              <Input type="number" step="any" {...register("cost_basis", { valueAsNumber: true })} />
              {errors.cost_basis && (
                <p className="text-xs text-red-600">{errors.cost_basis.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>
                {t.assets.currentPriceUnit} <span className="text-muted-foreground">({currency})</span>
              </Label>
              <Input type="number" step="any" {...register("current_price", { valueAsNumber: true })} />
              {errors.current_price && (
                <p className="text-xs text-red-600">{errors.current_price.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>
                {t.assets.totalValue} <span className="text-muted-foreground">({currency})</span>
              </Label>
              <Input type="number" step="any" {...register("current_value", { valueAsNumber: true })} />
              {errors.current_value && (
                <p className="text-xs text-red-600">{errors.current_value.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t.assets.notes}</Label>
            <Input {...register("notes")} placeholder={t.assets.additionalNotes} />
          </div>

          <div className="flex justify-end gap-2">
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
