import { useAppStore } from "@/stores/useAppStore";
import { PREMIUM_FEATURES, type PremiumFeature } from "@/lib/subscription";

export function useSubscription() {
    const profile = useAppStore((state) => state.profile);

    const tier = (profile?.subscription_tier ?? "free") as "free" | "premium";
    const isPremium = tier === "premium";

    function canAccess(feature: PremiumFeature): boolean {
        // A feature is accessible if user is premium OR the feature isn't gated.
        const isGated = (PREMIUM_FEATURES as readonly string[]).includes(feature);
        return !isGated || isPremium;
    }

    return {
        isPremium,
        tier,
        canAccess,
    };
}
