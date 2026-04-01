from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field


class AlphaFoldLookupRequest(BaseModel):
    accession: str = Field(min_length=1, max_length=32)


class AlphaFoldPrediction(BaseModel):
    accession: str
    entry_id: Optional[str] = None
    protein_name: Optional[str] = None
    gene_name: Optional[str] = None
    organism_name: Optional[str] = None
    sequence_length: Optional[int] = None
    average_plddt: Optional[float] = None
    confidence_label: Optional[str] = None
    reviewed: Optional[bool] = None
    uniprot_url: Optional[str] = None
    entry_url: Optional[str] = None
    pdb_url: Optional[str] = None
    cif_url: Optional[str] = None
    bcif_url: Optional[str] = None
    pae_url: Optional[str] = None
    pae_image_url: Optional[str] = None
    sequence: Optional[str] = None


class AlphaFoldLookupResponse(BaseModel):
    accession: str
    count: int
    predictions: list[AlphaFoldPrediction] = Field(default_factory=list)

