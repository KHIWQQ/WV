import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import {
  DEFAULT_APP_SETTINGS,
  type AppSettings,
  type PremiumFeature,
} from "./types";

/**
 * Read app-wide feature-flag settings. Cached per request via React.cache so
 * multiple gate checks during one render only hit the DB once.
 *
 * Returns DEFAULT_APP_SETTINGS if the row doesn't exist or the query fails —
 * fail-closed posture so a broken settings table doesn't accidentally open
 * up gated features.
 */
export const getAppSettings = cache(async (): Promise<AppSettings> => {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("app_settings")
      .select("all_features_free, feature_overrides")
      .eq("id", 1)
      .single();

    if (error || !data) {
      // Migration not applied yet, or transient error. Don't open gates.
      return DEFAULT_APP_SETTINGS;
    }

    return {
      allFeaturesFree: data.all_features_free ?? false,
      featureOverrides:
        (data.feature_overrides as AppSettings["featureOverrides"]) ?? {},
    };
  } catch (e) {
    logger.warn({ err: e }, "settings: failed to read app_settings");
    return DEFAULT_APP_SETTINGS;
  }
});

/**
 * Resolves whether a given feature is currently accessible to a free-tier
 * user, taking the master switch and per-feature overrides into account.
 *
 * Returns true ⇒ feature is open to everyone (no premium check needed).
 */
export async function isFeatureOpenToFree(
  feature: PremiumFeature
): Promise<boolean> {
  const settings = await getAppSettings();
  if (settings.allFeaturesFree) return true;
  return settings.featureOverrides[feature] === "free";
}
