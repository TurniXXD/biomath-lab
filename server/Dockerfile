FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apt-get update \
  && apt-get install -y --no-install-recommends gcc curl bash \
  && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir \
  "fastapi>=0.110" \
  "uvicorn[standard]>=0.27" \
  "sqlalchemy>=2.0" \
  "asyncpg>=0.29" \
  "pgvector>=0.2.5" \
  "pydantic-settings>=2.2" \
  "alembic>=1.13" \
  "cobra>=0.29" \
  "python-jose>=3.3.0"

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
