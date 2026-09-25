import { test, expect } from "@playwright/test";

test.describe("M4 Empty-State & First-Run Journey Pass", () => {
  const BANNED_PATTERNS = [/\bNaN\b/, /\bundefined\b/, /\bnull\b/, /\bInfinity\b/];

  const routesByRole = {
    admin: ["/admin", "/employees", "/bonuses", "/reviews", "/escalations", "/audit", "/settings", "/settings/users"],
    lead: ["/team", "/bonuses", "/reviews", "/escalations"],
    user: ["/me", "/escalations", "/escalations/new"],
  };

  test("ADMIN: All primary routes render clean empty states with zero NaN/undefined", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    await page.goto("/sign-in");
    await page.fill('input[name="email"]', "admin@pulse.internal");
    await page.fill('input[name="password"]', "AdminSecure#2026!");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(admin|dashboard)/, { timeout: 15000 });

    for (const route of routesByRole.admin) {
      await page.goto(route);
      await page.waitForLoadState("domcontentloaded");
      const bodyText = (await page.locator("body").textContent()) || "";

      for (const pattern of BANNED_PATTERNS) {
        expect(bodyText).not.toMatch(pattern);
      }
      expect(bodyText).not.toContain("Page 1 of 0");
    }

    expect(consoleErrors).toEqual([]);
  });

  test("LEAD: All primary routes render clean empty states with zero NaN/undefined", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    await page.goto("/sign-in");
    await page.fill('input[name="email"]', "lead@pulse.internal");
    await page.fill('input[name="password"]', "LeadSecure#2026!");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(team|dashboard)/, { timeout: 15000 });

    for (const route of routesByRole.lead) {
      await page.goto(route);
      await page.waitForLoadState("domcontentloaded");
      const bodyText = (await page.locator("body").textContent()) || "";

      for (const pattern of BANNED_PATTERNS) {
        expect(bodyText).not.toMatch(pattern);
      }
      expect(bodyText).not.toContain("Page 1 of 0");
    }

    expect(consoleErrors).toEqual([]);
  });

  test("USER: All primary routes render clean empty states with zero NaN/undefined", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    await page.goto("/sign-in");
    await page.fill('input[name="email"]', "user@pulse.internal");
    await page.fill('input[name="password"]', "UserSecure#2026!");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(me|dashboard)/, { timeout: 15000 });

    for (const route of routesByRole.user) {
      await page.goto(route);
      await page.waitForLoadState("domcontentloaded");
      const bodyText = (await page.locator("body").textContent()) || "";

      for (const pattern of BANNED_PATTERNS) {
        expect(bodyText).not.toMatch(pattern);
      }
      expect(bodyText).not.toContain("Page 1 of 0");
    }

    expect(consoleErrors).toEqual([]);
  });
});
