import type { Asset } from "@/types";

// ─── Public types ─────────────────────────────────────────────────────

export interface PortfolioPnL {
  totalCost: number;
  totalValue: number;
  totalGain: number;
  totalReturnPct: number;
  topWinners: AssetMove[];
  topLosers: AssetMove[];
  assetCount: number;
  hasCostBasis: boolean;
}

export interface AssetMove {
  id: string;
  name: string;
  symbol: string | null;
  category: string;
  cost: number;
  value: number;
  gain: number;
  returnPct: number;
}

export interface CurrencyExposure {
  currency: string;
  value: number;
  pct: number;
}

export type WarningKind = "currency" | "country" | "category" | "single_asset";

export interface ConcentrationWarning {
  kind: WarningKind;
  label: string;
  pct: number;
  threshold: number;
  message: string;
}

export interface PortfolioHealth {
  pnl: PortfolioPnL;
  currencyExposure: CurrencyExposure[];
  warnings: ConcentrationWarning[];
}

// ─── Thresholds ───────────────────────────────────────────────────────

const THRESHOLDS = {
  currency: 0.7,    // > 70% in non-THB currency
  country: 0.85,    // > 85% in single country (TH-heavy is normal, flag extreme)
  category: 0.6,    // > 60% in single asset class
  single: 0.4,      // any single asset > 40% of portfolio
} as const;

// ─── Core calculator (pure, easy to test) ─────────────────────────────

export function calculatePortfolioHealth(assets: Asset[]): PortfolioHealth {
  if (assets.length === 0) {
    return {
      pnl: emptyPnL(),
      currencyExposure: [],
      warnings: [],
    };
  }

  return {
    pnl: calculatePnL(assets),
    currencyExposure: calculateCurrencyExposure(assets),
    warnings: detectConcentrationWarnings(assets),
  };
}

// ─── P&L ──────────────────────────────────────────────────────────────

function emptyPnL(): PortfolioPnL {
  return {
    totalCost: 0,
    totalValue: 0,
    totalGain: 0,
    totalReturnPct: 0,
    topWinners: [],
    topLosers: [],
    assetCount: 0,
    hasCostBasis: false,
  };
}

function calculatePnL(assets: Asset[]): PortfolioPnL {
  const moves: AssetMove[] = assets.map((a) => {
    const cost = (a.cost_basis ?? 0) * (a.quantity ?? 0);
    const value = a.current_value ?? 0;
    const gain = value - cost;
    const returnPct = cost > 0 ? (gain / cost) * 100 : 0;
    return {
      id: a.id,
      name: a.name,
      symbol: a.symbol ?? null,
      category: a.category,
      cost,
      value,
      gain,
      returnPct,
    };
  });

  const totalCost = sum(moves.map((m) => m.cost));
  const totalValue = sum(moves.map((m) => m.value));
  const totalGain = totalValue - totalCost;
  const totalReturnPct = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

  // Only assets with a cost basis count for winners/losers — otherwise
  // a brand-new asset with no historical cost would dominate the list.
  const eligibleMoves = moves.filter((m) => m.cost > 0);
  const sortedByGain = [...eligibleMoves].sort((a, b) => b.gain - a.gain);

  return {
    totalCost,
    totalValue,
    totalGain,
    totalReturnPct,
    topWinners: sortedByGain.slice(0, 3).filter((m) => m.gain > 0),
    topLosers: sortedByGain.slice(-3).reverse().filter((m) => m.gain < 0),
    assetCount: assets.length,
    hasCostBasis: eligibleMoves.length > 0,
  };
}

// ─── Currency exposure ────────────────────────────────────────────────

function calculateCurrencyExposure(assets: Asset[]): CurrencyExposure[] {
  const total = sum(assets.map((a) => a.current_value ?? 0));
  if (total === 0) return [];

  const byCurrency = new Map<string, number>();
  for (const a of assets) {
    const cur = (a.currency ?? "THB").toUpperCase();
    byCurrency.set(cur, (byCurrency.get(cur) ?? 0) + (a.current_value ?? 0));
  }

  return Array.from(byCurrency.entries())
    .map(([currency, value]) => ({
      currency,
      value,
      pct: (value / total) * 100,
    }))
    .sort((a, b) => b.value - a.value);
}

// ─── Concentration warnings ───────────────────────────────────────────

function detectConcentrationWarnings(assets: Asset[]): ConcentrationWarning[] {
  const warnings: ConcentrationWarning[] = [];
  const total = sum(assets.map((a) => a.current_value ?? 0));
  if (total === 0) return warnings;

  // Currency: warn if non-THB > 70% (income usually in THB → big FX risk)
  const byCurrency = aggregateBy(assets, (a) => (a.currency ?? "THB").toUpperCase());
  const nonThbValue = sum(
    Array.from(byCurrency.entries())
      .filter(([cur]) => cur !== "THB")
      .map(([, v]) => v)
  );
  const nonThbPct = nonThbValue / total;
  if (nonThbPct > THRESHOLDS.currency) {
    warnings.push({
      kind: "currency",
      label: "Non-THB",
      pct: nonThbPct * 100,
      threshold: THRESHOLDS.currency * 100,
      message: `${formatPct(nonThbPct)}% ของพอร์ตเป็นสกุลเงินต่างประเทศ — รายได้เป็น THB อาจมี FX risk สูง`,
    });
  }

  // Single category: warn if > 60% in one asset class
  const byCategory = aggregateBy(assets, (a) => a.category);
  const topCategory = topEntry(byCategory);
  if (topCategory && topCategory.pct > THRESHOLDS.category) {
    warnings.push({
      kind: "category",
      label: topCategory.key,
      pct: topCategory.pct * 100,
      threshold: THRESHOLDS.category * 100,
      message: `${formatPct(topCategory.pct)}% ของพอร์ตอยู่ในกลุ่ม "${topCategory.key}" — กระจายความเสี่ยงเพิ่มได้`,
    });
  }

  // Single asset: warn if any asset > 40% of portfolio
  const topAsset = assets
    .map((a) => ({ asset: a, pct: (a.current_value ?? 0) / total }))
    .sort((a, b) => b.pct - a.pct)[0];
  if (topAsset && topAsset.pct > THRESHOLDS.single) {
    warnings.push({
      kind: "single_asset",
      label: topAsset.asset.name,
      pct: topAsset.pct * 100,
      threshold: THRESHOLDS.single * 100,
      message: `"${topAsset.asset.name}" คิดเป็น ${formatPct(topAsset.pct)}% ของพอร์ต — ความเสี่ยงกระจุกตัวสูง`,
    });
  }

  // Country (only flag extremes — TH-heavy is normal for Thai users)
  const byCountry = aggregateBy(assets, (a) => a.country_code ?? "TH");
  const topCountry = topEntry(byCountry);
  if (topCountry && topCountry.pct > THRESHOLDS.country && topCountry.key !== "TH") {
    warnings.push({
      kind: "country",
      label: topCountry.key,
      pct: topCountry.pct * 100,
      threshold: THRESHOLDS.country * 100,
      message: `${formatPct(topCountry.pct)}% ของพอร์ตอยู่ในประเทศ ${topCountry.key} — diversify ภูมิศาสตร์เพิ่มได้`,
    });
  }

  return warnings;
}

// ─── Helpers ──────────────────────────────────────────────────────────

function sum(values: number[]): number {
  return values.reduce((acc, v) => acc + v, 0);
}

function aggregateBy(assets: Asset[], keyFn: (a: Asset) => string): Map<string, number> {
  const m = new Map<string, number>();
  for (const a of assets) {
    const k = keyFn(a);
    m.set(k, (m.get(k) ?? 0) + (a.current_value ?? 0));
  }
  return m;
}

function topEntry(m: Map<string, number>): { key: string; pct: number } | null {
  let total = 0;
  let topKey: string | null = null;
  let topVal = 0;
  for (const [k, v] of Array.from(m.entries())) {
    total += v;
    if (v > topVal) {
      topVal = v;
      topKey = k;
    }
  }
  if (!topKey || total === 0) return null;
  return { key: topKey, pct: topVal / total };
}

function formatPct(ratio: number): string {
  return (ratio * 100).toFixed(0);
}
