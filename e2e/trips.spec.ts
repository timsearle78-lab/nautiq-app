import { test, expect } from "@playwright/test";
import { signIn } from "./helpers/auth";

test.describe("Trips", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
    await page.goto("/trips");
  });

  test("trips page loads and shows log trip button", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /trip/i })).toBeVisible({
      timeout: 10_000,
    });
    await expect(
      page.getByRole("button", { name: /log trip/i })
    ).toBeVisible();
  });

  test("log trip sheet opens and closes", async ({ page }) => {
    await page.getByRole("button", { name: /log trip/i }).click();
    // Sheet should appear
    await expect(page.getByRole("heading", { name: /log trip/i })).toBeVisible(
      { timeout: 5_000 }
    );
    // Close it
    await page.keyboard.press("Escape");
    // or click the X button if Escape doesn't work
    const closeBtn = page.getByRole("button", { name: /close|cancel/i });
    if (await closeBtn.isVisible()) await closeBtn.click();
    await expect(
      page.getByRole("heading", { name: /log trip/i })
    ).not.toBeVisible({ timeout: 5_000 });
  });

  test("log trip form validates required fields", async ({ page }) => {
    await page.getByRole("button", { name: /log trip/i }).click();
    await expect(page.getByRole("heading", { name: /log trip/i })).toBeVisible(
      { timeout: 5_000 }
    );
    // Try to submit without filling anything
    await page.getByRole("button", { name: /save trip/i }).click();
    // Should still be on the form (HTML5 validation or error message)
    await expect(page.getByRole("heading", { name: /log trip/i })).toBeVisible(
      { timeout: 3_000 }
    );
  });
});
