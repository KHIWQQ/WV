import {
  assetSchema,
  liabilitySchema,
  transactionSchema,
  assetServerSchema,
} from "./schemas";

describe("assetSchema (client)", () => {
  const valid = {
    category: "stocks",
    name: "Apple",
    quantity: 10,
    cost_basis: 100,
    current_price: 180,
    current_value: 1800,
  };

  it("accepts a minimal valid payload", () => {
    expect(assetSchema.parse(valid)).toMatchObject({ name: "Apple", currency: "THB", country_code: "TH" });
  });

  it("rejects empty name", () => {
    expect(() => assetSchema.parse({ ...valid, name: "" })).toThrow(/ชื่อทรัพย์สิน/);
  });

  it("rejects non-positive quantity", () => {
    expect(() => assetSchema.parse({ ...valid, quantity: 0 })).toThrow(/จำนวน/);
    expect(() => assetSchema.parse({ ...valid, quantity: -1 })).toThrow(/จำนวน/);
  });

  it("rejects bad country_code length", () => {
    expect(() => assetSchema.parse({ ...valid, country_code: "USA" })).toThrow();
  });
});

describe("assetServerSchema (coerces strings)", () => {
  it("coerces numeric strings to numbers", () => {
    const parsed = assetServerSchema.parse({
      category: "stocks",
      name: "Apple",
      quantity: "5",
      cost_basis: "100",
      current_price: "150",
      current_value: "750",
    });
    expect(parsed.quantity).toBe(5);
    expect(parsed.current_value).toBe(750);
  });
});

describe("liabilitySchema", () => {
  const valid = {
    name: "Mortgage",
    type: "mortgage",
    principal: 1_000_000,
    balance: 800_000,
    interest_rate: 3.5,
    monthly_payment: 8000,
    start_date: "2024-01-01",
  };

  it("accepts valid liability", () => {
    expect(liabilitySchema.parse(valid)).toMatchObject(valid);
  });

  it("rejects principal <= 0", () => {
    expect(() => liabilitySchema.parse({ ...valid, principal: 0 })).toThrow(/วงเงิน/);
  });
});

describe("transactionSchema", () => {
  it("accepts known types", () => {
    for (const type of ["income", "expense", "buy", "sell"] as const) {
      expect(
        transactionSchema.parse({ type, category: "salary", amount: 100, date: "2026-01-01" })
      ).toMatchObject({ type });
    }
  });

  it("rejects unknown type", () => {
    expect(() =>
      transactionSchema.parse({ type: "donation", category: "x", amount: 100, date: "2026-01-01" })
    ).toThrow();
  });

  it("rejects amount < 1", () => {
    expect(() =>
      transactionSchema.parse({ type: "income", category: "x", amount: 0, date: "2026-01-01" })
    ).toThrow(/จำนวน/);
  });
});
