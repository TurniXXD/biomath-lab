# Publications News Service

Standalone microservice for science publication digests.

What it does:
- pulls new PubMed records through NCBI E-utilities
- pulls new Europe PMC records through the official Europe PMC search API
- renders a PDF digest
- optionally emails the digest to a Kindle `@kindle.com` address
- exposes a small FastAPI API
- can run from cron through a CLI entrypoint

## Run locally

```bash
cd /Users/teapot/work/test/biomath-lab/services/publications-news
uv sync
uv run python -m app.main
```

## Environment

Create `.env` or export:

```bash
PUBMED_TOOL=biomath-publications-news
PUBMED_EMAIL=you@example.com
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USERNAME=you@example.com
SMTP_PASSWORD=app-password
SMTP_USE_TLS=true
KINDLE_RECIPIENT=your_kindle@kindle.com
KINDLE_SENDER=you@example.com
PUBLICATIONS_NEWS_OUTPUT_DIR=/Users/teapot/work/test/biomath-lab/services/publications-news/output
```

For Kindle delivery, the sender address must be approved in your Amazon Send-to-Kindle settings.

## API

- `GET /health`
- `POST /news/search`
- `POST /news/latest`
- `POST /digest/run`

## Cron

Example 06:30 daily:

```cron
30 6 * * * cd /Users/teapot/work/test/biomath-lab/services/publications-news && /usr/bin/env bash -lc 'uv run python -m app.cli run-digest --query "glycolysis" --query "metabolic flux analysis" --days 1 --send-kindle'
```
