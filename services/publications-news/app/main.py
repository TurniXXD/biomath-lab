from __future__ import annotations

from fastapi import FastAPI, HTTPException

from app.digest import build_digest_pdf
from app.emailer import send_pdf_to_kindle
from app.models import (
    DigestRunRequest,
    DigestRunResponse,
    LatestNewsRequest,
    LatestNewsResponse,
    NewsSearchRequest,
    NewsSearchResponse,
)
from app.pubmed import latest_publications, load_settings, search_publications

app = FastAPI(title="Publications News Service", version="0.1.0")


@app.get("/health")
async def health():
    settings = load_settings()
    return {
        "status": "ok",
        "output_dir": str(settings.output_dir),
        "kindle_configured": bool(settings.kindle_recipient and settings.kindle_sender),
    }


@app.post("/news/search", response_model=NewsSearchResponse)
async def news_search(payload: NewsSearchRequest):
    try:
        return search_publications(
            query=payload.query,
            days=payload.days,
            max_results=payload.max_results,
            sources=payload.sources,
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@app.post("/news/latest", response_model=LatestNewsResponse)
async def news_latest(payload: LatestNewsRequest):
    try:
        return latest_publications(
            query=payload.query,
            day_offset=payload.day_offset,
            max_results_per_source=payload.max_results_per_source,
            sources=payload.sources,
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@app.post("/digest/run", response_model=DigestRunResponse)
async def digest_run(payload: DigestRunRequest):
    try:
        response, pdf_path = build_digest_pdf(
            queries=payload.queries,
            days=payload.days,
            max_results_per_query=payload.max_results_per_query,
            sources=payload.sources,
            output_pdf_path=payload.output_pdf_path,
        )
        if payload.send_kindle:
            emailed_to = send_pdf_to_kindle(pdf_path)
            response.emailed_to = emailed_to
        return response
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8100, reload=True)
