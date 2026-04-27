"use client";

import { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useMarketSearch } from "@/hooks/useMarket";
import { useTranslation } from "@/lib/i18n";

interface SymbolAutocompleteProps {
  value: string;
  onChange: (symbol: string) => void;
  onPriceFound?: (price: number) => void;
  placeholder?: string;
}

export function SymbolAutocomplete({
  value,
  onChange,
  onPriceFound,
  placeholder,
}: SymbolAutocompleteProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { data: results = [] } = useMarketSearch(debouncedQuery);

  async function handleSelect(symbol: string) {
    setQuery(symbol);
    onChange(symbol);
    setIsOpen(false);

    // Try to fetch the current price
    if (onPriceFound) {
      try {
        const res = await fetch(`/api/v1/market/quote?symbols=${encodeURIComponent(symbol)}`);
        const data = await res.json();
        if (data.quotes?.[0]?.price) {
          onPriceFound(data.quotes[0].price);
        }
      } catch {
        // ignore
      }
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => query.length > 0 && setIsOpen(true)}
          placeholder={placeholder ?? "e.g. PTT.BK, AAPL"}
          className="pl-9"
        />
      </div>

      {isOpen && debouncedQuery.length >= 1 && results.length > 0 && (
        <div className="absolute top-full z-50 mt-1 w-full rounded-lg border bg-popover shadow-lg">
          <ul className="max-h-48 overflow-y-auto py-1">
            {results.slice(0, 8).map((r) => (
              <li key={r.symbol}>
                <button
                  type="button"
                  onClick={() => handleSelect(r.symbol)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-muted/50"
                >
                  <span className="font-medium">{r.symbol}</span>
                  <Badge variant="secondary" className="text-[10px] px-1 py-0">
                    {({ stock: t.market.stock, crypto: t.market.crypto, etf: "ETF", mutualfund: t.market.fund } as Record<string, string>)[r.assetType] || r.assetType}
                  </Badge>
                  <span className="ml-auto truncate text-xs text-muted-foreground">
                    {r.exchange}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
