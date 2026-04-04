# Client

Next.js frontend for Biomath Lab.

Live app: [https://biomath-lab.vantuch.dev/](https://biomath-lab.vantuch.dev/)

## Local Development

Use the values from `client/.env.example`:

- `NEXT_PUBLIC_API_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`

Run locally with the standard Next.js scripts from `package.json`.

## Vercel Deployment

Set these production environment variables in Vercel:

```env
NEXTAUTH_URL=https://biomath-lab.vantuch.dev
NEXTAUTH_SECRET=generate-a-long-random-secret
NEXT_PUBLIC_API_URL=...

GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
```

OAuth callback URLs must point back to the Vercel domain:

- `https://biomath-lab.vantuch.dev/api/auth/callback/google`
- `https://biomath-lab.vantuch.dev/api/auth/callback/github`

The root README has the full end-to-end deployment checklist for GitHub,
Google, Tailscale, Vercel, and the Raspberry Pi.
