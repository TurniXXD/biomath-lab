from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


AlignmentMode = Literal["global", "local"]


class AlignmentScoring(BaseModel):
    match_score: int = 1
    mismatch_score: int = -1
    gap_penalty: int = -1


class AlignmentAlignRequest(BaseModel):
    sequence_a: str = Field(..., min_length=1)
    sequence_b: str = Field(..., min_length=1)
    mode: AlignmentMode = "global"
    scoring: AlignmentScoring = Field(default_factory=AlignmentScoring)


class AlignmentResult(BaseModel):
    aligned_a: str
    aligned_b: str
    score: int
    start_a: int
    end_a: int
    start_b: int
    end_b: int
    operations: list[str]


class AlignmentAlignResponse(BaseModel):
    mode: AlignmentMode
    sequence_a: str
    sequence_b: str
    scoring: AlignmentScoring
    result: AlignmentResult
