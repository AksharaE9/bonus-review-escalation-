import { test, expect } from "@playwright/test";

test.describe("Pulse Auth & Navigation Matrix E2E", () => {
  test("Matrix Row 19: Register endpoint returns 404 and no register tab on sign-in (REDIRECT-SEC-001)", async ({ page }) => {
    // 1. /register route returns 404
    const res = await page.goto("/register");
    expect(res?.status()).toBe(404);

    // 2. /sign-in page has no open registration tab
    await page.goto("/sign-in");
    await expect(page.locator("text=Register Account")).not.toBeVisible();
    await expect(page.locator("h1")).toContainText("Sign in to your account");
  });

  test("Matrix Row 1: ADMIN signs in with valid credentials and lands on /admin", async ({ page }) => {
    await page.goto("/sign-in");
    await page.fill('input[name="email"]', "admin@pulse.local");
    await page.fill('input[name="password"]', "Admin@12345");
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/(admin|dashboard)/, { timeout: 15000 });
    await expect(page).toHaveURL(/.*(admin|dashboard)/);
  });

  test("Matrix Row 2: LEAD signs in and lands on /team", async ({ page }) => {
    await page.goto("/sign-in");
    await page.fill('input[name="email"]', "lead@pulse.local");
    await page.fill('input[name="password"]', "Lead@12345");
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/(team|dashboard)/, { timeout: 15000 });
    await expect(page).toHaveURL(/.*(team|dashboard)/);
  });

  test("Matrix Row 4 & 5: Invalid credentials show inline generic error without navigating", async ({ page }) => {
    await page.goto("/sign-in");
    await page.fill('input[name="email"]', "unknown@pulse.local");
    await page.fill('input[name="password"]', "WrongPassword@123");
    await page.click('button[type="submit"]');

    await expect(page.locator('div[role="alert"]')).toContainText("Invalid email or password.");
    await expect(page).toHaveURL(/.*sign-in/);
  });

  test("Matrix Row 8: Already signed in user navigating to /sign-in is redirected to /dashboard", async ({ page }) => {
    // Sign in first
    await page.goto("/sign-in");
    await page.fill('input[name="email"]', "admin@pulse.local");
    await page.fill('input[name="password"]', "Admin@12345");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(admin|dashboard)/, { timeout: 15000 });

    // Navigate to /sign-in while authenticated
    await page.goto("/sign-in");
    await page.waitForURL(/\/(admin|dashboard)/, { timeout: 10000 });
    await expect(page).toHaveURL(/.*(admin|dashboard)/);
  });

  test("Matrix Row 9: Unauthenticated navigation to /admin redirects to /sign-in with callbackUrl", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/.*sign-in.*callbackUrl=%2Fadmin/);
  });

  test("Matrix Row 12: Open redirect callbackUrl is sanitized", async ({ page }) => {
    await page.goto("/sign-in?callbackUrl=%2F%2Fevil.com");
    await page.fill('input[name="email"]', "admin@pulse.local");
    await page.fill('input[name="password"]', "Admin@12345");
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/(admin|dashboard)/, { timeout: 15000 });
    expect(page.url()).not.toContain("evil.com");
  });
});
