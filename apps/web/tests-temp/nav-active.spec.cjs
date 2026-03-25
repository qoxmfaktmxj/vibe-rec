/* eslint-disable @typescript-eslint/no-require-imports */
const { test, expect } = require("playwright/test");

test("admin applicants only highlights applicants nav", async ({ page }) => {
  await page.goto("/login");
  await page.locator('input[name="username"]').fill("admin");
  await page.locator('input[name="password"]').fill("admin");
  await page.getByRole("button", { name: /로그인/i }).click();
  await expect(page).toHaveURL(/\/admin$/);

  await page.goto("/admin/applicants");

  await expect(
    page.locator('a[aria-current="page"][title="지원자"]'),
  ).toBeVisible();
  await expect(
    page.locator('a[aria-current="page"][title="대시보드"]'),
  ).toHaveCount(0);
});
