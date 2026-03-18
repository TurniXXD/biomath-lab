from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.search import SearchRequest, SearchResponse
from app.repositories.search import vector_search
from app.core.auth import get_current_user

router = APIRouter(prefix="/search", tags=["search"])

@router.post("/", response_model=SearchResponse)
async def search(
    req: SearchRequest,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    if len(req.query_embedding) != 384:
        raise HTTPException(
            status_code=400,
            detail="query_embedding must have length 384",
        )

    hits = await vector_search(db, req.query_embedding, req.top_k)

    return {"hits": hits}