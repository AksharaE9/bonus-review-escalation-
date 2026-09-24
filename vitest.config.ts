import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["dotenv/config"],
    include: ["src/**/*.test.ts", "src/**/*.test.tsx", "tests/**/*.test.ts"],
    projects: [
      {
        test: {
          name: "unit",
          environment: "node",
          setupFiles: ["dotenv/config"],
          include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
        },
        resolve: {
          alias: {
            "@": path.resolve(__dirname, "./src"),
            "server-only": path.resolve(__dirname, "./node_modules/server-only/empty.js"),
            "next/server": path.resolve(__dirname, "./node_modules/next/server.js"),
          },
        },
      },
      {
        test: {
          name: "integration",
          environment: "node",
          setupFiles: ["dotenv/config"],
          include: ["tests/**/*.test.ts"],
        },
        resolve: {
          alias: {
            "@": path.resolve(__dirname, "./src"),
            "server-only": path.resolve(__dirname, "./node_modules/server-only/empty.js"),
            "next/server": path.resolve(__dirname, "./node_modules/next/server.js"),
          },
        },
      },
    ],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "server-only": path.resolve(__dirname, "./node_modules/server-only/empty.js"),
      "next/server": path.resolve(__dirname, "./node_modules/next/server.js"),
    },
  },
});
