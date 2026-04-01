from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field

PublicationsSource = Literal["pubmed", "europepmc"]


class PublicationsNewsSearchRequest(BaseModel):
    query: str = ""
    days: int = Field(default=1, ge=1, le=30)
    max_results: int = Field(default=20, ge=1, le=100)
    sources: list[PublicationsSource] = Field(default_factory=lambda: ["pubmed", "europepmc"])


class PublicationsNewsItem(BaseModel):
    pmid: str
    title: str
    authors: list[str] = Field(default_factory=list)
    journal: Optional[str] = None
    pubdate: Optional[str] = None
    doi: Optional[str] = None
    url: str
    source: PublicationsSource


class PublicationsNewsSearchResponse(BaseModel):
    query: str
    days: int
    count: int
    items: list[PublicationsNewsItem]


class PublicationsNewsLatestRequest(BaseModel):
    query: str = ""
    day_offset: int = Field(default=0, ge=0, le=7)
    max_results_per_source: int = Field(default=12, ge=1, le=50)
    sources: list[PublicationsSource] = Field(default_factory=lambda: ["pubmed", "europepmc"])


class PublicationsNewsLatestResponse(BaseModel):
    query: str
    day_offset: int
    date_label: str
    total_count: int
    groups: dict[PublicationsSource, list[PublicationsNewsItem]]


class PublicationsNewsDigestRunRequest(BaseModel):
    queries: list[str] = Field(..., min_length=1)
    days: int = Field(default=1, ge=1, le=30)
    max_results_per_query: int = Field(default=15, ge=1, le=50)
    sources: list[PublicationsSource] = Field(default_factory=lambda: ["pubmed", "europepmc"])
    send_kindle: bool = False
    output_pdf_path: Optional[str] = None


class PublicationsNewsDigestRunResponse(BaseModel):
    queries: list[str]
    total_items: int
    output_pdf_path: str
    emailed_to: Optional[str] = None
    sections: dict[str, int]
