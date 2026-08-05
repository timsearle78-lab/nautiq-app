import { test, expect } from "@playwright/test";
import { signIn } from "./helpers/auth";

test.describe("Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("bottom nav links go to the correct pages", async ({ page }) => {
    await page.goto("/chat");

    await page.getByRole("link", { name: /trips/i }).click();
    await expect(page).toHaveURL(/\/trips/, { timeout: 10_000 });

    await page.getByRole("link", { name: /maintain/i }).click();
    await expect(page).toHaveURL(/\/maintenance/, { timeout: 10_000 });

    await page.getByRole("link", { name: /inventory/i }).click();
    await expect(page).toHaveURL(/\/inventory/, { timeout: 10_000 });

    await page.getByRole("link", { name: /home/i }).click();
    await expect(page).toHaveURL(/\/chat/, { timeout: 10_000 });
  });

  test("profile tab navigates to profile page", async ({ page }) => {
    await page.goto("/chat");
    await page.getByRole("link", { name: /profile/i }).click();
    await expect(page).toHaveURL(/\/profile|\/settings/, { timeout: 10_000 });
  });
});
