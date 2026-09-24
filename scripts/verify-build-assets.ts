#!/usr/bin/env node
/**
 * scripts/verify-build-assets.ts
 *
 * C1 Guard — Post-build verification script.
 * Fails the build if:
 *  - No CSS file is emitted under .next/static/css/
 *  - The largest CSS file is smaller than MIN_CSS_BYTES
 *  - The CSS does not contain known utility marker selectors
 *  - No JS chunk files are emitted under .next/static/chunks/
 *
 * Run after `next build` in CI and Vercel post-build step.
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const NEXT_DIR = path.join(ROOT, ".next");

const MIN_CSS_BYTES = 10_000; // 10KB — a valid Tailwind output is never smaller
const CSS_MARKERS = [".flex", ".grid", ".rounded", ".bg-", ".text-", ".border"];
const MIN_JS_CHUNKS = 5; // A compiled Next.js app always has many chunks

let failures = 0;

function fail(msg: string) {
  console.error(`  ✗ ${msg}`);
  failures++;
}

function pass(msg: string) {
  console.log(`  ✓ ${msg}`);
}

console.log("\n═══════════════════════════════════════════════════");
console.log(" PULSE BUILD ASSET VERIFICATION");
console.log("═══════════════════════════════════════════════════\n");

// ── 1. Check .next directory exists ──────────────────────────────────────────
if (!fs.existsSync(NEXT_DIR)) {
  console.error("✗ FATAL: .next directory not found. Run `next build` first.");
  process.exit(1);
}

// ── 2. CSS artifacts ─────────────────────────────────────────────────────────
const cssDir = path.join(NEXT_DIR, "static", "css");

if (!fs.existsSync(cssDir)) {
  fail("No .next/static/css/ directory found — CSS was never emitted.");
  fail("Root cause: PostCSS/Tailwind not available at build time (likely in devDependencies on a prod-only install host).");
} else {
  const cssFiles = fs.readdirSync(cssDir).filter((f) => f.endsWith(".css"));

  if (cssFiles.length === 0) {
    fail("CSS directory exists but contains no .css files.");
  } else {
    const largest = cssFiles
      .map((f) => ({ name: f, size: fs.statSync(path.join(cssDir, f)).size }))
      .sort((a, b) => b.size - a.size)[0];

    pass(`Found ${cssFiles.length} CSS file(s). Largest: ${largest.name} (${largest.size.toLocaleString()} bytes)`);

    if (largest.size < MIN_CSS_BYTES) {
      fail(
        `Largest CSS file is only ${largest.size} bytes (minimum ${MIN_CSS_BYTES}). ` +
        `Tailwind ran but found no source files to scan — check @source declarations or content paths.`
      );
    } else {
      pass(`CSS file size ${largest.size.toLocaleString()} bytes > minimum ${MIN_CSS_BYTES.toLocaleString()} bytes.`);
    }

    // Check for known utility markers
    const content = fs.readFileSync(path.join(cssDir, largest.name), "utf-8");
    for (const marker of CSS_MARKERS) {
      if (content.includes(marker)) {
        pass(`CSS contains marker: "${marker}"`);
      } else {
        fail(`CSS does NOT contain expected utility marker "${marker}". Tailwind utilities may not have been generated.`);
      }
    }
  }
}

// ── 3. JS chunk artifacts ─────────────────────────────────────────────────────
const chunksDir = path.join(NEXT_DIR, "static", "chunks");

if (!fs.existsSync(chunksDir)) {
  fail("No .next/static/chunks/ directory found — JS was never emitted.");
} else {
  const jsFiles = fs.readdirSync(chunksDir).filter((f) => f.endsWith(".js"));
  if (jsFiles.length < MIN_JS_CHUNKS) {
    fail(`Only ${jsFiles.length} JS chunks found (expected ≥ ${MIN_JS_CHUNKS}). Build may be incomplete.`);
  } else {
    pass(`Found ${jsFiles.length} JS chunk(s).`);
  }
}

// ── 4. Result ─────────────────────────────────────────────────────────────────
console.log("\n───────────────────────────────────────────────────");
if (failures > 0) {
  console.error(`\n✗ BUILD ASSET VERIFICATION FAILED — ${failures} failure(s) above.\n`);
  console.error("  This means the deployed page will render as unstyled HTML.");
  console.error("  Fix: ensure tailwindcss, @tailwindcss/postcss, and postcss are in `dependencies`,");
  console.error("  not `devDependencies`, so they are present during the production build.\n");
  process.exit(1);
} else {
  console.log("\n✓ All build asset checks passed. CSS and JS are correctly emitted.\n");
}
