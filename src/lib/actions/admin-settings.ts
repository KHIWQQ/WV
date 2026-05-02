"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { logger } from "@/lib/logger";
import {
  DEFAULT_APP_SETTINGS,
  PREMIUM_FEATURES,
  type AppSettings,
  type PremiumFeature,
} from "@/lib/subscription";

function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Missing Supabase service-role credentials");
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function requireSuperadmin() {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "superadmin") {
    throw new Error("Forbidden: superadmin role required");
  }
  return user;
}

/**
 * Read the singleton app_settings row. Falls back to DEFAULT_APP_SETTINGS
 * if the migration hasn't been applied or the row isn't seeded.
 */
export async function getAppSettingsForAdmin(): Promise<AppSettings> {
  await requireSuperadmin();
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("app_settings")
    .select("all_features_free, feature_overrides")
    .eq("id", 1)
    .single();
  if (error || !data) {
    logger.warn({ err: error }, "admin-settings: read failed, returning defaults");
    return DEFAULT_APP_SETTINGS;
  }
  return {
    allFeaturesFree: data.all_features_free ?? false,
    featureOverrides: (data.feature_overrides ?? {}) as AppSettings["featureOverrides"],
  };
}

interface UpdateAppSettingsInput {
  allFeaturesFree: boolean;
  featureOverrides?: Partial<Record<PremiumFeature, "free" | "premium">>;
}

export async function updateAppSettings(input: UpdateAppSettingsInput) {
  const user = await requireSuperadmin();

  // Whitelist feature keys server-side — never trust client input verbatim.
  const cleanOverrides: AppSettings["featureOverrides"] = {};
  if (input.featureOverrides) {
    for (const f of PREMIUM_FEATURES) {
      const v = input.featureOverrides[f];
      if (v === "free" || v === "premium") cleanOverrides[f] = v;
    }
  }

  const admin = getAdminSupabase();
  const { error } = await admin
    .from("app_settings")
    .update({
      all_features_free: !!input.allFeaturesFree,
      feature_overrides: cleanOverrides,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    })
    .eq("id", 1);

  if (error) {
    logger.error({ err: error }, "admin-settings: update failed");
    throw new Error(error.message);
  }

  await logAudit("settings.update", "app_settings", "1", {
    diff: {
      allFeaturesFree: input.allFeaturesFree,
      featureOverrides: cleanOverrides,
    },
  });

  // Refresh every page so the new flags propagate to the dashboard layout
  // hydrator on next nav.
  revalidatePath("/", "layout");
}
