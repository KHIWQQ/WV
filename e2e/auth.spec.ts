import { test, expect } from "@playwright/test";

test.describe("auth gating", () => {
  test("anonymous user is redirected from /dashboard to /login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("/login renders the form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("input[type='email'], input[name='email']").first()).toBeVisible();
    await expect(page.locator("input[type='password'], input[name='password']").first()).toBeVisible();
  });

  test("/register renders the form", async ({ page }) => {
    await page.goto("/register");
    await expect(page.locator("input[type='email'], input[name='email']").first()).toBeVisible();
  });
});
