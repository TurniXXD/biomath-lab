from typing import Literal

from pydantic import BaseModel, Field


ObjectiveMode = Literal["balanced", "atp", "nadph"]
MetabolismProvider = Literal["kegg", "biocyc", "ecocyc", "reactome"]


class MetabolismSimulationRequest(BaseModel):
    glucose: float = Field(default=10, ge=0, le=200)
    oxygen: float = Field(default=30, ge=0, le=300)
    adp: float = Field(default=60, ge=0, le=500)
    nad: float = Field(default=40, ge=0, le=300)
    nadp: float = Field(default=15, ge=0, le=300)
    fad: float = Field(default=10, ge=0, le=200)
    objective_mode: ObjectiveMode = "balanced"


class MetabolismPathwayFluxes(BaseModel):
    glycolysis: float
    pentose_phosphate_pathway: float
    pyruvate_oxidation: float
    krebs_cycle: float
    electron_transport_chain: float


class MetabolismOutputs(BaseModel):
    atp: float
    nadh: float
    nadph: float
    fadh2: float
    co2: float
    ribose5p: float


class MetabolismFluxEntry(BaseModel):
    reaction_id: str
    label: str
    flux: float
    normalized_flux: float


class MetabolismYieldMetrics(BaseModel):
    atp_per_glucose: float
    nadph_per_glucose: float
    nadh_per_glucose: float
    oxygen_utilization: float


class MetabolismFluxAnalysis(BaseModel):
    glucose_partition: dict[str, float]
    reaction_fluxes: list[MetabolismFluxEntry]
    yield_metrics: MetabolismYieldMetrics
    dominant_pathway: str


class MetabolismShadowPrice(BaseModel):
    metabolite_id: str
    label: str
    value: float


class MetabolismReducedCost(BaseModel):
    reaction_id: str
    label: str
    value: float


class MetabolismFluxBalanceAnalysis(BaseModel):
    objective_reaction: str
    objective_sense: str
    constrained_uptakes: dict[str, float]
    shadow_prices: list[MetabolismShadowPrice]
    reduced_costs: list[MetabolismReducedCost]


class MetabolismSimulationResponse(BaseModel):
    objective_mode: ObjectiveMode
    pathway_fluxes: MetabolismPathwayFluxes
    outputs: MetabolismOutputs
    flux_analysis: MetabolismFluxAnalysis
    flux_balance_analysis: MetabolismFluxBalanceAnalysis
    status: str
    solver_status: str
    objective_value: float
    message: str


class MetabolismProviderSearchItem(BaseModel):
    id: str
    name: str
    source: MetabolismProvider
    summary: str | None = None
    url: str | None = None


class MetabolismProviderSearchResponse(BaseModel):
    provider: MetabolismProvider
    query: str
    items: list[MetabolismProviderSearchItem]
