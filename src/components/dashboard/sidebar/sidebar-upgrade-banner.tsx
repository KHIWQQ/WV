"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import { PricingDialog } from "@/components/subscription/pricing-dialog";

interface SidebarUpgradeBannerProps {
  collapsed: boolean;
}

export function SidebarUpgradeBanner({ collapsed }: SidebarUpgradeBannerProps) {
  const { t } = useTranslation();
  const { isPremium } = useSubscription();
  const [showPricing, setShowPricing] = useState(false);

  if (isPremium || collapsed) return null;

  return (
    <div className="px-4 pb-2">
      <div className="rounded-xl border border-gold/20 bg-gold/5 p-4 text-center">
        <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-gold shadow-glow">
          <Sparkles className="h-4 w-4 text-navy" />
        </div>
        <h4 className="text-sm font-bold text-foreground">
          {t.sidebar.upgradeToUnlock}
        </h4>
        <p className="mt-1 text-xs text-muted-foreground mb-3 leading-tight">
          {t.sidebar.upgradeDesc}
        </p>
        <Button
          variant="gold"
          size="sm"
          className="w-full text-xs h-8"
          onClick={() => setShowPricing(true)}
        >
          {t.sidebar.seeBenefits}
        </Button>
      </div>
      <PricingDialog open={showPricing} onOpenChange={setShowPricing} />
    </div>
  );
}
