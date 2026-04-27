"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { yahooProvider } from "@/lib/market";

export interface SyncResult {
  synced: number;
  failed: number;
  skipped: number;
}

export async function syncAssetPrices(): Promise<SyncResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Get all assets with is_auto_update and a symbol
  const { data: assets, error } = await supabase
    .from("assets")
    .select("id, symbol, quantity")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .eq("is_auto_update", true)
    .not("symbol", "is", null);

  if (error) throw new Error(error.message);
  if (!assets || assets.length === 0) return { synced: 0, failed: 0, skipped: 0 };

  const symbolsToFetch = assets
    .map((a) => a.symbol!)
    .filter(Boolean);

  if (symbolsToFetch.length === 0) return { synced: 0, failed: 0, skipped: 0 };

  // Fetch quotes in batches of 20
  const allQuotes = new Map<string, number>();
  for (let i = 0; i < symbolsToFetch.length; i += 20) {
    const batch = symbolsToFetch.slice(i, i + 20);
    try {
      const quotes = await yahooProvider.quote(batch);
      for (const q of quotes) {
        allQuotes.set(q.symbol, q.price);
      }
    } catch {
      // continue with next batch
    }
  }

  let synced = 0;
  let failed = 0;
  let skipped = 0;

  const payload = assets.map(asset => {
    const price = allQuotes.get(asset.symbol!);
    if (price === undefined) {
      skipped++;
      return null;
    }
    return {
      id: asset.id,
      price,
      value: asset.quantity * price,
    };
  }).filter(Boolean);

  if (payload.length > 0) {
    const { error: batchError } = await supabase.rpc("update_asset_prices_batch", {
      p_user_id: user.id,
      p_payload: payload,
    });

    if (batchError) {
      failed += payload.length;
    } else {
      synced += payload.length;
    }
  }

  revalidatePath("/dashboard");
  return { synced, failed, skipped };
}
