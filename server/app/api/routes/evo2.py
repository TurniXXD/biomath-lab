from fastapi import APIRouter, HTTPException

from app.schemas.evo2 import Evo2GenerateRequest, Evo2GenerateResponse
from app.services.evo2 import generate_sequence

router = APIRouter(prefix="/evo2", tags=["evo2"])


@router.post("/generate", response_model=Evo2GenerateResponse)
async def evo2_generate(payload: Evo2GenerateRequest):
    try:
        return generate_sequence(payload)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
