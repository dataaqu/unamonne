import { defineConfig, devices } from "@playwright/test";

const PORT = 3210;
const baseURL = `http://localhost:${PORT}`;

/**
 * E2E smoke config. Specs live in tests/e2e/*.spec.ts (named .spec so vitest,
 * which only picks up *.test.ts, ignores them).
 *
 * The smoke flows are database-independent — they cover locale routing, the
 * header shell, and the admin guard, none of which query the DB. A throwaway
 * AUTH_SECRET lets Auth.js initialize; DATABASE_URL is a placeholder.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: `npx next dev -p ${PORT}`,
    url: `${baseURL}/ka`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      AUTH_SECRET: "e2e-throwaway-secret-do-not-use-in-production-000000",
      DATABASE_URL: "postgres://placeholder:placeholder@localhost:5432/placeholder",
    },
  },
});
