"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MarketSearch } from "@/components/market/market-search";
import { MarketIndicesBar } from "@/components/market/market-indices-bar";
import { PriceTicker } from "@/components/market/price-ticker";
import { WatchlistPanel } from "@/components/market/watchlist-panel";
import { useMarketQuote } from "@/hooks/useMarket";
import { ErrorBoundary } from "@/components/error-boundary";
import { useTranslation } from "@/lib/i18n";
import type { MarketSearchResult } from "@/types";

const POPULAR_TH = ["PTT.BK", "AOT.BK", "ADVANC.BK", "CPALL.BK", "SCB.BK", "GULF.BK"];
const POPULAR_US = ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "TSLA"];
const POPULAR_CRYPTO = ["BTC-USD", "ETH-USD", "SOL-USD", "BNB-USD"];

export default function MarketPage() {
  const { t } = useTranslation();
  const router = useRouter();

  const { data: thQuotes = [], isLoading: thLoading } = useMarketQuote(POPULAR_TH);
  const { data: usQuotes = [], isLoading: usLoading } = useMarketQuote(POPULAR_US);
  const { data: cryptoQuotes = [], isLoading: cryptoLoading } = useMarketQuote(POPULAR_CRYPTO);

  function handleSelect(result: MarketSearchResult) {
    router.push(`/dashboard/market/${encodeURIComponent(result.symbol)}`);
  }

  function handleQuoteClick(symbol: string) {
    router.push(`/dashboard/market/${encodeURIComponent(symbol)}`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t.market.title}</h1>
        <p className="text-sm text-muted-foreground">
          {t.market.subtitle}
        </p>
      </div>

      <MarketSearch onSelect={handleSelect} />

      <ErrorBoundary>
        <MarketIndicesBar />
      </ErrorBoundary>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Watchlist sidebar */}
        <div className="lg:col-span-1 order-last lg:order-first">
          <WatchlistPanel onSymbolClick={handleQuoteClick} />
        </div>

        {/* Popular stocks grid */}
        <div className="lg:col-span-3 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Card variant="glass">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t.market.thaiStocks}</CardTitle>
            </CardHeader>
            <CardContent>
              {thLoading ? (
                <LoadingSkeleton count={6} />
              ) : (
                <div className="space-y-2">
                  {thQuotes.map((q) => (
                    <PriceTicker
                      key={q.symbol}
                      quote={q}
                      onClick={() => handleQuoteClick(q.symbol)}
                      compact
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t.market.usStocks}</CardTitle>
            </CardHeader>
            <CardContent>
              {usLoading ? (
                <LoadingSkeleton count={6} />
              ) : (
                <div className="space-y-2">
                  {usQuotes.map((q) => (
                    <PriceTicker
                      key={q.symbol}
                      quote={q}
                      onClick={() => handleQuoteClick(q.symbol)}
                      compact
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t.market.cryptocurrency}</CardTitle>
            </CardHeader>
            <CardContent>
              {cryptoLoading ? (
                <LoadingSkeleton count={4} />
              ) : (
                <div className="space-y-2">
                  {cryptoQuotes.map((q) => (
                    <PriceTicker
                      key={q.symbol}
                      quote={q}
                      onClick={() => handleQuoteClick(q.symbol)}
                      compact
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton({ count }: { count: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
      ))}
    </div>
  );
}
