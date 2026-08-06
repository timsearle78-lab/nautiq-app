import { test, expect } from "@playwright/test";
import { signIn } from "./helpers/auth";

test.describe("Inventory", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
    await page.goto("/inventory");
  });

  test("inventory page loads with stat tiles", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /inventory/i })).toBeVisible(
      { timeout: 10_000 }
    );
    // Stat tiles should be present
    await expect(page.getByText(/low stock/i).first()).toBeVisible();
    await expect(page.getByText(/stocked/i).first()).toBeVisible();
  });

  test("clicking a stat tile activates a filter", async ({ page }) => {
    const lowStockTile = page.getByText(/low stock/i).first();
    await lowStockTile.click();
    // URL should gain a status param
    await expect(page).toHaveURL(/status=low_stock/, { timeout: 5_000 });
    // Clicking again clears the filter
    await lowStockTile.click();
    await expect(page).not.toHaveURL(/status=low_stock/, { timeout: 5_000 });
  });

  test("add item sheet opens", async ({ page }) => {
    await page.getByRole("button", { name: /add item/i }).click();
    await expect(
      page.getByRole("heading", { name: /add.*item|new.*item/i })
    ).toBeVisible({ timeout: 5_000 });
  });

  test("add item form validates name is required", async ({ page }) => {
    await page.getByRole("button", { name: /add item/i }).click();
    await expect(
      page.getByRole("heading", { name: /add.*item|new.*item/i })
    ).toBeVisible({ timeout: 5_000 });
    // Try to submit empty form
    await page.getByRole("button", { name: /save|add/i }).last().click();
    // Form should remain open
    await expect(
      page.getByRole("heading", { name: /add.*item|new.*item/i })
    ).toBeVisible({ timeout: 3_000 });
  });
});
