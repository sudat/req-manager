import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";
const url = new URL(baseURL);
const port = url.port ? Number(url.port) : 3000;

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/*.pw.ts",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `bun run dev -- --port ${port}`,
    url: baseURL,
    // Next.js dev server can't run twice in the same workspace (.next/dev/lock),
    // so reuse an existing server during local runs.
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
