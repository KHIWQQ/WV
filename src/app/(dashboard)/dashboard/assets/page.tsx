"use client";

import { useState, useMemo } from "react";
import { Plus, Pencil, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ASSET_CATEGORIES, getAssetCategoryLabel } from "@/lib/utils/constants";
import { formatTHB, formatCurrency, formatNumber, formatPercent } from "@/lib/utils/format";
import { useAssets, useDeleteAsset } from "@/hooks/useAssets";
import { useSyncPrices } from "@/hooks/useSyncPrices";
import { useFxRates, toHome } from "@/hooks/useFxRates";
import { AssetFormDialog } from "@/components/forms/asset-form-dialog";
import { useTranslation } from "@/lib/i18n";
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
import type { Asset } from "@/types";

function getCategoryColor(value: string) {
  return ASSET_CATEGORIES.find((c) => c.value === value)?.color ?? "#a1a1aa";
}

function groupByCategory(assets: Asset[]): Record<string, Asset[]> {
  return assets.reduce(
    (acc, asset) => {
      if (!acc[asset.category]) acc[asset.category] = [];
      acc[asset.category].push(asset);
      return acc;
    },
    {} as Record<string, Asset[]>
  );
}

export default function AssetsPage() {
  const { t } = useTranslation();
  const { data: assets = [], isLoading, isError } = useAssets();
  const deleteMutation = useDeleteAsset();
  const syncMutation = useSyncPrices();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  const currencies = useMemo(
    () => assets.map((a) => a.currency || "THB"),
    [assets]
  );
  const { data: fxRates } = useFxRates(currencies);

  const { groups, totalValueHome, autoUpdateCount } = useMemo(() => ({
    groups: groupByCategory(assets),
    totalValueHome: assets.reduce(
      (s, a) => s + toHome(a.current_value, a.currency, fxRates),
      0
    ),
    autoUpdateCount: assets.filter((a) => a.is_auto_update && a.symbol).length,
  }), [assets, fxRates]);

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
        <div className="text-red-600">{t.common.errorLoadData}</div>
      </div>
    );
  }

  function handleEdit(asset: Asset) {
    setEditingAsset(asset);
    setDialogOpen(true);
  }

  function handleAdd() {
    setEditingAsset(null);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t.assets.title}</h1>
          <p className="text-sm text-muted-foreground">
            {t.assets.allAssets} {formatTHB(totalValueHome)}
          </p>
        </div>
        <div className="flex gap-2">
          {autoUpdateCount > 0 && (
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
            >
              <RefreshCw className={`h-4 w-4 ${syncMutation.isPending ? "animate-spin" : ""}`} />
              {syncMutation.isPending ? t.assets.updating : `${t.assets.syncPrice} (${autoUpdateCount})`}
            </Button>
          )}
          <Button className="gap-2" onClick={handleAdd}>
            <Plus className="h-4 w-4" />
            {t.assets.addAsset}
          </Button>
        </div>
      </div>

      {assets.length === 0 ? (
        <Card>
          <CardContent className="flex h-40 items-center justify-center text-muted-foreground">
            {t.assets.noAssets}
          </CardContent>
        </Card>
      ) : (
        Object.entries(groups).map(([category, categoryAssets]) => {
          const groupTotalHome = categoryAssets.reduce(
            (s, a) => s + toHome(a.current_value, a.currency, fxRates),
            0
          );
          return (
            <Card key={category}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: getCategoryColor(category) }}
                  />
                  <CardTitle className="text-base">
                    {getAssetCategoryLabel(category, t.assetCategories)}
                  </CardTitle>
                  <span className="ml-auto text-sm font-semibold">
                    {formatTHB(groupTotalHome)}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {categoryAssets.map((asset) => {
                    const cur = (asset.currency || "THB").toUpperCase();
                    const isForeign = cur !== "THB";
                    const gainLossNative = asset.current_value - asset.cost_basis;
                    const gainPct =
                      asset.cost_basis > 0
                        ? (gainLossNative / asset.cost_basis) * 100
                        : 0;
                    const valueHome = toHome(asset.current_value, cur, fxRates);
                    // Flag suspect data: stored cost-per-unit diverges 5× from current price.
                    // Same threshold as the form anomaly check — usually means user typed
                    // a per-unit price into the total-cost field.
                    const costPerUnit =
                      asset.quantity > 0 ? asset.cost_basis / asset.quantity : 0;
                    const priceRatio =
                      asset.current_price > 0 && costPerUnit > 0
                        ? costPerUnit / asset.current_price
                        : 1;
                    const hasCostAnomaly =
                      asset.is_auto_update &&
                      asset.current_price > 0 &&
                      asset.cost_basis > 0 &&
                      (priceRatio < 0.2 || priceRatio > 5);
                    return (
                      <div
                        key={asset.id}
                        className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{asset.name}</p>
                            {isForeign && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                {cur}
                              </Badge>
                            )}
                            {asset.is_auto_update && asset.symbol && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                Auto
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {asset.symbol && <span className="mr-2">{asset.symbol}</span>}
                            <span className="mr-2">× {formatNumber(asset.quantity, 4).replace(/\.?0+$/, "")}</span>
                            {t.assets.cost} {formatCurrency(asset.cost_basis, cur)}
                          </p>
                          {hasCostAnomaly && (
                            <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-400">
                              ⚠️ ต้นทุน/หน่วย ({formatCurrency(costPerUnit, cur)}) ต่างจากราคาปัจจุบัน ({formatCurrency(asset.current_price, cur)}) มาก — ตรวจสอบข้อมูล
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="font-semibold">
                              {formatCurrency(asset.current_value, cur)}
                            </p>
                            {isForeign && (
                              <p className="text-[10px] text-muted-foreground">
                                ≈ {formatTHB(valueHome)}
                              </p>
                            )}
                            <p
                              className={`text-xs font-medium ${
                                gainLossNative >= 0
                                  ? "text-emerald-600"
                                  : "text-red-600"
                              }`}
                            >
                              {gainLossNative >= 0 ? "+" : ""}
                              {formatCurrency(gainLossNative, cur)} ({formatPercent(gainPct)})
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEdit(asset)}
                              aria-label={`${t.common.edit} ${asset.name}`}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-600 hover:text-red-700"
                                  aria-label={`${t.common.delete} ${asset.name}`}
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
                                    onClick={() => deleteMutation.mutate(asset.id)}
                                  >
                                    {t.common.delete}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })
      )}

      <AssetFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        asset={editingAsset}
      />
    </div>
  );
}
