from fastapi import APIRouter, HTTPException, Query

from app.schemas.reactome import (
    ReactomeAnalyzeGoalRequest,
    ReactomeAnalyzeGoalResponse,
    ReactomeNeighborsResponse,
    ReactomePathwayDetails,
    ReactomeReactionDetails,
    ReactomeSearchResponse,
)
from app.services.reactome import (
    analyze_goal,
    get_neighbors,
    get_pathway_details,
    get_reaction_details,
    search_pathways,
)

router = APIRouter(prefix="/reactome", tags=["reactome"])


@router.get("/search", response_model=ReactomeSearchResponse)
async def search_pathway(
    query: str = Query(..., min_length=1),
    species: str = Query(default="Homo sapiens"),
):
    try:
        items = search_pathways(query=query, species=species)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return ReactomeSearchResponse(query=query, items=items)


@router.get("/pathways/{reactome_id}", response_model=ReactomePathwayDetails)
async def pathway_details(reactome_id: str):
    try:
        return get_pathway_details(reactome_id)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.get("/reactions/{reactome_id}", response_model=ReactomeReactionDetails)
async def reaction_details(reactome_id: str):
    try:
        return get_reaction_details(reactome_id)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.get("/entities/{entity_id}/neighbors", response_model=ReactomeNeighborsResponse)
async def entity_neighbors(entity_id: str):
    try:
        return get_neighbors(entity_id)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.post("/analyze-goal", response_model=ReactomeAnalyzeGoalResponse)
async def analyze_goal_route(payload: ReactomeAnalyzeGoalRequest):
    try:
        return analyze_goal(
            organism=payload.organism,
            target_metabolite=payload.target_metabolite,
            goal=payload.goal,
            model_type=payload.model_type,
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
