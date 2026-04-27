"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const watchlistNameSchema = z.string().min(1).max(100).trim();
const watchlistItemSchema = z.object({
  symbol: z.string().min(1).max(30).trim(),
  display_name: z.string().min(1).max(200).trim(),
  asset_type: z.string().min(1).max(30),
  exchange: z.string().max(100).optional(),
});

export interface Watchlist {
  id: string;
  user_id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export interface WatchlistItem {
  id: string;
  watchlist_id: string;
  symbol: string;
  display_name: string;
  asset_type: string;
  exchange: string | null;
  sort_order: number;
  added_at: string;
}

export interface WatchlistWithItems extends Watchlist {
  watchlist_items: WatchlistItem[];
}

export async function getWatchlists(): Promise<WatchlistWithItems[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("watchlists")
    .select("*, watchlist_items(*)")
    .eq("user_id", user.id)
    .order("sort_order");

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createWatchlist(name: string): Promise<Watchlist> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const validatedName = watchlistNameSchema.parse(name);

  const { data, error } = await supabase
    .from("watchlists")
    .insert({ user_id: user.id, name: validatedName })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/market");
  return data;
}

export async function deleteWatchlist(id: string): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("watchlists")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/market");
}

export async function addWatchlistItem(
  watchlistId: string,
  item: { symbol: string; display_name: string; asset_type: string; exchange?: string }
): Promise<WatchlistItem> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Verify ownership
  const { data: wl } = await supabase
    .from("watchlists")
    .select("id")
    .eq("id", watchlistId)
    .eq("user_id", user.id)
    .single();

  if (!wl) throw new Error("Watchlist not found");

  const validatedItem = watchlistItemSchema.parse(item);

  const { data, error } = await supabase
    .from("watchlist_items")
    .insert({
      watchlist_id: watchlistId,
      symbol: validatedItem.symbol,
      display_name: validatedItem.display_name,
      asset_type: validatedItem.asset_type,
      exchange: validatedItem.exchange || null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") throw new Error("Symbol already in watchlist");
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/market");
  return data;
}

export async function removeWatchlistItem(itemId: string): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Verify the item belongs to a watchlist owned by this user
  const { data: item } = await supabase
    .from("watchlist_items")
    .select("id, watchlist_id")
    .eq("id", itemId)
    .single();

  if (!item) throw new Error("Item not found");

  const { data: watchlist } = await supabase
    .from("watchlists")
    .select("id")
    .eq("id", item.watchlist_id)
    .eq("user_id", user.id)
    .single();

  if (!watchlist) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("watchlist_items")
    .delete()
    .eq("id", itemId);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/market");
}
