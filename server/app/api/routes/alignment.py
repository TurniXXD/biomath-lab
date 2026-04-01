from fastapi import APIRouter, HTTPException

from app.schemas.alignment import AlignmentAlignRequest, AlignmentAlignResponse
from app.services.alignment import align_sequences

router = APIRouter(prefix="/alignment", tags=["alignment"])


@router.get("/health")
async def alignment_health():
    return {"status": "ok"}


@router.post("/align", response_model=AlignmentAlignResponse)
async def alignment_align(payload: AlignmentAlignRequest):
    try:
        return align_sequences(payload)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
