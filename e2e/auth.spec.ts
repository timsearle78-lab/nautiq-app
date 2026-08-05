import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("login page loads and shows sign in form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("shows error on bad credentials", async ({ page }) => {
    await page.goto("/login");
    await page.locator("#email").fill("bad@example.com");
    await page.locator("#password").fill("wrongpassword");
    await page.getByRole("button", { name: /sign in/i }).click();
    // Should stay on login and show an error
    await expect(page).toHaveURL(/login/);
    await expect(page.locator("body")).toContainText(
      /invalid|incorrect|wrong|credentials|error/i,
      { timeout: 10_000 }
    );
  });

  test("unauthenticated user is redirected from protected routes", async ({
    page,
  }) => {
    await page.goto("/chat");
    await expect(page).toHaveURL(/login/, { timeout: 10_000 });
  });
});
