from typing import List, Optional

from pydantic import BaseModel, Field


class ReactomeSearchItem(BaseModel):
    db_id: Optional[int] = None
    st_id: Optional[str] = None
    name: str
    species: Optional[str] = None
    schema_class: Optional[str] = None
    url: Optional[str] = None


class ReactomeSearchResponse(BaseModel):
    query: str
    items: List[ReactomeSearchItem]


class ReactomeReferenceItem(BaseModel):
    db_id: Optional[int] = None
    st_id: Optional[str] = None
    name: str
    schema_class: Optional[str] = None


class ReactomePathwayDetails(BaseModel):
    db_id: Optional[int] = None
    st_id: Optional[str] = None
    display_name: str
    schema_class: Optional[str] = None
    species: Optional[str] = None
    summary: Optional[str] = None
    literature_count: int = 0
    contained_events: List[ReactomeReferenceItem] = Field(default_factory=list)
    participants: List[ReactomeReferenceItem] = Field(default_factory=list)


class ReactomeReactionDetails(BaseModel):
    db_id: Optional[int] = None
    st_id: Optional[str] = None
    display_name: str
    schema_class: Optional[str] = None
    species: Optional[str] = None
    summary: Optional[str] = None
    inputs: List[ReactomeReferenceItem] = Field(default_factory=list)
    outputs: List[ReactomeReferenceItem] = Field(default_factory=list)
    catalysts: List[ReactomeReferenceItem] = Field(default_factory=list)


class ReactomeNeighborsResponse(BaseModel):
    entity_id: str
    entity_name: Optional[str] = None
    pathways: List[ReactomeReferenceItem] = Field(default_factory=list)
    reactions: List[ReactomeReferenceItem] = Field(default_factory=list)


class ReactomeAnalyzeGoalRequest(BaseModel):
    organism: str = Field(default="Homo sapiens", min_length=1)
    target_metabolite: str = Field(..., min_length=1)
    goal: str = Field(..., min_length=1)
    model_type: str = Field(default="content-service")


class ReactomeAnalyzeGoalResponse(BaseModel):
    organism: str
    target_metabolite: str
    goal: str
    model_type: str
    narrative: str
    pathway_hits: List[ReactomeSearchItem] = Field(default_factory=list)
    top_pathway: Optional[ReactomePathwayDetails] = None
    reactions: List[ReactomeReactionDetails] = Field(default_factory=list)
