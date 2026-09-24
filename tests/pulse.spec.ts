import { test, expect } from "@playwright/test";

test.describe("Pulse Core E2E Flows", () => {
  test("Flow 1: Landing Page and Navigation to Sign In", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("Bonuses, reviews and escalations");
    await expect(page.getByRole("heading", { name: "Bonus Tracking" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Performance Reviews" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Escalation Management" })).toBeVisible();

    await page.click("text=Sign in");
    await expect(page).toHaveURL(/.*sign-in/);
  });

  test("Flow 2: Login Page In-Place Registration Request Workflow", async ({ page }) => {
    await page.goto("/sign-in");
    
    // Switch to Register tab
    await page.click("button:has-text('Register Account')");
    await expect(page.locator("text=Request New Account")).toBeVisible();

    // Fill registration
    const uniqueEmail = `testuser_${Date.now()}@pulse.local`;
    await page.fill('input[placeholder="e.g. Alex Morgan"]', "E2E Test Candidate");
    await page.fill('input[placeholder="alex@company.com"]', uniqueEmail);
    await page.locator('input[type="password"]').first().fill("Password@12345");
    await page.locator('input[type="password"]').last().fill("Password@12345");
    await page.fill('input[placeholder="e.g. Frontend Dev"]', "Senior Engineer");

    // Submit registration
    await page.click("button:has-text('Submit Registration Request')");
    await expect(page.locator("text=Registration Request Submitted!")).toBeVisible({ timeout: 10000 });
  });

  test("Flow 3: Authentication and Admin Governance Dashboard", async ({ page }) => {
    await page.goto("/sign-in");
    await page.fill('input[type="email"]', "admin@pulse.local");
    await page.fill('input[type="password"]', "Admin@12345");
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/(dashboard|change-password)/, { timeout: 15000 });

    // Navigate to Users & Roles Governance
    await page.goto("/settings/users");
    await expect(page.locator("h1:has-text('User & Role Governance')")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("button:has-text('Active Directory')")).toBeVisible();
    await expect(page.locator("button:has-text('Pending Approvals')")).toBeVisible();
  });

  test("Flow 4: Team Lead Directory and Team View Access", async ({ page }) => {
    await page.goto("/sign-in");
    await page.fill('input[type="email"]', "lead@pulse.local");
    await page.fill('input[type="password"]', "Lead@12345");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(dashboard|change-password)/, { timeout: 15000 });

    await page.goto("/employees");
    await expect(page.getByRole("heading", { name: "My Team Directory" })).toBeVisible({ timeout: 10000 });
  });

  test("Flow 5: Audit Log Ledger Verification", async ({ page }) => {
    await page.goto("/sign-in");
    await page.fill('input[type="email"]', "admin@pulse.local");
    await page.fill('input[type="password"]', "Admin@12345");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(dashboard|change-password)/, { timeout: 15000 });

    await page.goto("/audit");
    await expect(page.getByRole("heading", { name: "Audit Log" })).toBeVisible({ timeout: 10000 });
  });
});
