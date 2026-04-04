# Publications News Service

Standalone microservice for science publication digests.

What it does:

- pulls new PubMed records through NCBI E-utilities
- pulls new Europe PMC records through the official Europe PMC search API
- renders a PDF digest
- optionally emails the digest to a Kindle `@kindle.com` address
- exposes a small FastAPI API
- can run from cron through a CLI entrypoint

## Local Development

Use `services/publications-news/.env.example` style values or the shared Pi
`.env` file:

```env
PUBMED_TOOL=biomath-publications-news
PUBMED_EMAIL=you@example.com
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USERNAME=you@example.com
SMTP_PASSWORD=app-password
SMTP_USE_TLS=true
KINDLE_RECIPIENT=your_kindle@kindle.com
KINDLE_SENDER=you@example.com
PUBLICATIONS_NEWS_OUTPUT_DIR=/path/to/output
```

## Raspberry Pi Docker Setup

In `docker-compose.rpi.yml`, the service reads the shared Pi `.env` file and
uses `PUBLICATIONS_NEWS_OUTPUT_DIR=/app/output`.

That means one `.env` on the Pi can hold both the backend database settings and
the publications digest settings.

## Cron

The CLI entrypoint is:

```bash
python -m app.cli run-digest --query "glycolysis" --query "metabolic flux analysis" --days 1 --send-kindle
```

Example daily run at 06:30 on the Pi:

```cron
30 6 * * * cd /home/admin/biomath-lab && /usr/bin/docker-compose -f docker-compose.rpi.yml run --rm publications-news python -m app.cli run-digest --query "glycolysis" --query "metabolic flux analysis" --days 1 --send-kindle >> /home/admin/biomath-lab/publications-news.log 2>&1
```

For Kindle delivery, the sender address must be approved in Amazon Send-to-Kindle.

## API

- `GET /health`
- `POST /news/search`
- `POST /news/latest`
- `POST /digest/run`

The root README has the full end-to-end deployment checklist.
