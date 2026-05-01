"use server";

import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { prefetchFxRates, convertToHome } from "@/lib/currency/aggregate";
import { computeAllocation, detectConcentration, type CategoryAllocation, type DriftAlert } from "@/lib/finance/ratios";

export interface AllocationData {
  allocation: CategoryAllocation[];
  alerts: DriftAlert[];
}

/**
 * Fetch user's assets, convert each to THB, group by category, and detect
 * concentration alerts. Reused by the dashboard drift card and the
 * allocation chart section.
 */
export async function getAllocation(): Promise<AllocationData> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: rows, error } = await supabase
    .from("assets")
    .select("category, current_value, currency")
    .eq("user_id", user.id)
    .is("deleted_at", null);

  if (error) {
    logger.error({ err: error, userId: user.id }, "allocation: assets query failed");
    return { allocation: [], alerts: [] };
  }

  const assets = rows ?? [];
  const fxRates = await prefetchFxRates(assets);
  const enriched = assets.map((a) => ({
    category: a.category,
    valueHome: convertToHome(Number(a.current_value) || 0, a.currency, fxRates),
  }));
  const allocation = computeAllocation(enriched);
  const alerts = detectConcentration(allocation);

  return { allocation, alerts };
}
