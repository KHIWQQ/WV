"use client";

import { useEffect, useRef, useState } from "react";
import {
  createChart,
  CandlestickSeries,
  AreaSeries,
  LineSeries,
  HistogramSeries,
  ColorType,
  CrosshairMode,
  LineStyle,
  type IChartApi,
  type Time,
} from "lightweight-charts";
import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMarketHistory } from "@/hooks/useMarket";
import { sma, rsi, macd, heikinAshi } from "@/lib/market/indicators";
import { cn } from "@/lib/utils/cn";
import { useTranslation } from "@/lib/i18n";
import type { TimeRange } from "@/types";

const RANGES: { value: TimeRange; label: string }[] = [
  { value: "5d", label: "5D" },
  { value: "1mo", label: "1M" },
  { value: "3mo", label: "3M" },
  { value: "6mo", label: "6M" },
  { value: "1y", label: "1Y" },
  { value: "5y", label: "5Y" },
  { value: "max", label: "Max" },
];

const INTL_LOCALE: Record<string, string> = { th: "th-TH", en: "en-US", zh: "zh-CN" };

type ChartType = "candles" | "heikin" | "line" | "area";

interface LightweightChartProps {
  symbol: string;
  name?: string;
}

export function LightweightChart({ symbol, name }: LightweightChartProps) {
  const { t, locale } = useTranslation();
  const { resolvedTheme } = useTheme();
  const [range, setRange] = useState<TimeRange>("3mo");
  const { data: history = [], isLoading } = useMarketHistory(symbol, range);

  const hasOhlc = history.some((p) => p.open != null && p.high != null && p.low != null);
  const hasVolume = history.some((p) => p.volume != null && p.volume > 0);

  const [chartType, setChartType] = useState<ChartType>("candles");
  const [showMa, setShowMa] = useState(false);
  const [showVol, setShowVol] = useState(true);
  const [showRsi, setShowRsi] = useState(false);
  const [showMacd, setShowMacd] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  // Close-only providers (e.g. CoinGecko) can't draw candles → use a line.
  const effectiveType: ChartType =
    !hasOhlc && (chartType === "candles" || chartType === "heikin") ? "area" : chartType;

  useEffect(() => {
    const container = containerRef.current;
    if (!container || history.length === 0) return;

    const isDark = resolvedTheme === "dark";
    const gridColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
    const textColor = isDark ? "#cbd5e1" : "#475569";

    const chart = createChart(container, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor,
        fontFamily: "inherit",
      },
      grid: { vertLines: { color: gridColor }, horzLines: { color: gridColor } },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: gridColor },
      timeScale: { borderColor: gridColor, timeVisible: false, rightOffset: 4 },
      localization: { locale: INTL_LOCALE[locale] ?? "th-TH" },
    });
    chartRef.current = chart;

    const closes = history.map((p) => p.close);
    const bars = history.map((p) => ({
      open: p.open ?? p.close,
      high: p.high ?? p.close,
      low: p.low ?? p.close,
      close: p.close,
    }));

    // ── Main price series (pane 0) ─────────────────────────────
    if (effectiveType === "candles" || effectiveType === "heikin") {
      const src = effectiveType === "heikin" ? heikinAshi(bars) : bars;
      const series = chart.addSeries(CandlestickSeries, {
        upColor: "#10b981",
        downColor: "#ef4444",
        borderUpColor: "#10b981",
        borderDownColor: "#ef4444",
        wickUpColor: "#10b981",
        wickDownColor: "#ef4444",
      });
      series.setData(
        src.map((b, i) => ({
          time: history[i].date as Time,
          open: b.open,
          high: b.high,
          low: b.low,
          close: b.close,
        }))
      );
    } else if (effectiveType === "line") {
      const series = chart.addSeries(LineSeries, { color: "#D4A843", lineWidth: 2 });
      series.setData(history.map((p) => ({ time: p.date as Time, value: p.close })));
    } else {
      const series = chart.addSeries(AreaSeries, {
        lineColor: "#D4A843",
        topColor: "rgba(212,168,67,0.3)",
        bottomColor: "rgba(212,168,67,0)",
        lineWidth: 2,
      });
      series.setData(history.map((p) => ({ time: p.date as Time, value: p.close })));
    }

    // ── Moving averages overlay (pane 0) ───────────────────────
    if (showMa) {
      const add = (period: number, color: string) => {
        const vals = sma(closes, period);
        const line = chart.addSeries(LineSeries, {
          color,
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false,
        });
        line.setData(
          history
            .map((p, i) => ({ time: p.date as Time, value: vals[i] }))
            .filter((d) => d.value != null) as { time: Time; value: number }[]
        );
      };
      add(20, "#3b82f6");
      add(50, "#f59e0b");
    }

    // ── Volume overlay (pane 0, bottom strip) ──────────────────
    if (showVol && hasVolume) {
      const vol = chart.addSeries(HistogramSeries, {
        priceScaleId: "vol",
        priceFormat: { type: "volume" },
        lastValueVisible: false,
      });
      vol.setData(
        history.map((p, i) => ({
          time: p.date as Time,
          value: p.volume ?? 0,
          color: bars[i].close >= bars[i].open ? "rgba(16,185,129,0.4)" : "rgba(239,68,68,0.4)",
        }))
      );
      vol.priceScale().applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
    }

    // ── RSI sub-pane ───────────────────────────────────────────
    let paneIndex = 1;
    if (showRsi) {
      const vals = rsi(closes, 14);
      const rsiSeries = chart.addSeries(
        LineSeries,
        { color: "#8b5cf6", lineWidth: 1, priceLineVisible: false, lastValueVisible: false },
        paneIndex
      );
      rsiSeries.setData(
        history
          .map((p, i) => ({ time: p.date as Time, value: vals[i] }))
          .filter((d) => d.value != null) as { time: Time; value: number }[]
      );
      [30, 70].forEach((lvl) =>
        rsiSeries.createPriceLine({
          price: lvl,
          color: gridColor,
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: `${lvl}`,
        })
      );
      paneIndex += 1;
    }

    // ── MACD sub-pane ──────────────────────────────────────────
    if (showMacd) {
      const m = macd(closes);
      const hist = chart.addSeries(
        HistogramSeries,
        { priceLineVisible: false, lastValueVisible: false },
        paneIndex
      );
      hist.setData(
        history
          .map((p, i) => ({
            time: p.date as Time,
            value: m[i].hist,
            color: (m[i].hist ?? 0) >= 0 ? "rgba(16,185,129,0.5)" : "rgba(239,68,68,0.5)",
          }))
          .filter((d) => d.value != null) as { time: Time; value: number; color: string }[]
      );
      const macdLine = chart.addSeries(
        LineSeries,
        { color: "#3b82f6", lineWidth: 1, priceLineVisible: false, lastValueVisible: false },
        paneIndex
      );
      macdLine.setData(
        history
          .map((p, i) => ({ time: p.date as Time, value: m[i].macd }))
          .filter((d) => d.value != null) as { time: Time; value: number }[]
      );
      const signalLine = chart.addSeries(
        LineSeries,
        { color: "#f59e0b", lineWidth: 1, priceLineVisible: false, lastValueVisible: false },
        paneIndex
      );
      signalLine.setData(
        history
          .map((p, i) => ({ time: p.date as Time, value: m[i].signal }))
          .filter((d) => d.value != null) as { time: Time; value: number }[]
      );
    }

    // Keep the price pane dominant; sub-panes stay compact.
    const panes = chart.panes();
    if (panes.length > 1) {
      panes[0].setStretchFactor(panes.length * 3);
      for (let i = 1; i < panes.length; i++) panes[i].setStretchFactor(1);
    }

    chart.timeScale().fitContent();

    return () => {
      chart.remove();
      chartRef.current = null;
    };
  }, [history, resolvedTheme, locale, effectiveType, showMa, showVol, hasVolume, showRsi, showMacd]);

  const bigHeight = "h-[68vh] min-h-[460px] sm:min-h-[620px]";

  return (
    <Card variant="glass">
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-lg font-bold">{name || symbol}</CardTitle>
        <div className="flex flex-wrap gap-1">
          {RANGES.map((r) => (
            <Button
              key={r.value}
              variant={range === r.value ? "default" : "ghost"}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setRange(r.value)}
            >
              {r.label}
            </Button>
          ))}
        </div>
      </CardHeader>

      {/* Controls: chart type + indicator toggles */}
      <div className="flex flex-wrap items-center gap-2 px-6 pb-2">
        <div className="inline-flex rounded-md border border-border bg-muted/40 p-0.5">
          {(["candles", "heikin", "line", "area"] as ChartType[]).map((tp) => {
            const disabled = !hasOhlc && (tp === "candles" || tp === "heikin");
            return (
              <button
                key={tp}
                type="button"
                disabled={disabled}
                onClick={() => setChartType(tp)}
                className={cn(
                  "rounded px-2 py-1 text-xs font-medium capitalize transition-colors",
                  effectiveType === tp
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                  disabled && "cursor-not-allowed opacity-40"
                )}
              >
                {tp}
              </button>
            );
          })}
        </div>
        <Chip active={showMa} onClick={() => setShowMa((v) => !v)}>MA</Chip>
        <Chip active={showVol && hasVolume} disabled={!hasVolume} onClick={() => setShowVol((v) => !v)}>
          Vol
        </Chip>
        <Chip active={showRsi} onClick={() => setShowRsi((v) => !v)}>RSI</Chip>
        <Chip active={showMacd} onClick={() => setShowMacd((v) => !v)}>MACD</Chip>
      </div>

      <CardContent>
        {isLoading ? (
          <div className={cn("flex items-center justify-center text-muted-foreground", bigHeight)}>
            {t.market.loadingChart}
          </div>
        ) : history.length === 0 ? (
          <div className={cn("flex items-center justify-center text-muted-foreground", bigHeight)}>
            {t.market.noPriceData}
          </div>
        ) : (
          <div ref={containerRef} className={cn("w-full", bigHeight)} />
        )}
      </CardContent>
    </Card>
  );
}

function Chip({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "rounded-md border px-2 py-1 text-xs font-medium transition-colors",
        active
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-border text-muted-foreground hover:text-foreground",
        disabled && "cursor-not-allowed opacity-40"
      )}
    >
      {children}
    </button>
  );
}
