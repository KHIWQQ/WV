"use client";

import { useState } from "react";
import { Plus, Star, Trash2 } from "lucide-react";
import {
  useWatchlists,
  useCreateWatchlist,
  useDeleteWatchlist,
  useRemoveWatchlistItem,
} from "@/hooks/useWatchlist";
import { useTranslation } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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

/**
 * Dedicated /dashboard/watchlist page. The actions, types, dialog, and
 * react-query hooks already existed (used from the market search) — this
 * surface just gives the feature a home in the sidebar so users can find
 * what they've saved without going back to the market page.
 */
export default function WatchlistPage() {
  const { t } = useTranslation();
  const { data: watchlists = [], isLoading } = useWatchlists();
  const createMutation = useCreateWatchlist();
  const deleteMutation = useDeleteWatchlist();
  const removeItemMutation = useRemoveWatchlistItem();
  const [newName, setNewName] = useState("");

  function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    createMutation.mutate(name, {
      onSuccess: () => setNewName(""),
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t.watchlist.title}</h1>
        <p className="text-sm text-muted-foreground">{t.watchlist.subtitle}</p>
      </div>

      {/* Create form */}
      <Card variant="glass">
        <CardContent className="p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={t.watchlist.listName}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              className="sm:max-w-xs"
            />
            <Button
              onClick={handleCreate}
              disabled={createMutation.isPending || !newName.trim()}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              {t.watchlist.addList}
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="flex h-32 items-center justify-center text-muted-foreground">
            {t.common.loading}
          </CardContent>
        </Card>
      ) : watchlists.length === 0 ? (
        <Card>
          <CardContent className="flex h-32 items-center justify-center text-muted-foreground">
            {t.watchlist.empty}
          </CardContent>
        </Card>
      ) : (
        watchlists.map((wl) => {
          const items = wl.watchlist_items ?? [];
          return (
            <Card key={wl.id} variant="glass">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-500" />
                  <CardTitle className="text-base">{wl.name}</CardTitle>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {items.length} {t.watchlist.items}
                  </span>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-600 hover:text-red-700"
                        aria-label={t.watchlist.deleteList}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t.common.confirmDelete}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t.watchlist.deleteListConfirm}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-red-600 hover:bg-red-700"
                          onClick={() => deleteMutation.mutate(wl.id)}
                        >
                          {t.common.delete}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardHeader>
              <CardContent>
                {items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t.watchlist.noItems}</p>
                ) : (
                  <ul className="space-y-2">
                    {items.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{item.display_name}</p>
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              {item.symbol}
                            </Badge>
                            {item.exchange && (
                              <span className="truncate text-xs text-muted-foreground">
                                {item.exchange}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 text-red-600 hover:text-red-700"
                          aria-label={t.watchlist.removeItem}
                          onClick={() => removeItemMutation.mutate(item.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
