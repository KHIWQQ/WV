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

// ─── P&L ──────────────────────────────────────────────────────────────

describe("P&L calculation", () => {
  it("computes gain when current_value > cost", () => {
    const result = calculatePortfolioHealth([
      asset({ id: "1", name: "A", category: "stock_us", quantity: 10, cost_basis: 100, current_value: 1500 }),
    ]);
    expect(result.pnl.totalCost).toBe(1000); // 10 * 100
    expect(result.pnl.totalValue).toBe(1500);
    expect(result.pnl.totalGain).toBe(500);
    expect(result.pnl.totalReturnPct).toBe(50);
  });

  it("computes loss when current_value < cost", () => {
    const result = calculatePortfolioHealth([
      asset({ id: "1", name: "A", category: "stock_us", quantity: 5, cost_basis: 200, current_value: 800 }),
    ]);
    expect(result.pnl.totalGain).toBe(-200);
    expect(result.pnl.totalReturnPct).toBe(-20);
  });

  it("treats cost_basis = 0 as no-cost asset (excluded from winners/losers)", () => {
    const result = calculatePortfolioHealth([
      asset({ id: "1", name: "Winner", category: "stock_us", quantity: 1, cost_basis: 100, current_value: 200 }),
      asset({ id: "2", name: "NoCost", category: "crypto", quantity: 1, cost_basis: 0, current_value: 1000 }),
    ]);
    expect(result.pnl.topWinners.map((m) => m.id)).toEqual(["1"]);
    expect(result.pnl.hasCostBasis).toBe(true);
  });

  it("returns top 3 winners + losers, sorted by absolute gain", () => {
    const result = calculatePortfolioHealth([
      asset({ id: "w1", name: "W1", category: "stock_us", quantity: 1, cost_basis: 100, current_value: 500 }),
      asset({ id: "w2", name: "W2", category: "stock_us", quantity: 1, cost_basis: 100, current_value: 200 }),
      asset({ id: "w3", name: "W3", category: "stock_us", quantity: 1, cost_basis: 100, current_value: 150 }),
      asset({ id: "w4", name: "W4", category: "stock_us", quantity: 1, cost_basis: 100, current_value: 110 }),
      asset({ id: "l1", name: "L1", category: "stock_us", quantity: 1, cost_basis: 100, current_value: 50 }),
      asset({ id: "l2", name: "L2", category: "stock_us", quantity: 1, cost_basis: 100, current_value: 70 }),
    ]);
    expect(result.pnl.topWinners.map((m) => m.id)).toEqual(["w1", "w2", "w3"]);
    expect(result.pnl.topLosers.map((m) => m.id)).toEqual(["l1", "l2"]);
  });
});

// ─── Currency exposure ───────────────────────────────────────────────

describe("currency exposure", () => {
  it("aggregates by currency, percentages sum to 100", () => {
    const result = calculatePortfolioHealth([
      asset({ id: "1", name: "A", category: "stock_us", currency: "USD", current_value: 600 }),
      asset({ id: "2", name: "B", category: "stock_th", currency: "THB", current_value: 400 }),
    ]);
    const exposure = result.currencyExposure;
    expect(exposure).toHaveLength(2);
    expect(exposure[0].currency).toBe("USD");
    expect(exposure[0].pct).toBeCloseTo(60);
    expect(exposure[1].currency).toBe("THB");
    expect(exposure[1].pct).toBeCloseTo(40);
    expect(exposure[0].pct + exposure[1].pct).toBeCloseTo(100);
  });

  it("normalizes currency to uppercase + treats missing as THB", () => {
    const result = calculatePortfolioHealth([
      asset({ id: "1", name: "A", category: "cash", currency: "thb", current_value: 100 }),
      asset({ id: "2", name: "B", category: "cash", currency: undefined as unknown as string, current_value: 100 }),
    ]);
    expect(result.currencyExposure).toHaveLength(1);
    expect(result.currencyExposure[0].currency).toBe("THB");
  });
});

// ─── Warnings ────────────────────────────────────────────────────────

describe("concentration warnings", () => {
  it("warns when non-THB currency > 70%", () => {
    const result = calculatePortfolioHealth([
      asset({ id: "1", name: "A", category: "stock_us", currency: "USD", current_value: 800 }),
      asset({ id: "2", name: "B", category: "cash", currency: "THB", current_value: 200 }),
    ]);
    expect(result.warnings.some((w) => w.kind === "currency")).toBe(true);
  });

  it("does NOT warn when THB-heavy", () => {
    const result = calculatePortfolioHealth([
      asset({ id: "1", name: "A", category: "stock_th", currency: "THB", current_value: 900 }),
      asset({ id: "2", name: "B", category: "stock_us", currency: "USD", current_value: 100 }),
    ]);
    expect(result.warnings.some((w) => w.kind === "currency")).toBe(false);
  });

  it("warns when one category > 60% of portfolio", () => {
    const result = calculatePortfolioHealth([
      asset({ id: "1", name: "Apple", category: "stock_us", current_value: 700 }),
      asset({ id: "2", name: "Cash", category: "cash", current_value: 300 }),
    ]);
    expect(result.warnings.some((w) => w.kind === "category")).toBe(true);
  });

  it("warns when single asset > 40% of portfolio", () => {
    const result = calculatePortfolioHealth([
      asset({ id: "1", name: "Whale", category: "stock_us", current_value: 600 }),
      asset({ id: "2", name: "B", category: "stock_us", current_value: 200 }),
      asset({ id: "3", name: "C", category: "stock_us", current_value: 200 }),
    ]);
    expect(result.warnings.some((w) => w.kind === "single_asset" && w.label === "Whale")).toBe(true);
  });

  it("does NOT warn for TH country concentration (normal for Thai users)", () => {
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
