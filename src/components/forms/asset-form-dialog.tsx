"use client";

import { useEffect, useState } from "react";
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
  const costBasis = watch("cost_basis");
  const currentPrice = watch("current_price");

  // Per-unit purchase price — TRANSIENT form-only field. Not stored in DB
  // (DB keeps cost_basis as the total). Lets users enter "I bought at ฿32
  // per share" and the form computes total automatically, instead of the
  // user mistyping cost_basis as a per-unit price.
  const [costPerUnit, setCostPerUnit] = useState<number | "">("");

  // When editing an existing asset, derive cost_per_unit from the stored total.
  useEffect(() => {
    if (open && asset && asset.quantity > 0 && asset.cost_basis > 0) {
      setCostPerUnit(asset.cost_basis / asset.quantity);
    } else if (open && !asset) {
      setCostPerUnit("");
    }
  }, [open, asset]);

  // Auto-calculate current_value when price or quantity changes
  useEffect(() => {
    if (quantity && currentPrice) {
      setValue("current_value", quantity * currentPrice);
    }
  }, [quantity, currentPrice, setValue]);

  // Quantity changed → keep cost_basis = costPerUnit × quantity so the two stay
  // in sync. Without this, a user who types total-cost directly and later edits
  // quantity ends up with a stale cost_basis (the original prod bug:
  // cost=$75,000 + qty 1→0.1 produced -89.7% loss on auto-tracked BTC).
  useEffect(() => {
    if (typeof costPerUnit === "number" && costPerUnit > 0 && quantity > 0) {
      setValue("cost_basis", costPerUnit * quantity);
    }
  }, [costPerUnit, quantity, setValue]);

  // Anomaly: cost-per-unit drastically different from current price
  // (e.g., user typed "32" thinking per-unit when stored as total)
  const showAnomalyWarning =
    typeof costBasis === "number" &&
    typeof currentPrice === "number" &&
    typeof quantity === "number" &&
    costBasis > 0 &&
    currentPrice > 0 &&
    quantity > 0 &&
    (() => {
      const cpu = costBasis / quantity;
      const ratio = cpu / currentPrice;
      // Flag if effective cost/unit is < 1/5 or > 5× current price.
      // Tighter than the original 20×; covers the common per-unit-vs-total
      // mistake (e.g. cost=75000 / qty=0.1 / price=77000 → ratio 9.74,
      // would have slipped through at 20×).
      return ratio < 0.2 || ratio > 5;
    })();

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
            {category === "gold" && (
              <div className="space-y-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs">
                <p className="font-medium text-amber-700 dark:text-amber-300">
                  💡 ทองคำไทย 96.5% — เลือกราคาที่จะใช้ track
                </p>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  หน่วย: <b>บาททอง</b> (1 บาท ≈ 15.244 g) — กรอกจำนวนเป็นบาททอง เช่น &quot;5&quot; = 5 บาททอง<br />
                  ราคาดึงจาก goldtraders.or.th อัปเดตทุก 5 นาที
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    { sym: "XAUTH-BAR-SELL", label: "แท่ง 96.5% (ขาย)" },
                    { sym: "XAUTH-BAR-BUY", label: "แท่ง 96.5% (รับซื้อ)" },
                    { sym: "XAUTH-ORN-SELL", label: "รูปพรรณ (ขาย)" },
                    { sym: "XAUTH-ORN-BUY", label: "รูปพรรณ (รับซื้อ)" },
                  ].map((opt) => (
                    <Button
                      key={opt.sym}
                      type="button"
                      variant={symbol === opt.sym ? "default" : "outline"}
                      size="sm"
                      className="h-7 text-[11px]"
                      onClick={async () => {
                        setValue("symbol", opt.sym);
                        setValue("currency", "THB", { shouldValidate: true });
                        setValue("is_auto_update", true);
                        try {
                          const res = await fetch(
                            `/api/v1/market/quote?symbols=${encodeURIComponent(opt.sym)}`
                          );
                          const data = await res.json();
                          const price = data.quotes?.[0]?.price;
                          if (typeof price === "number" && price > 0) {
                            setValue("current_price", price);
                            if (quantity) setValue("current_value", quantity * price);
                          }
                        } catch {
                          // Price fetch failed silently — user can still save
                        }
                      }}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </div>
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

          <div className="space-y-2">
            <Label>{t.assets.quantity}</Label>
            <Input type="number" step="any" {...register("quantity", { valueAsNumber: true })} />
            {errors.quantity && (
              <p className="text-xs text-red-600">{errors.quantity.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>
                ราคาซื้อ/หน่วย <span className="text-muted-foreground">({currency})</span>
              </Label>
              <Input
                type="number"
                step="any"
                value={costPerUnit}
                onChange={(e) => {
                  const v = e.target.value;
                  setCostPerUnit(v === "" ? "" : parseFloat(v));
                }}
                placeholder="ราคาที่ซื้อมา 1 หน่วย"
              />
              <p className="text-[11px] text-muted-foreground">
                ระบบจะคูณกับจำนวนเป็นต้นทุนรวม
              </p>
            </div>
            <div className="space-y-2">
              <Label>
                {t.assets.totalCost} <span className="text-muted-foreground">({currency})</span>
              </Label>
              <Input
                type="number"
                step="any"
                value={Number.isFinite(costBasis) ? costBasis : ""}
                onChange={(e) => {
                  const v = e.target.value;
                  const num = v === "" ? 0 : parseFloat(v);
                  setValue("cost_basis", num, { shouldValidate: true });
                  // Derive cost-per-unit so subsequent quantity edits keep cost_basis in sync
                  if (quantity > 0 && num > 0) {
                    setCostPerUnit(num / quantity);
                  } else if (num === 0) {
                    setCostPerUnit("");
                  }
                }}
              />
              {errors.cost_basis && (
                <p className="text-xs text-red-600">{errors.cost_basis.message}</p>
              )}
              <p className="text-[11px] text-muted-foreground">
                หรือใส่ยอดที่จ่ายจริงทั้งหมด
              </p>
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

          {showAnomalyWarning && (
            <div className="space-y-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs">
              <div className="flex gap-2">
                <span aria-hidden className="text-amber-500">⚠️</span>
                <p className="text-amber-700 dark:text-amber-300 leading-snug">
                  ต้นทุน/หน่วย ({(costBasis / quantity).toLocaleString(undefined, { maximumFractionDigits: 2 })}) ต่างจากราคาปัจจุบัน/หน่วย ({currentPrice?.toLocaleString()}) มาก —
                  ตรวจสอบว่าใส่ <b>ต้นทุนรวม</b> ถูกหรือยัง (ไม่ใช่ราคาต่อหน่วย)
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  // Re-interpret current cost_basis as per-unit price → recompute total
                  // (e.g. 75000 entered for 0.1 BTC → cost_per_unit=75000, total=7500)
                  const reinterpretedPerUnit = costBasis;
                  setCostPerUnit(reinterpretedPerUnit);
                  setValue("cost_basis", reinterpretedPerUnit * quantity, { shouldValidate: true });
                }}
              >
                ตีความเป็นราคา/หน่วย → ต้นทุนรวม {(costBasis * quantity).toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </Button>
            </div>
          )}

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
