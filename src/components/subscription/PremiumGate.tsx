"use client";

import { ReactNode, useState } from "react";
import { Lock, Sparkles, CheckCircle2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useSubscription } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import { PricingDialog } from "@/components/subscription/pricing-dialog";
import type { PremiumFeature } from "@/lib/subscription";

interface PremiumGateProps {
    children: ReactNode;
    featureName: string;
    /**
     * Optional feature key. When provided, the gate respects per-feature
     * overrides from the admin /features page (in addition to the master
     * "all free" switch and the user's tier). Without it, the gate falls
     * back to the binary tier check.
     */
    feature?: PremiumFeature;
}

export function PremiumGate({ children, featureName, feature }: PremiumGateProps) {
    const { t } = useTranslation();
    const { isPremium, canAccess } = useSubscription();
    const [showPricing, setShowPricing] = useState(false);

    // If a specific feature key is provided, honor it — covers master switch,
    // per-feature override, and tier all in one. Otherwise binary tier check.
    const allowed = feature ? canAccess(feature) : isPremium;
    if (allowed) {
        return <>{children}</>;
    }

    return (
        <div className="relative flex min-h-[calc(100vh-8rem)] w-full items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/5 dark:bg-black/20">
            {/* Decorative blurred background */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-30 blur-[8px] grayscale transition-all duration-700">
                <div className="grid grid-cols-2 gap-4 p-8 h-full w-full">
                    <div className="h-48 rounded-2xl bg-muted/50"></div>
                    <div className="h-48 rounded-2xl bg-muted/50"></div>
                    <div className="col-span-2 h-64 rounded-2xl bg-muted/50"></div>
                </div>
            </div>

            {/* Glassmorphic Overlay Content */}
            <div className="relative z-10 flex max-w-lg flex-col items-center justify-center rounded-2xl border border-white/20 bg-white/60 p-10 text-center shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-card/60">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-gold shadow-glow">
                    <Lock className="h-10 w-10 text-navy" />
                </div>

                <h2 className="mb-3 text-3xl font-bold tracking-tight text-foreground">
                    {featureName}
                </h2>

                <p className="mb-8 text-muted-foreground font-medium">
                    {t.premium.featureRestricted}
                </p>

                <ul className="mb-8 flex flex-col gap-3 text-left w-full pl-4">
                    <li className="flex items-center gap-3 text-sm font-medium">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        {t.premium.unlimitedItems}
                    </li>
                    <li className="flex items-center gap-3 text-sm font-medium">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        {t.premium.accessFeatures}
                    </li>
                    <li className="flex items-center gap-3 text-sm font-medium">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        {t.premium.retirementTools}
                    </li>
                </ul>

                <Button
                    size="lg"
                    variant="gold"
                    className="w-full gap-2 text-md h-12"
                    onClick={() => setShowPricing(true)}
                >
                    <Sparkles className="h-5 w-5" />
                    {t.premium.upgradeToPremium}
                </Button>
            </div>

            <PricingDialog open={showPricing} onOpenChange={setShowPricing} />
        </div>
    );
}
