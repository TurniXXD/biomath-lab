import logging

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import (
    auth,
    alphafold,
    alignment,
    dna_sequences,
    evo2,
    health,
    matrix,
    metabolism,
    publications_news,
    reactome,
    search,
    users,
)
from app.api.deps import get_current_user
from dotenv import load_dotenv

load_dotenv()
logging.basicConfig(level=logging.INFO)

app = FastAPI(
    title="BioMath Lab API",
    version="0.1.0",
    description="FastAPI + Postgres + pgvector. Swagger: /docs",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(health.router)

protected_router_dependencies = [Depends(get_current_user)]

for router in (
    search.router,
    matrix.router,
    alphafold.router,
    alignment.router,
    dna_sequences.router,
    reactome.router,
    evo2.router,
    metabolism.router,
    publications_news.router,
):
    app.include_router(router, dependencies=protected_router_dependencies)
