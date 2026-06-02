"use client";

import { useEffect, useState } from "react";
import { Lock, Sparkles, CandlestickChart, LineChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PriceChart } from "@/components/market/price-chart";
import { TradingViewChart } from "@/components/market/tradingview-chart";
import { PricingDialog } from "@/components/subscription/pricing-dialog";
import { useSubscription } from "@/hooks/useSubscription";
import { toTradingViewSymbol } from "@/lib/market/tradingview";
import { cn } from "@/lib/utils/cn";
import { useTranslation } from "@/lib/i18n";
import type { AssetType } from "@/types";

type Mode = "pro" | "lite";
const STORAGE_KEY = "wv:market-chart-mode";
const PRO_FEATURE = "advanced_market_data" as const;

interface MarketChartProps {
  symbol: string;
  name?: string;
  assetType: AssetType;
  exchange?: string;
}

export function MarketChart({ symbol, name, assetType, exchange }: MarketChartProps) {
  const { t } = useTranslation();
  const { canAccess } = useSubscription();
  const hasProAccess = canAccess(PRO_FEATURE);

  const tvSymbol = toTradingViewSymbol({ symbol, assetType, exchange });
  const canPro = tvSymbol !== null;

  const [mode, setMode] = useState<Mode>("lite");
  const [showPricing, setShowPricing] = useState(false);

  // Client-only default: honor a saved preference, otherwise auto-pick Pro on
  // desktop (when available + unlocked) and Lite on mobile. Kept in an effect
  // so SSR always renders Lite and there's no hydration mismatch.
  useEffect(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (saved === "pro" || saved === "lite") {
      setMode(saved);
      return;
    }
    const isDesktop =
      typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches;
    setMode(canPro && hasProAccess && isDesktop ? "pro" : "lite");
  }, [canPro, hasProAccess]);

  function selectMode(next: Mode) {
    setMode(next);
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, next);
  }

  return (
    <div className="space-y-3">
      {/* Pro / Lite segmented toggle */}
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center rounded-lg border border-border bg-muted/40 p-0.5">
          <ToggleButton
            active={mode === "pro"}
            disabled={!canPro}
            title={!canPro ? t.market.proUnavailable : undefined}
            onClick={() => selectMode("pro")}
          >
            {!hasProAccess && canPro ? (
              <Lock className="h-3.5 w-3.5" />
            ) : (
              <CandlestickChart className="h-3.5 w-3.5" />
            )}
            {t.market.proChart}
          </ToggleButton>
          <ToggleButton active={mode === "lite"} onClick={() => selectMode("lite")}>
            <LineChart className="h-3.5 w-3.5" />
            {t.market.liteChart}
          </ToggleButton>
        </div>
      </div>

      {mode === "pro" && canPro ? (
        hasProAccess ? (
          <TradingViewChart tvSymbol={tvSymbol} />
        ) : (
          <ProUpgradeCard onUpgrade={() => setShowPricing(true)} />
        )
      ) : (
        <>
          <PriceChart symbol={symbol} name={name} />
          {mode === "pro" && !canPro && (
            <p className="text-center text-xs text-muted-foreground">{t.market.proUnavailable}</p>
          )}
        </>
      )}

      <PricingDialog open={showPricing} onOpenChange={setShowPricing} />
    </div>
  );
}

function ToggleButton({
  active,
  disabled,
  title,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  title?: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      title={title}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
        disabled && "cursor-not-allowed opacity-40 hover:text-muted-foreground"
      )}
    >
      {children}
    </button>
  );
}

function ProUpgradeCard({ onUpgrade }: { onUpgrade: () => void }) {
  const { t } = useTranslation();
  return (
    <Card variant="glass">
      <CardContent className="flex h-[480px] flex-col items-center justify-center gap-4 p-8 text-center sm:h-[600px]">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-gold shadow-glow">
          <Lock className="h-8 w-8 text-navy" />
        </div>
        <h3 className="text-xl font-bold tracking-tight">{t.market.proChartTitle}</h3>
        <p className="max-w-md text-sm text-muted-foreground">{t.market.proChartDesc}</p>
        <Button variant="gold" className="gap-2" onClick={onUpgrade}>
          <Sparkles className="h-4 w-4" />
          {t.premium.upgradeToPremium}
        </Button>
      </CardContent>
    </Card>
  );
}
