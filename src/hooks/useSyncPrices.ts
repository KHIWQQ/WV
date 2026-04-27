"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { syncAssetPrices } from "@/lib/actions/sync-prices";
import { toast } from "@/hooks/useToast";
import { useTranslation } from "@/lib/i18n";

export function useSyncPrices() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: () => syncAssetPrices(),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      if (result.synced > 0) {
        toast({
          title: `${t.sync.pricesUpdated} ${result.synced} ${t.sync.items}`,
          description: result.skipped > 0 ? `${t.sync.skipped} ${result.skipped} ${t.sync.items} (${t.sync.noDataFound})` : undefined,
        });
      } else {
        toast({ title: t.sync.noAssetsToUpdate });
      }
    },
    onError: () => {
      toast({ title: t.sync.updateError, variant: "destructive" });
    },
  });
}
