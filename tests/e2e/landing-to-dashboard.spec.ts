import { expect, test } from "@playwright/test";

test("ランディングからダッシュボードへ遷移できる", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: /Ask more from/i })).toBeVisible();

  await page.getByRole("link", { name: "Start for free" }).first().click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(
    page.getByRole("heading", { name: "ダッシュボード" }),
  ).toBeVisible();
});
