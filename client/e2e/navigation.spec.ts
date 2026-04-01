import { expect, test } from "@playwright/test";
import { signInContext } from "./auth-utils";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";

test("sets the app title on public and protected pages", async ({ page }) => {
  await page.goto("/login");
  await expect(page).toHaveTitle("Biomath Lab");

  await page.goto("/blast");
  await expect(page).toHaveTitle("Biomath Lab");
});

test("shows the shared bio sidebar section for signed in users", async ({
  browser,
}) => {
  const context = await browser.newContext({ baseURL });
  await signInContext(context, baseURL);

  const page = await context.newPage();
  await page.goto("/blast");

  await expect(page.getByText("DNA, protein, metabolism")).toBeVisible();
  await expect(page.getByRole("link", { name: "BLAST" })).toBeVisible();
  await expect(page.getByRole("link", { name: "AlphaFold" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Metabolism" })).toBeVisible();

  await context.close();
});
