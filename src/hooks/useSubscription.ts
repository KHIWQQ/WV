import { useAppStore } from "@/stores/useAppStore";
import { PREMIUM_FEATURES, type PremiumFeature } from "@/lib/subscription";

export function useSubscription() {
    const profile = useAppStore((state) => state.profile);
    const appSettings = useAppStore((state) => state.appSettings);

    const tier = (profile?.subscription_tier ?? "free") as "free" | "premium";
    const isPremium = tier === "premium";

    function canAccess(feature: PremiumFeature): boolean {
        // 1. Master switch from admin → all features open to everyone.
        if (appSettings.allFeaturesFree) return true;
        // 2. Per-feature override → "free" opens this one feature.
        if (appSettings.featureOverrides[feature] === "free") return true;
        // 3. A feature is accessible if user is premium OR the feature isn't gated.
        const isGated = (PREMIUM_FEATURES as readonly string[]).includes(feature);
        return !isGated || isPremium;
    }

    return {
        isPremium,
        tier,
        canAccess,
        // Exposed so <PremiumGate> can short-circuit without naming a feature.
        // True when the master switch is on — any gated UI should render.
        allFeaturesFree: appSettings.allFeaturesFree,
    };
}
