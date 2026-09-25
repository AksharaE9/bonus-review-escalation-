import { test as setup, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const authDir = path.join(process.cwd(), "playwright", ".auth");

if (!fs.existsSync(authDir)) {
  fs.mkdirSync(authDir, { recursive: true });
}

setup("authenticate as ADMIN", async ({ page }) => {
  await page.goto("/sign-in");
  await page.fill('input[name="email"]', process.env.ADMIN_EMAIL || "admin@pulse.local");
  await page.fill('input[name="password"]', process.env.ADMIN_PASSWORD || "Admin@12345");
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(admin|dashboard)/, { timeout: 15000 });
  await page.context().storageState({ path: path.join(authDir, "admin.json") });
});

setup("authenticate as LEAD", async ({ page }) => {
  await page.goto("/sign-in");
  await page.fill('input[name="email"]', process.env.LEAD_EMAIL || "lead@pulse.local");
  await page.fill('input[name="password"]', process.env.LEAD_PASSWORD || "Lead@12345");
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(team|dashboard)/, { timeout: 15000 });
  await page.context().storageState({ path: path.join(authDir, "lead.json") });
});

setup("authenticate as USER", async ({ page }) => {
  await page.goto("/sign-in");
  await page.fill('input[name="email"]', process.env.USER_EMAIL || "user@pulse.local");
  await page.fill('input[name="password"]', process.env.USER_PASSWORD || "User@12345");
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(me|dashboard)/, { timeout: 15000 });
  await page.context().storageState({ path: path.join(authDir, "user.json") });
});
