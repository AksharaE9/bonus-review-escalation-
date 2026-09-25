import { chromium, type Browser } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";
import { spawn, type ChildProcess } from "child_process";
import * as dotenv from "dotenv";

dotenv.config();

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;
const OVERLAYS_DIR = path.resolve(process.cwd(), "EVIDENCE", "overlays");

async function startServer(): Promise<ChildProcess> {
  console.log("🚀 Starting Next.js Production Server for Overlays...");
  const server = spawn("cmd.exe", ["/c", "npm", "run", "start"], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: String(PORT) },
    stdio: "pipe",
  });

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => resolve(server), 8000);
    server.stdout?.on("data", (data) => {
      const msg = data.toString();
      if (msg.includes("Ready") || msg.includes("started") || msg.includes("http://localhost")) {
        clearTimeout(timeout);
        resolve(server);
      }
    });
    server.on("error", reject);
  });
}

async function main() {
  if (!fs.existsSync(OVERLAYS_DIR)) {
    fs.mkdirSync(OVERLAYS_DIR, { recursive: true });
  }

  const server = await startServer();
  await new Promise((r) => setTimeout(r, 4000));

  const browser: Browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log("🔐 Authenticating as Admin for overlay audit...");
    await page.goto(`${BASE_URL}/sign-in`, { waitUntil: "networkidle" });
    await page.fill('input[name="email"]', "admin@pulse.internal");
    await page.fill('input[name="password"]', "AdminSecure#2026!");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard", { timeout: 10000 });

    // 1. Bonus Modal
    console.log("🪟 1. Opening Bonus Award Modal via ?action=new...");
    await page.goto(`${BASE_URL}/bonuses?action=new`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    // Desktop
    await page.setViewportSize({ width: 1280, height: 900 });
    const bonusModalPath = path.join(OVERLAYS_DIR, "bonus-modal-opaque-1280px.png");
    await page.screenshot({ path: bonusModalPath, fullPage: true });
    console.log(`   📸 Saved: ${bonusModalPath}`);

    // Mobile
    await page.setViewportSize({ width: 390, height: 844 });
    const bonusModalMobilePath = path.join(OVERLAYS_DIR, "bonus-modal-mobile-390px.png");
    await page.screenshot({ path: bonusModalMobilePath, fullPage: true });
    console.log(`   📸 Saved: ${bonusModalMobilePath}`);

    // Close Bonus Modal
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);

    // 2. Command Palette (⌘K)
    console.log("🪟 2. Opening Command Palette Modal...");
    await page.setViewportSize({ width: 1280, height: 900 });
    const searchBtn = page.locator('button:has-text("Search..."), button:has-text("⌘K")').first();
    if (await searchBtn.isVisible()) {
      await searchBtn.click();
      await page.waitForTimeout(800);
      const cmdkPath = path.join(OVERLAYS_DIR, "command-palette-modal-1280px.png");
      await page.screenshot({ path: cmdkPath, fullPage: true });
      console.log(`   📸 Saved: ${cmdkPath}`);
      await page.keyboard.press("Escape");
      await page.waitForTimeout(500);
    }

    console.log("\n✅ Overlays screenshot capture completed successfully!");
  } finally {
    await browser.close();
    server.kill("SIGTERM");
  }
}

main().catch((err) => {
  console.error("Overlays capture error:", err);
  process.exit(1);
});
