import { calculatePortfolioHealth } from "./health";
import type { Asset } from "@/types";

const baseAsset: Omit<Asset, "id" | "name" | "category" | "currency" | "country_code"> = {
  user_id: "u1",
  symbol: null,
  quantity: 1,
  cost_basis: 100,
  current_price: 100,
  current_value: 100,
  is_auto_update: false,
  notes: null,
  created_at: "2026-01-01",
  updated_at: "2026-01-01",
} as unknown as Asset;

function asset(
  partial: Partial<Asset> & { id: string; name: string; category: string }
): Asset {
  return {
    ...baseAsset,
    currency: "THB",
    country_code: "TH",
    ...partial,
  } as unknown as Asset;
}

// Default rates: USD=35, JPY=0.23, EUR=38; THB always 1.
const DEFAULT_FX = new Map<string, number>([
  ["THB", 1],
  ["USD", 35],
  ["JPY", 0.23],
  ["EUR", 38],
]);

// ─── empty input ──────────────────────────────────────────────────────

describe("calculatePortfolioHealth — empty", () => {
  const result = calculatePortfolioHealth([]);

  it("returns zeroed P&L", () => {
    expect(result.pnl.assetCount).toBe(0);
    expect(result.pnl.totalCost).toBe(0);
    expect(result.pnl.totalValue).toBe(0);
    expect(result.pnl.totalGain).toBe(0);
    expect(result.pnl.totalReturnPct).toBe(0);
    expect(result.pnl.hasCostBasis).toBe(false);
  });

  it("returns no exposure or warnings", () => {
    expect(result.currencyExposure).toEqual([]);
    expect(result.warnings).toEqual([]);
  });
});

// ─── P&L (single-currency THB) ────────────────────────────────────────

describe("P&L — THB-only assets (cost_basis is total, not per-unit)", () => {
  it("computes gain when current_value > cost_basis", () => {
    const result = calculatePortfolioHealth([
      asset({ id: "1", name: "A", category: "stock_us", quantity: 10, cost_basis: 1000, current_value: 1500 }),
    ]);
    expect(result.pnl.totalCost).toBe(1000);
    expect(result.pnl.totalValue).toBe(1500);
    expect(result.pnl.totalGain).toBe(500);
    expect(result.pnl.totalReturnPct).toBe(50);
  });

  it("computes loss when current_value < cost_basis", () => {
    const result = calculatePortfolioHealth([
      asset({ id: "1", name: "A", category: "stock_us", quantity: 5, cost_basis: 1000, current_value: 800 }),
    ]);
    expect(result.pnl.totalGain).toBe(-200);
    expect(result.pnl.totalReturnPct).toBe(-20);
  });

  it("ignores quantity entirely (it's already baked into cost_basis)", () => {
    const a = calculatePortfolioHealth([
      asset({ id: "1", name: "A", category: "stock_us", quantity: 1, cost_basis: 500, current_value: 600 }),
    ]);
    const b = calculatePortfolioHealth([
      asset({ id: "1", name: "A", category: "stock_us", quantity: 100, cost_basis: 500, current_value: 600 }),
    ]);
    expect(a.pnl.totalCost).toBe(b.pnl.totalCost);
    expect(a.pnl.totalGain).toBe(b.pnl.totalGain);
  });

  it("treats cost_basis = 0 as no-cost asset (excluded from winners/losers)", () => {
    const result = calculatePortfolioHealth([
      asset({ id: "1", name: "Winner", category: "stock_us", cost_basis: 100, current_value: 200 }),
      asset({ id: "2", name: "NoCost", category: "crypto", cost_basis: 0, current_value: 1000 }),
    ]);
    expect(result.pnl.topWinners.map((m) => m.id)).toEqual(["1"]);
    expect(result.pnl.hasCostBasis).toBe(true);
  });
});

// ─── P&L — multi-currency ─────────────────────────────────────────────

describe("P&L — multi-currency aggregation", () => {
  it("converts each asset's totals to THB before summing", () => {
    const result = calculatePortfolioHealth(
      [
        asset({ id: "1", name: "AAPL", category: "stock_us", currency: "USD", cost_basis: 1500, current_value: 1800 }),
        asset({ id: "2", name: "PTT",  category: "stock_th", currency: "THB", cost_basis: 50000, current_value: 60000 }),
      ],
      DEFAULT_FX
    );
    // USD: cost 1500×35=52500, value 1800×35=63000
    // THB: cost 50000, value 60000
    expect(result.pnl.totalCost).toBeCloseTo(102500);
    expect(result.pnl.totalValue).toBeCloseTo(123000);
    expect(result.pnl.totalGain).toBeCloseTo(20500);
  });

  it("per-asset returnPct stays in native currency (FX doesn't distort it)", () => {
    const result = calculatePortfolioHealth(
      [asset({ id: "1", name: "AAPL", category: "stock_us", currency: "USD", cost_basis: 1500, current_value: 1800 })],
      DEFAULT_FX
    );
    expect(result.pnl.topWinners[0]?.returnPct).toBeCloseTo(20);
  });

  it("uses 1:1 fallback when FX rate is missing for a currency", () => {
    const result = calculatePortfolioHealth(
      [asset({ id: "1", name: "X", category: "stock_us", currency: "XYZ", cost_basis: 100, current_value: 110 })],
      new Map([["THB", 1]])
    );
    expect(result.pnl.totalCost).toBe(100);
    expect(result.pnl.totalValue).toBe(110);
  });

  it("AssetMove carries both native and home values", () => {
    const result = calculatePortfolioHealth(
      [asset({ id: "1", name: "AAPL", category: "stock_us", currency: "USD", cost_basis: 1500, current_value: 1800 })],
      DEFAULT_FX
    );
    const m = result.pnl.topWinners[0]!;
    expect(m.currency).toBe("USD");
    expect(m.costNative).toBe(1500);
    expect(m.valueNative).toBe(1800);
    expect(m.costHome).toBeCloseTo(52500);
    expect(m.valueHome).toBeCloseTo(63000);
    expect(m.gainHome).toBeCloseTo(10500);
  });
});

// ─── Currency exposure ────────────────────────────────────────────────

describe("currency exposure — sums in home currency", () => {
  it("aggregates and percentages add to 100", () => {
    const result = calculatePortfolioHealth(
      [
        asset({ id: "1", name: "AAPL", category: "stock_us", currency: "USD", current_value: 100 }),  // 3,500 THB
        asset({ id: "2", name: "PTT",  category: "stock_th", currency: "THB", current_value: 6500 }), // 6,500 THB
      ],
      DEFAULT_FX
    );
    expect(result.currencyExposure).toHaveLength(2);
    const thb = result.currencyExposure.find((e) => e.currency === "THB")!;
    const usd = result.currencyExposure.find((e) => e.currency === "USD")!;
    expect(thb.pct).toBeCloseTo(65);
    expect(usd.pct).toBeCloseTo(35);
    expect(thb.valueHome).toBeCloseTo(6500);
    expect(usd.valueHome).toBeCloseTo(3500);
  });

  it("normalizes currency to uppercase + treats missing as THB", () => {
    const result = calculatePortfolioHealth(
      [
        asset({ id: "1", name: "A", category: "cash", currency: "thb", current_value: 100 }),
        asset({ id: "2", name: "B", category: "cash", currency: undefined as unknown as string, current_value: 100 }),
      ],
      DEFAULT_FX
    );
    expect(result.currencyExposure).toHaveLength(1);
    expect(result.currencyExposure[0].currency).toBe("THB");
  });
});

// ─── Warnings ────────────────────────────────────────────────────────

describe("concentration warnings — operate on home-currency weights", () => {
  it("warns when non-THB > 70% of THB-equivalent total", () => {
    const result = calculatePortfolioHealth(
      [
        asset({ id: "1", name: "AAPL", category: "stock_us", currency: "USD", current_value: 1000 }), // 35,000 THB
        asset({ id: "2", name: "Cash", category: "cash",     currency: "THB", current_value: 5000 }),
      ],
      DEFAULT_FX
    );
    expect(result.warnings.some((w) => w.kind === "currency")).toBe(true);
  });

  it("does NOT warn when THB-heavy", () => {
    const result = calculatePortfolioHealth(
      [
        asset({ id: "1", name: "PTT", category: "stock_th", currency: "THB", current_value: 900 }),
        asset({ id: "2", name: "AAPL", category: "stock_us", currency: "USD", current_value: 5 }), // ~175 THB
      ],
      DEFAULT_FX
    );
    expect(result.warnings.some((w) => w.kind === "currency")).toBe(false);
  });

  it("warns when one category > 60%", () => {
    const result = calculatePortfolioHealth([
      asset({ id: "1", name: "Apple", category: "stock_us", current_value: 700 }),
      asset({ id: "2", name: "Cash",  category: "cash",     current_value: 300 }),
    ]);
    expect(result.warnings.some((w) => w.kind === "category")).toBe(true);
  });

  it("warns when single asset > 40%", () => {
    const result = calculatePortfolioHealth([
      asset({ id: "1", name: "Whale", category: "stock_us", current_value: 600 }),
      asset({ id: "2", name: "B",     category: "stock_us", current_value: 200 }),
      asset({ id: "3", name: "C",     category: "stock_us", current_value: 200 }),
    ]);
    expect(result.warnings.some((w) => w.kind === "single_asset" && w.label === "Whale")).toBe(true);
  });

  it("does NOT warn for TH country concentration", () => {
    const result = calculatePortfolioHealth([
      asset({ id: "1", name: "A", category: "stock_th", country_code: "TH", current_value: 1000 }),
    ]);
    expect(result.warnings.some((w) => w.kind === "country")).toBe(false);
  });

  it("warns for non-TH country > 85%", () => {
    const result = calculatePortfolioHealth([
      asset({ id: "1", name: "A", category: "stock_us", country_code: "US", current_value: 900 }),
      asset({ id: "2", name: "B", category: "stock_us", country_code: "JP", current_value: 100 }),
    ]);
    expect(result.warnings.some((w) => w.kind === "country" && w.label === "US")).toBe(true);
  });
});
