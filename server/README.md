# Server

## run migrations (includes pgvector extension in first migration)

alembic upgrade head

## run server

uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload

[api.biomath-lab.vantuch.dev](api.biomath-lab.vantuch.dev)

## migrations

alembic upgrade head

alembic revision -m "init tables" --autogenerate
