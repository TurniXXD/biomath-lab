# Biomath Lab

Biomath Lab is an interactive math and biology playground.

Live app: [https://biomath-lab.vantuch.dev/](https://biomath-lab.vantuch.dev/)

## Project Structure

- `client/` - Next.js frontend
- `server/` - FastAPI backend
- `services/publications-news/` - publications digest microservice
- `services/alignment/` - Rust sequence alignment crate and HTTP service

## Local Development

Use the root script to start the local stack:

```bash
./run.sh
```

That script starts the database and runs the client, backend, publications-news
service, and alignment service in dev mode.

## Production Layout

Recommended deployment split:

- `client` on Vercel
- `server` on a Raspberry Pi behind Nginx
- `services/publications-news` and `services/alignment` on the same Pi
- Tailscale for private SSH/deploy access to the Pi

The browser talks to the client on Vercel. The client talks to the FastAPI
server through the public API URL. The server talks to the private services on
the Pi over the internal Docker network.

## From Scratch Setup

### 1. GitHub

Create or use the repository, then add these repository secrets for the deploy
workflow:

- `RPI_HOST`
- `RPI_USER`
- `RPI_SSH_KEY`
- `RPI_SSH_PORT` if you do not use port `22`
- `TS_OAUTH_CLIENT_ID`
- `TS_OAUTH_SECRET`

The GitHub Actions workflow builds backend images on pushes to `main`, pushes
them to GHCR, and SSHes into the Pi over Tailscale to restart the stack.

### 2. Google OAuth

Create a Google Cloud OAuth client of type Web application.

Add these authorized JavaScript origins:

- `http://localhost:3000`
- `https://biomath-lab.vantuch.dev`

Add these authorized redirect URIs:

- `http://localhost:3000/api/auth/callback/google`
- `https://biomath-lab.vantuch.dev/api/auth/callback/google`

Copy the Google client ID and secret into:

- local client `.env` during development
- Vercel environment variables

### 3. GitHub OAuth

Create a GitHub OAuth App for Biomath Lab.

Set the callback URLs to:

- `http://localhost:3000/api/auth/callback/github`
- `https://biomath-lab.vantuch.dev/api/auth/callback/github`

Copy the GitHub client ID and secret into:

- local client `.env` during development
- Vercel environment variables

### 4. Tailscale

Join the Raspberry Pi to your tailnet.

Use Tailscale for:

- GitHub Actions SSH deploy access to the Pi
- optional private admin access to the Pi

The GitHub Actions workflow expects a Tailscale OAuth client tagged for CI.
The runner uses that client to reach the Pi over your tailnet before SSHing in.

### 5. Vercel

Deploy the `client/` directory as the frontend app.

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

Notes:

- `NEXTAUTH_URL` must be the public client URL.
- `NEXT_PUBLIC_API_URL` must point to the public FastAPI base URL.
- If you proxy the API somewhere else, change this URL accordingly.

For local development, use `client/.env.example` as the template.

### 6. Raspberry Pi

Install on the Pi:

- Docker
- Docker Compose
- Tailscale
- Nginx

Clone the repo to:

```bash
/home/admin/biomath-lab
```

Create `/home/admin/biomath-lab/.env` from `docker-compose.rpi.env.example`
and fill in:

```env
GHCR_OWNER=turnixxd
NEXTAUTH_SECRET=generate-a-long-random-secret
IMAGE_TAG=latest

POSTGRES_DB=biomath-lab
POSTGRES_USER=app
POSTGRES_PASSWORD=...

CORS_ALLOW_ORIGINS=https://biomath-lab.vantuch.dev,http://localhost:3000,http://127.0.0.1:3000

PUBMED_TOOL=biomath-publications-news
PUBMED_EMAIL=you@example.com

SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USERNAME=you@example.com
SMTP_PASSWORD=your-app-password
SMTP_USE_TLS=true

KINDLE_RECIPIENT=your_kindle@kindle.com
KINDLE_SENDER=you@example.com

PUBLICATIONS_NEWS_OUTPUT_DIR=/app/output
```

The `publications-news` container reads the same `.env` file through
`env_file`, so the digest CLI and cron job can use those settings too.

If your GHCR packages are private, log in once on the Pi:

```bash
docker login ghcr.io
```

Use a GitHub personal access token with `read:packages`.

Start or refresh the stack:

```bash
cd /home/admin/biomath-lab
./scripts/deploy-rpi.sh
```

### 7. Nginx

Expose the FastAPI server on your public domain through a path prefix such as
`/api/biomath-lab`.

Example:

```nginx
server {
    listen 80;
    server_name _;

    location /api/biomath-lab/ {
        proxy_pass http://127.0.0.1:8000/;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Prefix /api/biomath-lab;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

If you use a different path or a subdomain, update `NEXT_PUBLIC_API_URL` in
Vercel to match.

### 8. Publications Cron

The publications-news service can generate and email digests from cron on the
Pi.

Example daily run at 06:30:

```cron
30 6 * * * cd /home/admin/biomath-lab && /usr/bin/docker-compose -f docker-compose.rpi.yml run --rm publications-news python -m app.cli run-digest --query "glycolysis" --query "metabolic flux analysis" --days 1 --send-kindle >> /home/admin/biomath-lab/publications-news.log 2>&1
```

If you want to avoid overlap, wrap the command in `flock`.

## Environment Cheat Sheet

### Vercel

- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `NEXT_PUBLIC_API_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`

### Raspberry Pi `.env`

- `GHCR_OWNER`
- `IMAGE_TAG`
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `PUBMED_TOOL`
- `PUBMED_EMAIL`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USERNAME`
- `SMTP_PASSWORD`
- `SMTP_USE_TLS`
- `KINDLE_RECIPIENT`
- `KINDLE_SENDER`

### GitHub repository secrets

- `RPI_HOST`
- `RPI_USER`
- `RPI_SSH_KEY`
- `RPI_SSH_PORT` if needed
- `TS_OAUTH_CLIENT_ID`
- `TS_OAUTH_SECRET`

## Pi Deployment Files

- `docker-compose.rpi.env.example`
- `scripts/deploy-rpi.sh`
- `scripts/sync-rpi-stack.sh`

The deploy script assumes the Pi already has the repo checked out under
`/home/admin/biomath-lab`.
