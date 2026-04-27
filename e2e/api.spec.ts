import { test, expect } from "@playwright/test";

test.describe("public API surfaces", () => {
  test("/api/v1/docs returns the OpenAPI spec", async ({ request }) => {
    const res = await request.get("/api/v1/docs");
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.openapi).toMatch(/^3\./);
    expect(json.paths["/api/v1/market/quote"]).toBeDefined();
  });

  test("/api/v1/market/quote requires auth", async ({ request }) => {
    const res = await request.get("/api/v1/market/quote?symbols=AAPL");
    expect(res.status()).toBe(401);
  });

  test("legacy /api/market/quote is still served but deprecated", async ({ request }) => {
    const res = await request.get("/api/market/quote?symbols=AAPL");
    // 401 because no session, but we can still inspect the deprecation header
    expect(res.headers()["deprecation"]).toBe("true");
  });
});
