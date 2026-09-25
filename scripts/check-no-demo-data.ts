#!/usr/bin/env node
/**
 * scripts/check-no-demo-data.ts
 *
 * C4 Guard — Fails the build if the source tree contains banned markers:
 *  - Demo person names that appeared in the original seed
 *  - Placeholder text patterns (lorem, TODO, FIXME, coming soon)
 *  - Dollar signs in display strings (product is INR — use ₹)
 *  - Plaintext passwords
 *  - Mock data arrays
 *
 * Run in CI before build to catch regressions.
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// Directories to scan
const SCAN_DIRS = ["src", "public"];
// Extensions to check
const SCAN_EXTS = [".tsx", ".ts", ".jsx", ".js", ".css", ".html", ".md"];
// Directories to skip
const SKIP_DIRS = new Set(["node_modules", ".next", ".git", "dist", "out"]);

interface BannedPattern {
  pattern: RegExp;
  description: string;
  severity: "ERROR" | "WARN";
  skipFiles?: RegExp; // Files to skip for this rule
}

const BANNED: BannedPattern[] = [
  // Demo person names from seed (first name + last initial or full)
  { pattern: /sneha\.kulkarni|devendra\.patil|rohan\.iyer|pooja\.bhatia|tanmay\.sengupta|kavita\.sundaram|meera\.nambiar|siddharth\.mukherjee/i, description: "Demo person name (seed data)", severity: "ERROR", skipFiles: /seed\.ts|verify-db\.ts/ },
  // Plaintext passwords in source
  { pattern: /Admin@12345|Lead@12345|User@12345/i, description: "Plaintext demo password in source", severity: "ERROR" },
  // Dollar sign in currency display (product is INR)
  { pattern: /\$[0-9,]+|\bcurrency.*en-US\b|Intl\.NumberFormat\('en-US'/i, description: "Dollar/USD currency formatting (use ₹/en-IN)", severity: "ERROR", skipFiles: /node_modules|src\/auth\.ts/ },
  // Placeholder text
  { pattern: /lorem ipsum/i, description: "Lorem ipsum placeholder text", severity: "ERROR" },
  // Mock data patterns
  { pattern: /\bmockData\b|\bdemoUsers\b|\bfakeData\b|\bdummyData\b/i, description: "Mock/fake data variable name", severity: "ERROR" },
  // Coming soon / not implemented
  { pattern: /coming soon|not implemented|TODO:.*PLACEHOLDER|FIXME:.*PLACEHOLDER/i, description: "Coming soon / not implemented placeholder", severity: "WARN" },
  // Demo credentials panel (the specific string from the old sign-in page)
  { pattern: /Active System Logins|Demo Credentials Panel/i, description: "Demo credentials UI panel", severity: "ERROR" },
];

let errors = 0;
let warnings = 0;

function scanFile(filePath: string) {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const normalizedPath = filePath.replace(/\\/g, "/");

  for (const rule of BANNED) {
    if (rule.skipFiles && rule.skipFiles.test(normalizedPath)) continue;
    lines.forEach((line, idx) => {
      if (rule.pattern.test(line)) {
        const location = `${filePath}:${idx + 1}`;
        if (rule.severity === "ERROR") {
          console.error(`  ✗ [ERROR] ${location}`);
          console.error(`    Rule: ${rule.description}`);
          console.error(`    Line: ${line.trim().substring(0, 120)}`);
          errors++;
        } else {
          console.warn(`  ⚠ [WARN] ${location}`);
          console.warn(`    Rule: ${rule.description}`);
          warnings++;
        }
      }
    });
  }
}

function scanDir(dir: string) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) {
        scanDir(path.join(dir, entry.name));
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (SCAN_EXTS.includes(ext)) {
        scanFile(path.join(dir, entry.name));
      }
    }
  }
}

console.log("\n═══════════════════════════════════════════════════");
console.log(" PULSE DEMO DATA & SECRET GUARD");
console.log("═══════════════════════════════════════════════════\n");

for (const dir of SCAN_DIRS) {
  const fullDir = path.join(ROOT, dir);
  console.log(`Scanning ${fullDir}...`);
  scanDir(fullDir);
}

console.log("\n───────────────────────────────────────────────────");
console.log(`Scan complete. Errors: ${errors}  Warnings: ${warnings}`);

if (errors > 0) {
  console.error(`\n✗ DEMO DATA GUARD FAILED — ${errors} error(s) found.`);
  console.error("  Remove all demo markers, plaintext passwords, and mock data from source before shipping.\n");
  process.exit(1);
} else {
  console.log("\n✓ No banned demo markers found in source tree.\n");
}
