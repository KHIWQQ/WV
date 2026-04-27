"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useWatchlists, useAddWatchlistItem, useCreateWatchlist } from "@/hooks/useWatchlist";
import { useSubscription } from "@/hooks/useSubscription";
import { Input } from "@/components/ui/input";
import { Plus, Star, Lock } from "lucide-react";
import {
  FREE_WATCHLIST_ITEMS_LIMIT,
  PREMIUM_WATCHLIST_ITEMS_LIMIT,
  FREE_WATCHLIST_LIMIT,
  PREMIUM_WATCHLIST_LIMIT,
} from "@/lib/market/utils";
import type { WatchlistWithItems } from "@/lib/actions/watchlist";

interface AddToWatchlistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  symbol: string;
  displayName: string;
  assetType: string;
  exchange?: string;
}

export function AddToWatchlistDialog({
  open,
  onOpenChange,
  symbol,
  displayName,
  assetType,
  exchange,
}: AddToWatchlistDialogProps) {
  const { t } = useTranslation();
  const { data: watchlists = [] } = useWatchlists();
  const addMutation = useAddWatchlistItem();
  const createMutation = useCreateWatchlist();
  const { isPremium } = useSubscription();
  const [newName, setNewName] = useState("");

  const maxWatchlists = isPremium ? PREMIUM_WATCHLIST_LIMIT : FREE_WATCHLIST_LIMIT;
  const maxItems = isPremium ? PREMIUM_WATCHLIST_ITEMS_LIMIT : FREE_WATCHLIST_ITEMS_LIMIT;
  const canCreateWatchlist = watchlists.length < maxWatchlists;

  function isWatchlistFull(wl: WatchlistWithItems) {
    return (wl.watchlist_items?.length ?? 0) >= maxItems;
  }

  function handleAdd(watchlistId: string) {
    addMutation.mutate(
      {
        watchlistId,
        item: { symbol, display_name: displayName, asset_type: assetType, exchange },
      },
      { onSuccess: () => onOpenChange(false) }
    );
  }

  function handleCreateAndAdd() {
    if (!newName.trim()) return;
    createMutation.mutate(newName.trim(), {
      onSuccess: (wl) => {
        addMutation.mutate(
          {
            watchlistId: wl.id,
            item: { symbol, display_name: displayName, asset_type: assetType, exchange },
          },
          { onSuccess: () => onOpenChange(false) }
        );
      },
    });
    setNewName("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            {t.watchlist.addToWatchlist} — {symbol}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {watchlists.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t.watchlist.noWatchlistCreate}</p>
          ) : (
            watchlists.map((wl) => {
              const full = isWatchlistFull(wl as WatchlistWithItems);
              return (
                <Button
                  key={wl.id}
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => handleAdd(wl.id)}
                  disabled={addMutation.isPending || full}
                >
                  <Star className="h-4 w-4" />
                  {wl.name}
                  <span className="ml-auto text-xs text-muted-foreground">
                    {(wl as WatchlistWithItems).watchlist_items?.length ?? 0}/{maxItems}
                  </span>
                  {full && <Lock className="h-3 w-3 text-muted-foreground" />}
                </Button>
              );
            })
          )}

          {canCreateWatchlist && (
            <div className="border-t pt-3">
              <p className="text-xs text-muted-foreground mb-2">{t.watchlist.createNew}</p>
              <div className="flex gap-2">
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder={t.watchlist.listName}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateAndAdd()}
                />
                <Button
                  size="sm"
                  onClick={handleCreateAndAdd}
                  disabled={createMutation.isPending || !newName.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {!canCreateWatchlist && !isPremium && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 border-t pt-3">
              <Lock className="h-3 w-3" />
              {t.watchlist.upgradePremium}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
