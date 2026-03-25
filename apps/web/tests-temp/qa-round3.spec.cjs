/* eslint-disable @typescript-eslint/no-require-imports */
const { test, expect } = require("playwright/test");

test("round3: public home reflects active admin session", async ({ page }) => {
  await page.goto("/login");
  await page.locator('input[name="username"]').fill("admin");
  await page.locator('input[name="password"]').fill("admin");
  await page.getByRole("button", { name: /로그인/i }).click();
  await expect(page).toHaveURL(/\/admin$/);

  await page.goto("/");
  await expect(page.getByRole("link", { name: /대시보드/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /로그아웃/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /^로그인$/i })).toHaveCount(0);
});
