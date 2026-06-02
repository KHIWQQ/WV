"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { Card, CardContent } from "@/components/ui/card";
import { tradingViewLocale } from "@/lib/market/tradingview";
import { useTranslation } from "@/lib/i18n";

interface TradingViewChartProps {
  /** Already-mapped TradingView symbol, e.g. "SET:PTT" or "CRYPTO:BTCUSD". */
  tvSymbol: string;
}

const SCRIPT_SRC =
  "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";

/**
 * Embeds TradingView's free Advanced Real-Time Chart widget. The widget reads
 * its config once from the injected <script> body, so we re-inject whenever
 * the symbol, theme, or locale changes.
 */
export function TradingViewChart({ tvSymbol }: TradingViewChartProps) {
  const { locale, t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Reset any previously-injected widget before re-rendering.
    container.innerHTML = "";
    const widgetSlot = document.createElement("div");
    widgetSlot.className = "tradingview-widget-container__widget h-full w-full";
    container.appendChild(widgetSlot);

    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: tvSymbol,
      interval: "D",
      timezone: "Asia/Bangkok",
      theme: resolvedTheme === "dark" ? "dark" : "light",
      style: "1",
      locale: tradingViewLocale(locale),
      allow_symbol_change: false,
      withdateranges: true,
      hide_side_toolbar: false,
      support_host: "https://www.tradingview.com",
    });
    container.appendChild(script);

    return () => {
      container.innerHTML = "";
    };
  }, [tvSymbol, resolvedTheme, locale]);

  return (
    <Card variant="glass">
      <CardContent className="p-2">
        <div
          ref={containerRef}
          className="tradingview-widget-container h-[480px] w-full sm:h-[600px]"
        />
        <p className="px-2 py-1 text-right text-[10px] text-muted-foreground">
          {t.market.poweredByTradingView}
        </p>
      </CardContent>
    </Card>
  );
}
