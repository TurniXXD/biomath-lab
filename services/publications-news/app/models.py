from __future__ import annotations

from pathlib import Path
from typing import Literal, Optional

from pydantic import BaseModel, Field

PublicationSource = Literal["pubmed", "europepmc"]


class PublicationItem(BaseModel):
    pmid: str
    title: str
    authors: list[str] = Field(default_factory=list)
    journal: Optional[str] = None
    pubdate: Optional[str] = None
    doi: Optional[str] = None
    url: str
    source: PublicationSource


class NewsSearchRequest(BaseModel):
    query: str = ""
    days: int = Field(default=1, ge=1, le=30)
    max_results: int = Field(default=20, ge=1, le=100)
    sources: list[PublicationSource] = Field(default_factory=lambda: ["pubmed", "europepmc"])


class NewsSearchResponse(BaseModel):
    query: str
    days: int
    count: int
    items: list[PublicationItem]


class LatestNewsRequest(BaseModel):
    query: str = ""
    day_offset: int = Field(default=0, ge=0, le=7)
    max_results_per_source: int = Field(default=12, ge=1, le=50)
    sources: list[PublicationSource] = Field(default_factory=lambda: ["pubmed", "europepmc"])


class LatestNewsResponse(BaseModel):
    query: str
    day_offset: int
    date_label: str
    total_count: int
    groups: dict[PublicationSource, list[PublicationItem]]


class DigestRunRequest(BaseModel):
    queries: list[str] = Field(..., min_length=1)
    days: int = Field(default=1, ge=1, le=30)
    max_results_per_query: int = Field(default=15, ge=1, le=50)
    sources: list[PublicationSource] = Field(default_factory=lambda: ["pubmed", "europepmc"])
    send_kindle: bool = False
    output_pdf_path: Optional[str] = None


class DigestRunResponse(BaseModel):
    queries: list[str]
    total_items: int
    output_pdf_path: str
    emailed_to: Optional[str] = None
    sections: dict[str, int]


class ServiceSettings(BaseModel):
    pubmed_tool: str = "biomath-publications-news"
    pubmed_email: Optional[str] = None
    smtp_host: Optional[str] = None
    smtp_port: int = 587
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None
    smtp_use_tls: bool = True
    kindle_recipient: Optional[str] = None
    kindle_sender: Optional[str] = None
    output_dir: Path
