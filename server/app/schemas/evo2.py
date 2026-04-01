from typing import List, Optional

from pydantic import BaseModel, Field


class Evo2GenerateRequest(BaseModel):
    sequence: str = Field(..., min_length=1)
    num_tokens: int = Field(default=120, ge=1, le=2000)
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    top_k: int = Field(default=3, ge=1, le=6)
    enable_sampled_probs: bool = True
    enable_elapsed_ms_per_token: bool = True


class Evo2GenerateResponse(BaseModel):
    input_sequence: str
    generated_sequence: str
    full_sequence: str
    sampled_probs: List[float] = Field(default_factory=list)
    elapsed_ms: Optional[int] = None
    elapsed_ms_per_token: List[float] = Field(default_factory=list)
