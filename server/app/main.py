from fastapi import FastAPI
from app.api.routes import health, search, matrix, auth
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="BioMath Lab API",
    version="0.1.0",
    description="FastAPI + Postgres + pgvector. Swagger: /docs",
)

app.include_router(auth.router)
app.include_router(health.router)
app.include_router(search.router)
app.include_router(matrix.router)