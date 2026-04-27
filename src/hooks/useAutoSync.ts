"use client";

import { useEffect } from "react";
import { useSyncPrices } from "@/hooks/useSyncPrices";

const AUTO_SYNC_INTERVAL = 5 * 60_000; // 5 minutes
const STORAGE_KEY = "wv:lastAutoSync";

/**
 * Auto-sync asset prices on mount, throttled to once every 5 minutes
 * via localStorage timestamp. Call this hook on the dashboard page.
 */
export function useAutoSync() {
  const syncMutation = useSyncPrices();

  useEffect(() => {
    const lastSync = localStorage.getItem(STORAGE_KEY);
    const now = Date.now();

    if (lastSync && now - parseInt(lastSync, 10) < AUTO_SYNC_INTERVAL) {
      return; // Too soon, skip
    }

    // Mark as syncing immediately to prevent double-fire from Strict Mode
    localStorage.setItem(STORAGE_KEY, String(now));

    syncMutation.mutate();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
