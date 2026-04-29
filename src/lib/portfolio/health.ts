import type { Asset } from "@/types";
import { convertToHome, HOME_CURRENCY } from "@/lib/currency/aggregate";

// ─── Public types ─────────────────────────────────────────────────────

export interface PortfolioPnL {
  totalCost: number;        // home currency (THB)
  totalValue: number;       // home currency
  totalGain: number;        // home currency
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
  currency: string;         // native currency of the asset
  costNative: number;       // in asset's currency
  valueNative: number;
  costHome: number;         // converted to home currency
  valueHome: number;
  gainHome: number;
  returnPct: number;        // % return in native (no FX noise)
}

export interface CurrencyExposure {
  currency: string;
  valueHome: number;        // value in THB after FX
  pct: number;              // share of THB-equivalent total
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

/**
 * `fxRates` is a Map of currency → rate-to-home (1 unit of currency = X home).
 * Caller produces it via `prefetchFxRates(assets)`. An empty map means "treat
 * every currency as home" (1:1) — useful for tests where FX is irrelevant.
 */
export function calculatePortfolioHealth(
  assets: Asset[],
  fxRates: Map<string, number> = new Map([[HOME_CURRENCY, 1]])
): PortfolioHealth {
  if (assets.length === 0) {
    return {
      pnl: emptyPnL(),
      currencyExposure: [],
      warnings: [],
    };
  }

  return {
    pnl: calculatePnL(assets, fxRates),
    currencyExposure: calculateCurrencyExposure(assets, fxRates),
    warnings: detectConcentrationWarnings(assets, fxRates),
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

function calculatePnL(assets: Asset[], fxRates: Map<string, number>): PortfolioPnL {
  // `cost_basis` and `current_value` are BOTH stored as totals in the
  // asset's native currency (asset.currency). Convert to home currency
  // for portfolio-wide totals. Per-asset return % is computed in native
  // currency to avoid FX noise distorting the underlying performance.
  const moves: AssetMove[] = assets.map((a) => {
    const costNative = a.cost_basis ?? 0;
    const valueNative = a.current_value ?? 0;
    const currency = (a.currency ?? HOME_CURRENCY).toUpperCase();
    const costHome = convertToHome(costNative, currency, fxRates);
    const valueHome = convertToHome(valueNative, currency, fxRates);
    const gainHome = valueHome - costHome;
    const returnPct = costNative > 0 ? ((valueNative - costNative) / costNative) * 100 : 0;
    return {
      id: a.id,
      name: a.name,
      symbol: a.symbol ?? null,
      category: a.category,
      currency,
      costNative,
      valueNative,
      costHome,
      valueHome,
      gainHome,
      returnPct,
    };
  });

  const totalCost = sum(moves.map((m) => m.costHome));
  const totalValue = sum(moves.map((m) => m.valueHome));
  const totalGain = totalValue - totalCost;
  const totalReturnPct = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

  const eligibleMoves = moves.filter((m) => m.costNative > 0);
  const sortedByGain = [...eligibleMoves].sort((a, b) => b.gainHome - a.gainHome);

  return {
    totalCost,
    totalValue,
    totalGain,
    totalReturnPct,
    topWinners: sortedByGain.slice(0, 3).filter((m) => m.gainHome > 0),
    topLosers: sortedByGain.slice(-3).reverse().filter((m) => m.gainHome < 0),
    assetCount: assets.length,
    hasCostBasis: eligibleMoves.length > 0,
  };
}

// ─── Currency exposure ────────────────────────────────────────────────

function calculateCurrencyExposure(
  assets: Asset[],
  fxRates: Map<string, number>
): CurrencyExposure[] {
  // Sum in home currency so percentages are comparable across currencies
  // (otherwise USD$1,000 would look the same size as ฿1,000).
  const byCurrency = new Map<string, number>();
  for (const a of assets) {
    const cur = (a.currency ?? HOME_CURRENCY).toUpperCase();
    const valueHome = convertToHome(a.current_value ?? 0, cur, fxRates);
    byCurrency.set(cur, (byCurrency.get(cur) ?? 0) + valueHome);
  }

  const totalHome = sum(Array.from(byCurrency.values()));
  if (totalHome === 0) return [];

  return Array.from(byCurrency.entries())
    .map(([currency, valueHome]) => ({
      currency,
      valueHome,
      pct: (valueHome / totalHome) * 100,
    }))
    .sort((a, b) => b.valueHome - a.valueHome);
}

// ─── Concentration warnings ───────────────────────────────────────────

function detectConcentrationWarnings(
  assets: Asset[],
  fxRates: Map<string, number>
): ConcentrationWarning[] {
  const warnings: ConcentrationWarning[] = [];

  // All concentration math runs in home currency so cross-currency
  // weights are comparable.
  const valuesHome = assets.map((a) => ({
    asset: a,
    valueHome: convertToHome(a.current_value ?? 0, a.currency ?? HOME_CURRENCY, fxRates),
  }));
  const total = sum(valuesHome.map((v) => v.valueHome));
  if (total === 0) return warnings;

  // Currency: warn if non-THB > 70% (income usually in THB → big FX risk)
  const byCurrency = aggregateValuesBy(valuesHome, (v) =>
    (v.asset.currency ?? HOME_CURRENCY).toUpperCase()
  );
  const nonThbValue = sum(
    Array.from(byCurrency.entries())
      .filter(([cur]) => cur !== HOME_CURRENCY)
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
  const byCategory = aggregateValuesBy(valuesHome, (v) => v.asset.category);
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
  const topAsset = valuesHome
    .map((v) => ({ asset: v.asset, pct: v.valueHome / total }))
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
  const byCountry = aggregateValuesBy(valuesHome, (v) => v.asset.country_code ?? "TH");
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

interface ValueHomeEntry {
  asset: Asset;
  valueHome: number;
}

function aggregateValuesBy(
  values: ValueHomeEntry[],
  keyFn: (v: ValueHomeEntry) => string
): Map<string, number> {
  const m = new Map<string, number>();
  for (const v of values) {
    const k = keyFn(v);
    m.set(k, (m.get(k) ?? 0) + v.valueHome);
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
