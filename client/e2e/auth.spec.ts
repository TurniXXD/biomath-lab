import { expect, test } from "@playwright/test";
import { signInContext } from "./auth-utils";

test("redirects unauthenticated users to login", async ({ page }) => {
  await page.goto("/blast");

  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});

test("allows authenticated users to access a protected route", async ({
  browser,
}) => {
  const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";
  const context = await browser.newContext({ baseURL });
  await signInContext(context, baseURL);

  const page = await context.newPage();
  await page.goto("/blast");

  await expect(page).toHaveURL(/\/blast/);
  await expect(page.getByRole("heading", { name: "BLAST" })).toBeVisible();

  await context.close();
});
