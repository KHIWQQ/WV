"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PriceChart } from "@/components/market/price-chart";
import { AddToWatchlistDialog } from "@/components/market/add-to-watchlist-dialog";
import { useMarketQuote } from "@/hooks/useMarket";
import { cn } from "@/lib/utils/cn";
import { useTranslation } from "@/lib/i18n";

export default function SymbolPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const rawSymbol = params.symbol;
  const symbol = decodeURIComponent(Array.isArray(rawSymbol) ? rawSymbol[0] : rawSymbol ?? "");
  const [watchlistOpen, setWatchlistOpen] = useState(false);

  const ASSET_TYPE_LABELS = useMemo<Record<string, string>>(() => ({
    stock: t.market.stock,
    crypto: t.market.crypto,
    forex: "Forex",
    commodity: t.market.commodity,
    index: t.market.index,
    etf: "ETF",
    mutualfund: t.market.fund,
    unknown: t.market.other,
  }), [t.market]);

  const { data: quotes = [], isLoading } = useMarketQuote([symbol]);
  const quote = quotes[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={() => router.push("/dashboard/market")}
        >
          <ArrowLeft className="h-4 w-4" />
          {t.common.back}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="text-muted-foreground">{t.common.loading}</div>
        </div>
      ) : !quote ? (
        <div className="flex h-64 items-center justify-center">
          <div className="text-muted-foreground">{t.market.noDataFor} {symbol}</div>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">{quote.symbol}</h1>
                <Badge variant="secondary">
                  {ASSET_TYPE_LABELS[quote.assetType] || quote.assetType}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setWatchlistOpen(true)}
                >
                  <Star className="h-4 w-4" />
                  {t.market.addToWatchlist}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                {quote.longName || quote.shortName} · {quote.exchange}
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold tabular-nums">
                {quote.price.toLocaleString("th-TH", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              <p className="text-sm text-muted-foreground">{quote.currency}</p>
              <p
                className={cn(
                  "text-sm font-semibold tabular-nums",
                  quote.change > 0 && "text-emerald-600",
                  quote.change < 0 && "text-red-600",
                  quote.change === 0 && "text-muted-foreground"
                )}
              >
                {quote.change > 0 ? "+" : ""}
                {quote.change.toFixed(2)} ({quote.change > 0 ? "+" : ""}
                {quote.changePercent.toFixed(2)}%)
              </p>
            </div>
          </div>

          <PriceChart symbol={symbol} name={quote.longName || quote.shortName} />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <InfoCard label={t.market.volume} value={quote.volume?.toLocaleString("th-TH") ?? "-"} />
            <InfoCard
              label={t.market.marketCap}
              value={
                quote.marketCap
                  ? `${(quote.marketCap / 1_000_000_000).toFixed(2)}B`
                  : "-"
              }
            />
            <InfoCard label={t.market.currency} value={quote.currency} />
            <InfoCard label={t.market.exchange} value={quote.exchange ?? "-"} />
          </div>

          <AddToWatchlistDialog
            open={watchlistOpen}
            onOpenChange={setWatchlistOpen}
            symbol={quote.symbol}
            displayName={quote.longName || quote.shortName}
            assetType={quote.assetType}
            exchange={quote.exchange}
          />
        </>
      )}
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}
