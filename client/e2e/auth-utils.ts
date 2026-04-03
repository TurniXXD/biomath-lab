import { encode } from "next-auth/jwt";
import type { BrowserContext } from "@playwright/test";

const authSecret = process.env.NEXTAUTH_SECRET ?? "playwright-secret";

export async function createSessionToken() {
  return encode({
    secret: authSecret,
    token: {
      name: "Playwright User",
      email: "playwright@example.com",
      picture: null,
      userId: "1",
    },
  });
}

export async function signInContext(context: BrowserContext, baseURL: string) {
  const token = await createSessionToken();

  await context.addCookies([
    {
      name: "next-auth.session-token",
      value: token,
      url: baseURL,
    },
  ]);
}
