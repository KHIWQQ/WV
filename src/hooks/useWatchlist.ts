"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getWatchlists,
  createWatchlist,
  deleteWatchlist,
  addWatchlistItem,
  removeWatchlistItem,
} from "@/lib/actions/watchlist";
import { toast } from "@/hooks/useToast";
import { useTranslation } from "@/lib/i18n";

export function useWatchlists() {
  return useQuery({
    queryKey: ["watchlists"],
    queryFn: () => getWatchlists(),
  });
}

export function useCreateWatchlist() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (name: string) => createWatchlist(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlists"] });
      toast({ title: t.watchlist.created });
    },
    onError: () => {
      toast({ title: t.common.error, variant: "destructive" });
    },
  });
}

export function useDeleteWatchlist() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (id: string) => deleteWatchlist(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlists"] });
      toast({ title: t.watchlist.deleted });
    },
    onError: () => {
      toast({ title: t.common.error, variant: "destructive" });
    },
  });
}

export function useAddWatchlistItem() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: ({
      watchlistId,
      item,
    }: {
      watchlistId: string;
      item: { symbol: string; display_name: string; asset_type: string; exchange?: string };
    }) => addWatchlistItem(watchlistId, item),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlists"] });
      toast({ title: t.watchlist.itemAdded });
    },
    onError: (err: Error) => {
      toast({
        title: err.message === "Symbol already in watchlist" ? t.watchlist.itemExists : t.common.error,
        variant: "destructive",
      });
    },
  });
}

export function useRemoveWatchlistItem() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (itemId: string) => removeWatchlistItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlists"] });
      toast({ title: t.watchlist.itemRemoved });
    },
    onError: () => {
      toast({ title: t.common.error, variant: "destructive" });
    },
  });
}
