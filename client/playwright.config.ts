import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";
const nextauthSecret = process.env.NEXTAUTH_SECRET ?? "playwright-secret";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: {
    command: "pnpm dev --hostname 127.0.0.1 --port 3000",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      NEXTAUTH_SECRET: nextauthSecret,
      NEXTAUTH_URL: baseURL,
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? "playwright-google-client",
      GOOGLE_CLIENT_SECRET:
        process.env.GOOGLE_CLIENT_SECRET ?? "playwright-google-secret",
      GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID ?? "playwright-github-client",
      GITHUB_CLIENT_SECRET:
        process.env.GITHUB_CLIENT_SECRET ?? "playwright-github-secret",
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000",
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
