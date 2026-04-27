"use client";

import { CheckCircle2, Crown, MessageCircle } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useSubscription } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/useToast";

interface PricingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PricingDialog({ open, onOpenChange }: PricingDialogProps) {
  const { t } = useTranslation();
  const { isPremium } = useSubscription();

  const handleContactAdmin = () => {
    toast({
      title: t.premium.contactAdmin,
      description: t.premium.contactAdminDesc,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            {t.premium.pricingTitle}
          </DialogTitle>
          <DialogDescription className="text-center">
            {t.premium.pricingDesc}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2 mt-4">
          {/* Free Plan */}
          <Card className={`relative ${isPremium ? "" : "ring-2 ring-primary"}`}>
            <CardContent className="p-5">
              <div className="mb-4">
                <h3 className="text-lg font-bold">{t.premium.freePlan}</h3>
                <p className="text-2xl font-bold mt-1">฿0</p>
              </div>
              <ul className="space-y-2.5">
                <li className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                  {t.premium.freeFeature1}
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                  {t.premium.freeFeature2}
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                  {t.premium.freeFeature3}
                </li>
              </ul>
              {!isPremium && (
                <div className="mt-4 pt-3 border-t text-center text-xs font-medium text-muted-foreground">
                  {t.premium.currentPlan}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Premium Plan */}
          <Card className={`relative ${isPremium ? "ring-2 ring-gold" : "border-gold/30"}`}>
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-gold px-3 py-1 text-xs font-bold text-navy shadow-glow">
                <Crown className="h-3 w-3" />
                {t.premium.premiumPlan}
              </span>
            </div>
            <CardContent className="p-5 pt-6">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gold">{t.premium.premiumPlan}</h3>
                <p className="text-2xl font-bold mt-1">{t.premium.premiumPrice}</p>
              </div>
              <ul className="space-y-2.5">
                <li className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-emerald-500 flex-shrink-0" />
                  {t.premium.premiumFeature1}
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-emerald-500 flex-shrink-0" />
                  {t.premium.premiumFeature2}
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-emerald-500 flex-shrink-0" />
                  {t.premium.premiumFeature3}
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-emerald-500 flex-shrink-0" />
                  {t.premium.premiumFeature4}
                </li>
              </ul>
              {isPremium ? (
                <div className="mt-4 pt-3 border-t text-center text-xs font-medium text-gold">
                  {t.premium.currentPlan}
                </div>
              ) : (
                <Button
                  variant="gold"
                  size="sm"
                  className="w-full mt-4 gap-2"
                  onClick={handleContactAdmin}
                >
                  <MessageCircle className="h-4 w-4" />
                  {t.premium.contactAdmin}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
