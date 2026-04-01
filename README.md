# Biomath Lab

Biomath Lab is an interactive math and biology playground.

Live app: [https://biomath-lab.vantuch.dev/](https://biomath-lab.vantuch.dev/)

## Project Structure

- `client/` - Next.js frontend
- `server/` - FastAPI backend
- `services/publications-news/` - Publications and news microservice
- `services/alignment/` - Rust sequence alignment CLI

## Docker

Use the root compose file for local development:

```bash
./run.sh
```

The root `run.sh` starts only the database through `docker compose` and runs
the client, FastAPI backend, publications-news service, and alignment server
locally in dev mode.

The Rust alignment crate lives in `services/alignment/`. It is packaged both
as an optional CLI tool image and as a small HTTP service used by the FastAPI
backend. Run the CLI tool with:

```bash
docker compose --profile tools run --rm alignment global ACGT AGT
```

## Raspberry Pi + Tailscale sketch

Recommended production flow for the backend stack:

1. GitHub Actions builds the backend images for `server`, `publications-news`,
   and `alignment` and pushes them to GHCR.
2. Your Raspberry Pi runs `docker compose -f docker-compose.rpi.yml up -d`.
3. The Pi pulls the images from GHCR, then Tailscale exposes only the `server`
   port.
4. The browser talks to the server, and the server talks to the private services.

On the Pi, set:

```bash
export GHCR_OWNER=your-github-user-or-org
export IMAGE_TAG=latest
```

If the GHCR packages are private, log in once on the Pi:

```bash
docker login ghcr.io
```

Then start or refresh the stack:

```bash
docker compose -f docker-compose.rpi.yml pull
docker compose -f docker-compose.rpi.yml up -d
```

If you want the Pi to expose only the server through Tailscale, point
`tailscale serve` at `http://127.0.0.1:8000` or proxy the port you publish for
the server container.

### Pi deployment files

Copy `docker-compose.rpi.env.example` to `.env` on the Pi and fill in your
values there. The deployment script is `scripts/deploy-rpi.sh`.

The Pi stack is expected to live at `/home/admin/biomath-lab`. If you want to
push the compose file and deploy script there from your local checkout, use:

```bash
RPI_HOST=your-pi-host RPI_USER=admin ./scripts/sync-rpi-stack.sh
```

If you want GitHub Actions to SSH into the Pi and restart the stack
automatically, add these repository secrets:

- `RPI_HOST`
- `RPI_USER`
- `RPI_SSH_KEY`
- `RPI_SSH_PORT` if you do not use port `22`

The deploy job assumes the Pi already has:

- Docker and Docker Compose
- Tailscale
- the files synced into `/home/admin/biomath-lab`
- a prior `docker login ghcr.io` if the GHCR packages are private
