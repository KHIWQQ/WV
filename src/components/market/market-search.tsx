"use client";

import { useState, useEffect, useRef } from "react";
import { Search, TrendingUp, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useMarketSearch } from "@/hooks/useMarket";
import { useTranslation } from "@/lib/i18n";
import type { MarketSearchResult } from "@/types";

interface MarketSearchProps {
  onSelect: (result: MarketSearchResult) => void;
}

export function MarketSearch({ onSelect }: MarketSearchProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { data: results = [], isLoading } = useMarketSearch(debouncedQuery);

  function handleSelect(result: MarketSearchResult) {
    setQuery("");
    setDebouncedQuery("");
    setIsOpen(false);
    onSelect(result);
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t.market.searchPlaceholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => query.length > 0 && setIsOpen(true)}
          className="pl-9 pr-8"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setDebouncedQuery("");
              setIsOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && debouncedQuery.length >= 1 && (
        <div className="absolute top-full z-50 mt-1 w-full rounded-lg border bg-popover shadow-lg">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {t.common.searching}
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {t.market.noResults}
            </div>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1">
              {results.map((r) => (
                <li key={r.symbol}>
                  <button
                    onClick={() => handleSelect(r)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-muted/50"
                  >
                    <TrendingUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{r.symbol}</span>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {({ stock: t.market.stock, crypto: t.market.crypto, forex: "Forex", commodity: t.market.commodity, index: t.market.index, etf: "ETF", mutualfund: t.market.fund, unknown: t.market.other } as Record<string, string>)[r.assetType] || r.assetType}
                        </Badge>
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {r.shortName} · {r.exchange}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
