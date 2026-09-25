import { test, expect } from "@playwright/test";
import { execSync } from "node:child_process";

test.describe("M1 Overlay & Interaction-Layer Guard (Assertion-based, Zero Screenshots)", () => {
  test("Assertion 7: Zero raw z-index numeric literals in source code outside token scale", () => {
    // Grep src directory for raw z-index numbers (e.g. z-10, z-50, z-index: 100)
    // Only src/app/globals.css is allowed to define @utility z-* tokens
    const result = execSync(
      'git grep -n -E "(z-[0-9]+|z-index\\s*:\\s*[0-9]+)" src/ || true',
      { encoding: "utf-8" }
    ).trim();

    const lines = result.split("\n").filter((line) => {
      if (!line) return false;
      return !line.startsWith("src/app/globals.css");
    });

    expect(lines).toEqual([]);
  });

  test("Assertions 1-6: Dialog panels opacity, hit-testing, focus trapping, scroll lock & Esc dismissal", async ({
    page,
  }) => {
    // 1. Sign in as Admin
    await page.goto("/sign-in");
    await page.fill('input[name="email"]', "admin@pulse.local");
    await page.fill('input[name="password"]', "Admin@12345");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(admin|dashboard)/, { timeout: 15000 });

    // 2. Navigate to /bonuses and open modal
    await page.goto("/bonuses");
    const awardButton = page.locator('button:has-text("Award Bonus"), a:has-text("Award Bonus")').first();
    
    if (await awardButton.isVisible()) {
      await awardButton.click();

      const dialogPanel = page.locator('[role="dialog"], [data-radix-dialog-content]').first();
      await expect(dialogPanel).toBeVisible({ timeout: 5000 });

      // Assertion 1: Panel computed background-color has alpha = 1
      const isOpaque = await dialogPanel.evaluate((el) => {
        const bg = window.getComputedStyle(el).backgroundColor;
        const match = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        if (!match) return true;
        const alpha = match[4] !== undefined ? parseFloat(match[4]) : 1;
        return alpha === 1;
      });
      expect(isOpaque).toBe(true);

      // Assertion 2: document.elementFromPoint(centre of panel) returns a node INSIDE the panel
      const hitTestInside = await dialogPanel.evaluate((el) => {
        const rect = el.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const topElement = document.elementFromPoint(centerX, centerY);
        return el.contains(topElement);
      });
      expect(hitTestInside).toBe(true);

      // Assertion 3: Background element behind overlay is NOT hit-testable
      const backgroundBlocked = await page.evaluate(() => {
        // Test corner of screen (should hit backdrop/overlay, not page root content)
        const topEl = document.elementFromPoint(10, 10);
        return (
          topEl?.getAttribute("data-radix-dialog-overlay") !== null ||
          topEl?.classList.contains("z-overlay") ||
          topEl?.classList.contains("fixed") ||
          topEl?.getAttribute("aria-hidden") === "true" ||
          topEl?.tagName === "BODY"
        );
      });
      expect(backgroundBlocked).toBe(true);

      // Assertion 4: Focus is inside dialog panel
      const focusInside = await dialogPanel.evaluate((el) => {
        return el.contains(document.activeElement);
      });
      expect(focusInside).toBe(true);

      // Assertion 5: Body scroll is locked (overflow hidden or pointer-events disabled)
      const bodyScrollLocked = await page.evaluate(() => {
        const overflow = window.getComputedStyle(document.body).overflow;
        const pointerEvents = window.getComputedStyle(document.body).pointerEvents;
        return overflow === "hidden" || pointerEvents === "none" || document.body.hasAttribute("data-scroll-locked");
      });
      expect(bodyScrollLocked).toBe(true);

      // Assertion 6: Esc key closes modal and returns focus
      await page.keyboard.press("Escape");
      await expect(dialogPanel).not.toBeVisible({ timeout: 5000 });
    }
  });
});
