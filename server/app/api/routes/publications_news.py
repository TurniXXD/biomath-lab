from fastapi import APIRouter, HTTPException

from app.schemas.publications_news import (
    PublicationsNewsDigestRunRequest,
    PublicationsNewsDigestRunResponse,
    PublicationsNewsLatestRequest,
    PublicationsNewsLatestResponse,
    PublicationsNewsSearchRequest,
    PublicationsNewsSearchResponse,
)
from app.services.publications_news import get_health, run_digest, search_latest_news, search_news

router = APIRouter(prefix="/publications-news", tags=["publications-news"])


@router.get("/health")
async def publications_news_health():
    try:
        return get_health()
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.post("/search", response_model=PublicationsNewsSearchResponse)
async def publications_news_search(payload: PublicationsNewsSearchRequest):
    try:
        return search_news(payload.model_dump())
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.post("/latest", response_model=PublicationsNewsLatestResponse)
async def publications_news_latest(payload: PublicationsNewsLatestRequest):
    try:
        return search_latest_news(payload.model_dump())
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.post("/digest/run", response_model=PublicationsNewsDigestRunResponse)
async def publications_news_digest_run(payload: PublicationsNewsDigestRunRequest):
    try:
        return run_digest(payload.model_dump())
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
