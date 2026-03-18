from pydantic import BaseModel, Field
from typing import List


class SearchRequest(BaseModel):
    query_embedding: List[float] = Field(..., min_length=1)
    top_k: int = Field(default=5, ge=1, le=100)


class SearchHit(BaseModel):
    id: int
    score: float


class SearchResponse(BaseModel):
    hits: List[SearchHit]