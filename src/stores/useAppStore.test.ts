import { act } from "react";
import { useAppStore, selectTotalAssets, selectTotalLiabilities, selectNetWorth } from "./useAppStore";
import type { Asset } from "@/types/asset";
import type { Liability } from "@/types/liability";

const asset = (id: string, value: number): Asset =>
  ({
    id,
    user_id: "u1",
    category: "stock_us",
    name: `A${id}`,
    symbol: null,
    quantity: 1,
    cost_basis: value,
    current_price: value,
    current_value: value,
    currency: "THB",
    country_code: "TH",
    is_auto_update: false,
    notes: null,
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
  }) as unknown as Asset;

const liability = (id: string, balance: number): Liability =>
  ({
    id,
    user_id: "u1",
    name: `L${id}`,
    type: "personal_loan",
    principal: balance,
    balance,
    interest_rate: 5,
    monthly_payment: 100,
    start_date: "2026-01-01",
    end_date: null,
    notes: null,
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
  }) as unknown as Liability;

beforeEach(() => {
  act(() => {
    useAppStore.setState({ assets: [], liabilities: [], transactions: [] });
  });
});

describe("useAppStore selectors", () => {
  it("selectTotalAssets sums current_value", () => {
    act(() => useAppStore.setState({ assets: [asset("1", 100), asset("2", 250)] }));
    expect(selectTotalAssets(useAppStore.getState())).toBe(350);
  });

  it("selectTotalLiabilities sums balance", () => {
    act(() => useAppStore.setState({ liabilities: [liability("1", 500), liability("2", 200)] }));
    expect(selectTotalLiabilities(useAppStore.getState())).toBe(700);
  });

  it("selectNetWorth = assets - liabilities", () => {
    act(() =>
      useAppStore.setState({
        assets: [asset("a", 1000)],
        liabilities: [liability("l", 300)],
      })
    );
    expect(selectNetWorth(useAppStore.getState())).toBe(700);
  });

  it("returns same number for the same array reference (cache)", () => {
    const arr = [asset("1", 100)];
    act(() => useAppStore.setState({ assets: arr }));
    const a = selectTotalAssets(useAppStore.getState());
    const b = selectTotalAssets(useAppStore.getState());
    expect(a).toBe(b);
    expect(a).toBe(100);
  });
});

describe("useAppStore mutations", () => {
  it("addAsset appends", () => {
    act(() => useAppStore.getState().addAsset(asset("1", 100)));
    expect(useAppStore.getState().assets).toHaveLength(1);
  });

  it("removeAsset removes by id", () => {
    act(() => {
      useAppStore.setState({ assets: [asset("1", 100), asset("2", 200)] });
      useAppStore.getState().removeAsset("1");
    });
    expect(useAppStore.getState().assets.map((a) => a.id)).toEqual(["2"]);
  });

  it("updateAsset patches matching id", () => {
    act(() => {
      useAppStore.setState({ assets: [asset("1", 100)] });
      useAppStore.getState().updateAsset("1", { current_value: 999 });
    });
    expect(useAppStore.getState().assets[0].current_value).toBe(999);
  });
});
