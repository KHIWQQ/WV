import "server-only";
import { createClient } from "@/lib/supabase/server";
import { PremiumRequiredError, type SubscriptionTier, type PremiumFeature } from "./types";

export async function getUserTier(): Promise<SubscriptionTier> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return "free";

  const { data } = await supabase
    .from("profiles")
    .select("subscription_tier")
    .eq("id", user.id)
    .single();

  return (data?.subscription_tier ?? "free") as SubscriptionTier;
}

/**
 * Throws PremiumRequiredError if user is not premium.
 * Use in server actions and route handlers as a hard guard.
 */
export async function requirePremium(feature: PremiumFeature): Promise<void> {
  const tier = await getUserTier();
  if (tier !== "premium") {
    throw new PremiumRequiredError(feature);
  }
}

export async function isPremium(): Promise<boolean> {
  const tier = await getUserTier();
  return tier === "premium";
}
