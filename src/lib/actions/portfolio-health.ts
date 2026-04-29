"use server";

import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { calculatePortfolioHealth, type PortfolioHealth } from "@/lib/portfolio/health";
import { prefetchFxRates } from "@/lib/currency/aggregate";
import type { Asset } from "@/types";

export async function getPortfolioHealth(): Promise<PortfolioHealth> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("assets")
    .select(
      "id, user_id, category, name, symbol, quantity, cost_basis, current_price, current_value, currency, country_code, is_auto_update, notes, created_at, updated_at"
    )
    .eq("user_id", user.id)
    .is("deleted_at", null);

  if (error) {
    logger.error({ err: error, userId: user.id }, "portfolio.health: query failed");
    return calculatePortfolioHealth([]);
  }

  const assets = (data ?? []) as Asset[];
  const fxRates = await prefetchFxRates(assets);
  return calculatePortfolioHealth(assets, fxRates);
}
