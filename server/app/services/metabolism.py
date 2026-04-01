from __future__ import annotations

import logging
import json
from urllib.parse import quote, urlencode
from urllib.request import Request, urlopen

from app.schemas.metabolism import (
    MetabolismFluxAnalysis,
    MetabolismFluxEntry,
    MetabolismFluxBalanceAnalysis,
    MetabolismOutputs,
    MetabolismPathwayFluxes,
    MetabolismProvider,
    MetabolismProviderSearchItem,
    MetabolismProviderSearchResponse,
    MetabolismReducedCost,
    MetabolismShadowPrice,
    MetabolismSimulationRequest,
    MetabolismSimulationResponse,
    MetabolismYieldMetrics,
)
from app.services.reactome import search_pathways

logger = logging.getLogger(__name__)

try:
    import cobra
    from cobra import Model, Reaction, Metabolite
except ImportError:  # pragma: no cover - import failure is handled at runtime
    cobra = None
    Model = Reaction = Metabolite = None  # type: ignore[assignment]


def _require_cobra():
    if cobra is None:
        raise RuntimeError(
            "COBRApy is not installed on the server. Install it with `uv add cobra` or `pip install cobra`."
        )


PATHWAY_LABELS = {
    "glycolysis": "Glycolysis",
    "pentose_phosphate_pathway": "Pentose Phosphate Pathway",
    "pyruvate_oxidation": "Pyruvate Oxidation",
    "krebs_cycle": "Krebs Cycle",
    "electron_transport_chain": "Electron Transport Chain",
}

UPTAKE_LABELS = {
    "glucose": ("SRC_GLC", "Glucose"),
    "oxygen": ("SRC_O2", "Oxygen"),
    "adp": ("SRC_ADP", "ADP"),
    "nad": ("SRC_NAD", "NAD+"),
    "nadp": ("SRC_NADP", "NADP+"),
    "fad": ("SRC_FAD", "FAD"),
}

KEGG_BASE_URL = "https://rest.kegg.jp"
BIOCYC_BASE_URL = "https://websvc.biocyc.org"


def _add_supply_reaction(model: Model, metabolite: Metabolite, upper_bound: float, reaction_id: str):
    reaction = Reaction(reaction_id)
    reaction.lower_bound = 0
    reaction.upper_bound = upper_bound
    reaction.add_metabolites({metabolite: 1})
    model.add_reactions([reaction])


def _add_demand_reaction(model: Model, metabolite: Metabolite, reaction_id: str):
    reaction = Reaction(reaction_id)
    reaction.lower_bound = 0
    reaction.upper_bound = 1000
    reaction.add_metabolites({metabolite: -1})
    model.add_reactions([reaction])
    return reaction


def _build_model(inputs: MetabolismSimulationRequest) -> Model:
    _require_cobra()

    model = Model("toy_metabolism")

    glc = Metabolite("glc_c", compartment="c")
    pyr = Metabolite("pyr_c", compartment="c")
    accoa = Metabolite("accoa_c", compartment="m")
    o2 = Metabolite("o2_c", compartment="m")
    adp = Metabolite("adp_c", compartment="c")
    atp = Metabolite("atp_c", compartment="c")
    nad = Metabolite("nad_c", compartment="c")
    nadh = Metabolite("nadh_c", compartment="m")
    nadp = Metabolite("nadp_c", compartment="c")
    nadph = Metabolite("nadph_c", compartment="c")
    fad = Metabolite("fad_c", compartment="m")
    fadh2 = Metabolite("fadh2_c", compartment="m")
    co2 = Metabolite("co2_c", compartment="m")
    ribose5p = Metabolite("r5p_c", compartment="c")

    _add_supply_reaction(model, glc, inputs.glucose, "SRC_GLC")
    _add_supply_reaction(model, o2, inputs.oxygen, "SRC_O2")
    _add_supply_reaction(model, adp, inputs.adp, "SRC_ADP")
    _add_supply_reaction(model, nad, inputs.nad, "SRC_NAD")
    _add_supply_reaction(model, nadp, inputs.nadp, "SRC_NADP")
    _add_supply_reaction(model, fad, inputs.fad, "SRC_FAD")

    glycolysis = Reaction("GLYCOLYSIS")
    glycolysis.lower_bound = 0
    glycolysis.upper_bound = 1000
    glycolysis.add_metabolites({
        glc: -1,
        adp: -2,
        nad: -2,
        pyr: 2,
        atp: 2,
        nadh: 2,
    })

    ppp = Reaction("PPP")
    ppp.lower_bound = 0
    ppp.upper_bound = 1000
    ppp.add_metabolites({
        glc: -1,
        nadp: -2,
        ribose5p: 1,
        nadph: 2,
        co2: 1,
    })

    pyruvate_oxidation = Reaction("PYR_OX")
    pyruvate_oxidation.lower_bound = 0
    pyruvate_oxidation.upper_bound = 1000
    pyruvate_oxidation.add_metabolites({
        pyr: -2,
        nad: -2,
        accoa: 2,
        nadh: 2,
        co2: 2,
    })

    krebs = Reaction("KREBS")
    krebs.lower_bound = 0
    krebs.upper_bound = 1000
    krebs.add_metabolites({
        accoa: -2,
        adp: -2,
        nad: -6,
        fad: -2,
        atp: 2,
        nadh: 6,
        fadh2: 2,
        co2: 4,
    })

    etc = Reaction("ETC")
    etc.lower_bound = 0
    etc.upper_bound = 1000
    etc.add_metabolites({
        nadh: -10,
        fadh2: -2,
        adp: -26,
        o2: -6,
        atp: 26,
        nad: 10,
        fad: 2,
    })

    model.add_reactions([glycolysis, ppp, pyruvate_oxidation, krebs, etc])

    atp_drain = _add_demand_reaction(model, atp, "DM_ATP")
    nadh_drain = _add_demand_reaction(model, nadh, "DM_NADH")
    nadph_drain = _add_demand_reaction(model, nadph, "DM_NADPH")
    fadh2_drain = _add_demand_reaction(model, fadh2, "DM_FADH2")
    co2_drain = _add_demand_reaction(model, co2, "DM_CO2")
    ribose_drain = _add_demand_reaction(model, ribose5p, "DM_R5P")

    model.objective = {
        atp_drain: 1.0,
        nadh_drain: 0.15 if inputs.objective_mode == "balanced" else 0.0,
        nadph_drain: 0.25 if inputs.objective_mode == "balanced" else 1.0 if inputs.objective_mode == "nadph" else 0.0,
        fadh2_drain: 0.1 if inputs.objective_mode == "balanced" else 0.0,
        ribose_drain: 0.08 if inputs.objective_mode == "balanced" else 0.2 if inputs.objective_mode == "nadph" else 0.0,
        co2_drain: 0.0,
    }

    if inputs.objective_mode == "atp":
        model.objective = atp_drain

    return model


def _fetch_text(url: str) -> str:
    logger.info("Metabolism provider request: GET %s", url)
    request = Request(
        url,
        headers={
            "Accept": "*/*",
            "User-Agent": "biomath-lab-metabolism-client/0.1",
        },
    )
    with urlopen(request, timeout=20) as response:
        return response.read().decode("utf-8")


def _fetch_json_url(url: str):
    return json.loads(_fetch_text(url))


def _search_kegg(query: str) -> list[MetabolismProviderSearchItem]:
    url = f"{KEGG_BASE_URL}/find/pathway/{quote(query)}"
    body = _fetch_text(url)
    items: list[MetabolismProviderSearchItem] = []

    for line in body.splitlines()[:12]:
        if "\t" not in line:
            continue
        entry_id, description = line.split("\t", 1)
        items.append(
            MetabolismProviderSearchItem(
                id=entry_id,
                name=description,
                source="kegg",
                summary="KEGG pathway match",
                url=f"https://www.kegg.jp/entry/{entry_id}",
            )
        )

    return items


def _search_biocyc_like(
    query: str,
    provider: MetabolismProvider,
    org_id: str,
) -> list[MetabolismProviderSearchItem]:
    url = (
        f"{BIOCYC_BASE_URL}/{org_id}/name-search?"
        + urlencode({"object": query, "class": "Pathways", "fmt": "json"})
    )
    payload = _fetch_json_url(url)
    raw_results = payload.get("RESULTS") if isinstance(payload, dict) else payload
    items: list[MetabolismProviderSearchItem] = []

    if not isinstance(raw_results, list):
        return items

    for result in raw_results[:12]:
        if not isinstance(result, dict):
            continue

        object_id = (
            result.get("ID")
            or result.get("OBJECT-ID")
            or result.get("BIOCYC-ID")
            or result.get("id")
        )
        common_name = (
            result.get("COMMON-NAME")
            or result.get("NAME")
            or result.get("name")
            or object_id
            or "Unknown pathway"
        )

        if not object_id:
            continue

        items.append(
            MetabolismProviderSearchItem(
                id=str(object_id),
                name=str(common_name),
                source=provider,
                summary="BioCyc web services pathway match" if provider == "biocyc" else "EcoCyc web services pathway match",
                url=f"https://{provider}.org/{org_id}/NEW-IMAGE?type=PATHWAY&object={quote(str(object_id))}" if provider in {"biocyc", "ecocyc"} else None,
            )
        )

    return items


def search_metabolism_provider(
    provider: MetabolismProvider,
    query: str,
) -> MetabolismProviderSearchResponse:
    normalized_query = query.strip()
    if not normalized_query:
        return MetabolismProviderSearchResponse(provider=provider, query=query, items=[])

    if provider == "kegg":
        items = _search_kegg(normalized_query)
    elif provider == "biocyc":
        items = _search_biocyc_like(normalized_query, "biocyc", "META")
    elif provider == "ecocyc":
        items = _search_biocyc_like(normalized_query, "ecocyc", "ECOLI")
    elif provider == "reactome":
        items = [
            MetabolismProviderSearchItem(
                id=item.st_id or str(item.db_id),
                name=item.name,
                source="reactome",
                summary=item.schema_class,
                url=item.url,
            )
            for item in search_pathways(normalized_query)
        ]
    else:  # pragma: no cover
        items = []

    logger.info(
        "Metabolism provider search provider=%s query=%r items=%s",
        provider,
        normalized_query,
        len(items),
    )

    return MetabolismProviderSearchResponse(
        provider=provider,
        query=normalized_query,
        items=items,
    )


def simulate_metabolism(inputs: MetabolismSimulationRequest) -> MetabolismSimulationResponse:
    logger.info(
        "Metabolism simulate start glucose=%s oxygen=%s adp=%s nad=%s nadp=%s fad=%s objective=%s",
        inputs.glucose,
        inputs.oxygen,
        inputs.adp,
        inputs.nad,
        inputs.nadp,
        inputs.fad,
        inputs.objective_mode,
    )

    model = _build_model(inputs)
    solution = model.optimize()

    if solution.status != "optimal":
        logger.warning("Metabolism optimization not optimal status=%s", solution.status)
        return MetabolismSimulationResponse(
            objective_mode=inputs.objective_mode,
            pathway_fluxes=MetabolismPathwayFluxes(
                glycolysis=0,
                pentose_phosphate_pathway=0,
                pyruvate_oxidation=0,
                krebs_cycle=0,
                electron_transport_chain=0,
            ),
            outputs=MetabolismOutputs(
                atp=0,
                nadh=0,
                nadph=0,
                fadh2=0,
                co2=0,
                ribose5p=0,
            ),
            flux_analysis=MetabolismFluxAnalysis(
                glucose_partition={
                    "glycolysis": 0,
                    "pentose_phosphate_pathway": 0,
                    "pyruvate_oxidation": 0,
                    "krebs_cycle": 0,
                    "electron_transport_chain": 0,
                },
                reaction_fluxes=[],
                yield_metrics=MetabolismYieldMetrics(
                    atp_per_glucose=0,
                    nadph_per_glucose=0,
                    nadh_per_glucose=0,
                    oxygen_utilization=0,
                ),
                dominant_pathway="None",
            ),
            flux_balance_analysis=MetabolismFluxBalanceAnalysis(
                objective_reaction="None",
                objective_sense="maximize",
                constrained_uptakes={
                    "glucose": inputs.glucose,
                    "oxygen": inputs.oxygen,
                    "adp": inputs.adp,
                    "nad": inputs.nad,
                    "nadp": inputs.nadp,
                    "fad": inputs.fad,
                },
                shadow_prices=[],
                reduced_costs=[],
            ),
            status="warning",
            solver_status=str(solution.status),
            objective_value=0,
            message="The COBRApy solver did not find an optimal steady-state solution for these inputs.",
        )

    fluxes = solution.fluxes
    pathway_fluxes = MetabolismPathwayFluxes(
        glycolysis=float(fluxes.get("GLYCOLYSIS", 0)),
        pentose_phosphate_pathway=float(fluxes.get("PPP", 0)),
        pyruvate_oxidation=float(fluxes.get("PYR_OX", 0)),
        krebs_cycle=float(fluxes.get("KREBS", 0)),
        electron_transport_chain=float(fluxes.get("ETC", 0)),
    )
    outputs = MetabolismOutputs(
        atp=float(fluxes.get("DM_ATP", 0)),
        nadh=float(fluxes.get("DM_NADH", 0)),
        nadph=float(fluxes.get("DM_NADPH", 0)),
        fadh2=float(fluxes.get("DM_FADH2", 0)),
        co2=float(fluxes.get("DM_CO2", 0)),
        ribose5p=float(fluxes.get("DM_R5P", 0)),
    )

    pathway_map = {
        "glycolysis": pathway_fluxes.glycolysis,
        "pentose_phosphate_pathway": pathway_fluxes.pentose_phosphate_pathway,
        "pyruvate_oxidation": pathway_fluxes.pyruvate_oxidation,
        "krebs_cycle": pathway_fluxes.krebs_cycle,
        "electron_transport_chain": pathway_fluxes.electron_transport_chain,
    }
    total_pathway_flux = sum(pathway_map.values())
    max_pathway_flux = max(pathway_map.values()) if pathway_map else 0.0
    glucose_flux = max(float(fluxes.get("SRC_GLC", 0)), inputs.glucose, 1e-9)
    oxygen_flux = max(float(fluxes.get("SRC_O2", 0)), inputs.oxygen, 1e-9)
    dominant_pathway = max(pathway_map, key=pathway_map.get) if pathway_map else "glycolysis"

    reaction_fluxes = [
        MetabolismFluxEntry(
            reaction_id="GLYCOLYSIS",
            label="Glycolysis",
            flux=pathway_fluxes.glycolysis,
            normalized_flux=pathway_fluxes.glycolysis / max(max_pathway_flux, 1e-9),
        ),
        MetabolismFluxEntry(
            reaction_id="PPP",
            label="PPP",
            flux=pathway_fluxes.pentose_phosphate_pathway,
            normalized_flux=pathway_fluxes.pentose_phosphate_pathway / max(max_pathway_flux, 1e-9),
        ),
        MetabolismFluxEntry(
            reaction_id="PYR_OX",
            label="Pyruvate Oxidation",
            flux=pathway_fluxes.pyruvate_oxidation,
            normalized_flux=pathway_fluxes.pyruvate_oxidation / max(max_pathway_flux, 1e-9),
        ),
        MetabolismFluxEntry(
            reaction_id="KREBS",
            label="Krebs Cycle",
            flux=pathway_fluxes.krebs_cycle,
            normalized_flux=pathway_fluxes.krebs_cycle / max(max_pathway_flux, 1e-9),
        ),
        MetabolismFluxEntry(
            reaction_id="ETC",
            label="ETC",
            flux=pathway_fluxes.electron_transport_chain,
            normalized_flux=pathway_fluxes.electron_transport_chain / max(max_pathway_flux, 1e-9),
        ),
    ]

    flux_analysis = MetabolismFluxAnalysis(
        glucose_partition={
            key: (value / total_pathway_flux if total_pathway_flux > 0 else 0.0)
            for key, value in pathway_map.items()
        },
        reaction_fluxes=reaction_fluxes,
        yield_metrics=MetabolismYieldMetrics(
            atp_per_glucose=outputs.atp / glucose_flux,
            nadph_per_glucose=outputs.nadph / glucose_flux,
            nadh_per_glucose=outputs.nadh / glucose_flux,
            oxygen_utilization=min(1.0, pathway_fluxes.electron_transport_chain * 6 / oxygen_flux),
        ),
        dominant_pathway=PATHWAY_LABELS[dominant_pathway],
    )

    shadow_prices = []
    for metabolite_id, label in (
        ("glc_c", "Glucose"),
        ("o2_c", "Oxygen"),
        ("adp_c", "ADP"),
        ("nad_c", "NAD+"),
        ("nadp_c", "NADP+"),
        ("fad_c", "FAD"),
        ("atp_c", "ATP"),
        ("nadph_c", "NADPH"),
    ):
        value = solution.shadow_prices.get(metabolite_id, 0.0)
        shadow_prices.append(
            MetabolismShadowPrice(
                metabolite_id=metabolite_id,
                label=label,
                value=float(value),
            )
        )

    reduced_costs = []
    for reaction_id, label in (
        ("GLYCOLYSIS", "Glycolysis"),
        ("PPP", "PPP"),
        ("PYR_OX", "Pyruvate Oxidation"),
        ("KREBS", "Krebs Cycle"),
        ("ETC", "ETC"),
        ("DM_ATP", "ATP Drain"),
        ("DM_NADPH", "NADPH Drain"),
    ):
        value = solution.reduced_costs.get(reaction_id, 0.0)
        reduced_costs.append(
            MetabolismReducedCost(
                reaction_id=reaction_id,
                label=label,
                value=float(value),
            )
        )

    objective_reaction = {
        "atp": "DM_ATP",
        "nadph": "Weighted NADPH objective",
        "balanced": "Weighted balanced objective",
    }[inputs.objective_mode]

    flux_balance_analysis = MetabolismFluxBalanceAnalysis(
        objective_reaction=objective_reaction,
        objective_sense="maximize",
        constrained_uptakes={
            key: getattr(inputs, key)
            for key in ("glucose", "oxygen", "adp", "nad", "nadp", "fad")
        },
        shadow_prices=shadow_prices,
        reduced_costs=reduced_costs,
    )

    response = MetabolismSimulationResponse(
        objective_mode=inputs.objective_mode,
        pathway_fluxes=pathway_fluxes,
        outputs=outputs,
        flux_analysis=flux_analysis,
        flux_balance_analysis=flux_balance_analysis,
        status="ok",
        solver_status=str(solution.status),
        objective_value=float(solution.objective_value or 0),
        message=(
            "Toy steady-state metabolic simulation solved with COBRApy. "
            "Use the sliders to see how substrate and cofactor limits redirect flux through glycolysis, PPP, Krebs, and ETC."
        ),
    )

    logger.info(
        "Metabolism simulate done objective=%s atp=%s nadh=%s nadph=%s",
        response.objective_value,
        response.outputs.atp,
        response.outputs.nadh,
        response.outputs.nadph,
    )

    return response
