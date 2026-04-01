from fastapi import APIRouter, HTTPException, Query

from app.schemas.metabolism import (
    MetabolismProvider,
    MetabolismProviderSearchResponse,
    MetabolismSimulationRequest,
    MetabolismSimulationResponse,
)
from app.services.metabolism import search_metabolism_provider, simulate_metabolism

router = APIRouter(prefix="/metabolism", tags=["metabolism"])


@router.post("/simulate", response_model=MetabolismSimulationResponse)
async def simulate_metabolism_route(payload: MetabolismSimulationRequest):
    try:
        return simulate_metabolism(payload)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.get("/providers/{provider}/search", response_model=MetabolismProviderSearchResponse)
async def provider_search(
    provider: MetabolismProvider,
    query: str = Query(..., min_length=1),
):
    try:
        return search_metabolism_provider(provider, query)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
