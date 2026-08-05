import { test, expect } from "@playwright/test";
import { signIn } from "./helpers/auth";

test.describe("Maintenance", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
    await page.goto("/maintenance");
  });

  test("maintenance overview loads", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /maintenance|boat health/i })
    ).toBeVisible({ timeout: 10_000 });
  });

  test("log maintenance sheet opens from home screen", async ({ page }) => {
    await page.goto("/chat");
    // Open the actions menu
    await page.getByRole("button", { name: /menu|☰|actions/i }).first().click();
    await page.getByRole("button", { name: /log maintenance/i }).click();
    await expect(
      page.getByRole("heading", { name: /log maintenance/i })
    ).toBeVisible({ timeout: 5_000 });
  });

  test("log maintenance requires a component to be selected", async ({
    page,
  }) => {
    await page.goto("/chat");
    await page.getByRole("button", { name: /menu|☰|actions/i }).first().click();
    await page.getByRole("button", { name: /log maintenance/i }).click();
    await expect(
      page.getByRole("heading", { name: /log maintenance/i })
    ).toBeVisible({ timeout: 5_000 });
    // Submit button should be disabled with no component selected
    const submitBtn = page.getByRole("button", {
      name: /save maintenance record/i,
    });
    await expect(submitBtn).toBeDisabled();
  });
});
