from datetime import datetime

from pydantic import BaseModel, Field


class DNASequenceCreate(BaseModel):
    email: str = Field(..., min_length=1)
    name: str | None = None
    sequence: str = Field(..., min_length=1)
    source: str | None = None


class DNASequenceOut(BaseModel):
    id: int
    name: str | None
    sequence: str
    source: str | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DNASequenceLatestOut(BaseModel):
    sequence: DNASequenceOut | None
