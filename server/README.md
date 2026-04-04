# Server

FastAPI backend for Biomath Lab.

Live app: [https://biomath-lab.vantuch.dev/](https://biomath-lab.vantuch.dev/)

## Runtime

The backend uses:

- `DATABASE_URL` for the async SQLAlchemy session
- `DATABASE_URL_SYNC` for Alembic migrations
- `PUBLICATIONS_NEWS_BASE_URL` for the publications-news microservice
- `ALIGNMENT_BASE_URL` for the Rust alignment microservice
- `CORS_ALLOW_ORIGINS` as a comma-separated allowlist for browser origins

In the Raspberry Pi compose setup, migrations run before Uvicorn starts.

## Deploy Notes

If the API is exposed behind Nginx under `/api/biomath-lab`, the public base
URL from the client must match that prefix.

The root README contains the full Pi, Vercel, Google, GitHub, and Tailscale
setup instructions.
