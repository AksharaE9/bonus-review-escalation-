import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

const authDir = path.join(process.cwd(), "playwright", ".auth");

export default defineConfig({
  testDir: "./tests",
  testMatch: /.*\.spec\.ts/,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  use: {
    baseURL: process.env.AUTH_URL || "http://localhost:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 60000,
  },
  projects: [
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: "admin",
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        channel: "msedge",
        storageState: path.join(authDir, "admin.json"),
      },
    },
    {
      name: "lead",
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        channel: "msedge",
        storageState: path.join(authDir, "lead.json"),
      },
    },
    {
      name: "user",
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        channel: "msedge",
        storageState: path.join(authDir, "user.json"),
      },
    },
    {
      name: "unauthenticated",
      use: {
        ...devices["Desktop Chrome"],
        channel: "msedge",
      },
    },
  ],
});
