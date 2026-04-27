"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n";
import { Plus, Trash2, X, Star, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PriceTicker } from "./price-ticker";
import {
  useWatchlists,
  useCreateWatchlist,
  useDeleteWatchlist,
  useRemoveWatchlistItem,
} from "@/hooks/useWatchlist";
import { useMarketQuote } from "@/hooks/useMarket";
import { useSubscription } from "@/hooks/useSubscription";
import {
  FREE_WATCHLIST_LIMIT,
  PREMIUM_WATCHLIST_LIMIT,
} from "@/lib/market/utils";
import type { WatchlistWithItems } from "@/lib/actions/watchlist";

interface WatchlistPanelProps {
  onSymbolClick?: (symbol: string) => void;
}

export function WatchlistPanel({ onSymbolClick }: WatchlistPanelProps) {
  const { t } = useTranslation();
  const { data: watchlists = [], isLoading } = useWatchlists();
  const createMutation = useCreateWatchlist();
  const deleteMutation = useDeleteWatchlist();
  const { isPremium } = useSubscription();
  const [showNewInput, setShowNewInput] = useState(false);
  const [newName, setNewName] = useState("");

  const maxWatchlists = isPremium ? PREMIUM_WATCHLIST_LIMIT : FREE_WATCHLIST_LIMIT;
  const canCreate = watchlists.length < maxWatchlists;

  function handleCreate() {
    if (!newName.trim()) return;
    createMutation.mutate(newName.trim());
    setNewName("");
    setShowNewInput(false);
  }

  if (isLoading) {
    return (
      <Card variant="glass">
        <CardContent className="p-6">
          <div className="h-40 animate-pulse rounded-lg bg-muted" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          {t.watchlist.title}
        </h2>
        {canCreate ? (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1"
            onClick={() => setShowNewInput(true)}
          >
            <Plus className="h-4 w-4" />
            {t.watchlist.add}
          </Button>
        ) : (
          !isPremium && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Lock className="h-3 w-3" />
              {t.watchlist.limited} {FREE_WATCHLIST_LIMIT} {t.common.items}
            </span>
          )
        )}
      </div>

      {showNewInput && (
        <div className="flex gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={t.watchlist.listName}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            autoFocus
          />
          <Button size="sm" onClick={handleCreate} disabled={createMutation.isPending}>
            {t.common.save}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => setShowNewInput(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {watchlists.length === 0 && !showNewInput ? (
        <Card>
          <CardContent className="flex h-24 items-center justify-center text-sm text-muted-foreground">
            {t.watchlist.noWatchlist}
          </CardContent>
        </Card>
      ) : (
        watchlists.map((wl) => (
          <WatchlistCard
            key={wl.id}
            watchlist={wl}
            onDelete={() => deleteMutation.mutate(wl.id)}
            onSymbolClick={onSymbolClick}
          />
        ))
      )}
    </div>
  );
}

function WatchlistCard({
  watchlist,
  onDelete,
  onSymbolClick,
}: {
  watchlist: WatchlistWithItems;
  onDelete: () => void;
  onSymbolClick?: (symbol: string) => void;
}) {
  const { t } = useTranslation();
  const removeMutation = useRemoveWatchlistItem();
  const symbols = watchlist.watchlist_items.map((i) => i.symbol);
  const { data: quotes = [] } = useMarketQuote(symbols);

  const quoteMap = new Map(quotes.map((q) => [q.symbol, q]));

  return (
    <Card variant="glass">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">
            {watchlist.name}
            <span className="ml-2 text-xs text-muted-foreground font-normal">
              ({watchlist.watchlist_items.length})
            </span>
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-red-600"
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {watchlist.watchlist_items.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">
            {t.watchlist.noSymbols}
          </p>
        ) : (
          <div className="space-y-1.5">
            {watchlist.watchlist_items.map((item) => {
              const quote = quoteMap.get(item.symbol);
              if (!quote) {
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <span className="text-sm font-medium">{item.symbol}</span>
                    <div className="flex items-center gap-1">
                      <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removeMutation.mutate(item.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              }
              return (
                <div key={item.id} className="flex items-center gap-1">
                  <div className="flex-1">
                    <PriceTicker
                      quote={quote}
                      onClick={() => onSymbolClick?.(item.symbol)}
                      compact
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-muted-foreground hover:text-red-600"
                    onClick={() => removeMutation.mutate(item.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
