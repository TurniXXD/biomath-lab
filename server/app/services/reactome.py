from __future__ import annotations

import json
import logging
import re
from typing import Any, Dict, List, Optional
from urllib.error import HTTPError
from urllib.parse import quote, urlencode
from urllib.request import Request, urlopen

from app.schemas.reactome import (
    ReactomeAnalyzeGoalResponse,
    ReactomeNeighborsResponse,
    ReactomePathwayDetails,
    ReactomeReactionDetails,
    ReactomeReferenceItem,
    ReactomeSearchItem,
)

REACTOME_BASE_URL = "https://reactome.org/ContentService"
logger = logging.getLogger(__name__)


def _fetch_json(path: str, params: Optional[Dict[str, str]] = None) -> Any:
    url = f"{REACTOME_BASE_URL}{path}"

    if params:
        url = f"{url}?{urlencode(params)}"

    logger.info("Reactome request: GET %s", url)

    request = Request(
        url,
        headers={
            "Accept": "application/json",
            "User-Agent": "biomath-lab-reactome-client/0.1",
        },
    )

    try:
        with urlopen(request, timeout=20) as response:
            body = response.read().decode("utf-8")
            logger.info(
                "Reactome response: %s status=%s bytes=%s",
                url,
                getattr(response, "status", "unknown"),
                len(body),
            )
            return json.loads(body)
    except HTTPError as exc:
        logger.warning("Reactome HTTP error: %s status=%s", url, exc.code)
        raise
    except Exception:
        logger.exception("Reactome unexpected error for %s", url)
        raise


def _as_reference_item(payload: Dict[str, Any]) -> ReactomeReferenceItem:
    return ReactomeReferenceItem(
        db_id=payload.get("dbId"),
        st_id=payload.get("stId"),
        name=payload.get("displayName") or payload.get("name") or "Unknown",
        schema_class=payload.get("schemaClass"),
    )


def _summary_from_payload(payload: Dict[str, Any]) -> Optional[str]:
    summation = payload.get("summation") or []

    if summation and isinstance(summation, list):
        first = summation[0] or {}
        return first.get("text")

    return None


def _flatten_search_results(payload: Any) -> List[Dict[str, Any]]:
    if isinstance(payload, dict):
        results = payload.get("results")

        if isinstance(results, list):
            flattened: List[Dict[str, Any]] = []

            for item in results:
                if isinstance(item, dict) and isinstance(item.get("entries"), list):
                    flattened.extend(
                        [entry for entry in item["entries"] if isinstance(entry, dict)]
                    )
                elif isinstance(item, dict):
                    flattened.append(item)

            return flattened

        for key in ("entries", "pathways"):
            raw = payload.get(key)
            if isinstance(raw, list):
                return [item for item in raw if isinstance(item, dict)]

    if isinstance(payload, list):
        return [item for item in payload if isinstance(item, dict)]

    return []


def _reactome_search_url(query: str, species: str) -> str:
    return _reactome_search_url_with_types(query, species, ["Pathway"])


def _reactome_search_url_with_types(
    query: str,
    species: str,
    types: List[str],
) -> str:
    encoded_query = re.sub(r"\s", "%20", query.strip())
    encoded_species = re.sub(r"\s", "%20", species.strip())
    base = (
        f"{REACTOME_BASE_URL}/search/query"
        f"?query={encoded_query}"
        f"&species={encoded_species}"
        f"&cluster=true"
        f"&Start%20row=0"
        f"&rows=10"
    )

    for item in types:
        base = f"{base}&types={re.sub(r'\s+', '%20', item)}"

    return base


def search_pathways(query: str, species: str = "Homo sapiens") -> List[ReactomeSearchItem]:
    return search_items(query=query, species=species, types=["Pathway"])


def search_items(
    query: str,
    species: str = "Homo sapiens",
    types: Optional[List[str]] = None,
) -> List[ReactomeSearchItem]:
    url = _reactome_search_url_with_types(query, species, types or [])
    logger.info(
        "Reactome search_items start query=%r species=%r types=%s url=%s",
        query,
        species,
        types or [],
        url,
    )

    request = Request(
        url,
        headers={
            "Accept": "application/json",
            "User-Agent": "biomath-lab-reactome-client/0.1",
        },
    )

    try:
        with urlopen(request, timeout=20) as response:
            body = response.read().decode("utf-8")
            logger.info(
                "Reactome search_items response status=%s bytes=%s",
                getattr(response, "status", "unknown"),
                len(body),
            )
            payload = json.loads(body)
    except HTTPError as exc:
        if exc.code == 404:
            logger.warning("Reactome search_items 404 for url=%s", url)
            return []
        logger.warning("Reactome search_items HTTP error url=%s status=%s", url, exc.code)
        raise
    except Exception:
        logger.exception("Reactome search_items unexpected error url=%s", url)
        raise

    raw_results = _flatten_search_results(payload)
    logger.info(
        "Reactome search_items parsed raw_results=%s top_level_keys=%s",
        len(raw_results),
        list(payload.keys())[:12] if isinstance(payload, dict) else type(payload).__name__,
    )

    items: List[ReactomeSearchItem] = []

    for raw in raw_results[:10]:
        items.append(
            ReactomeSearchItem(
                db_id=raw.get("dbId"),
                st_id=raw.get("stId") or raw.get("identifier"),
                name=raw.get("name") or raw.get("displayName") or "Unknown pathway",
                species=(
                    raw.get("speciesName")
                    or (raw.get("species")[0] if isinstance(raw.get("species"), list) and raw.get("species") else raw.get("species"))
                ),
                schema_class=raw.get("schemaClass") or raw.get("exactType") or raw.get("type"),
                url=raw.get("url"),
            )
        )

    logger.info("Reactome search_items normalized items=%s", len(items))
    return items


def get_pathway_details(reactome_id: str) -> ReactomePathwayDetails:
    logger.info("Reactome get_pathway_details start reactome_id=%s", reactome_id)
    details = _fetch_json(f"/data/query/enhanced/{quote(reactome_id, safe='')}")
    contained_events = _fetch_json(f"/data/pathway/{quote(reactome_id, safe='')}/containedEvents")
    participants = []

    try:
        participants = _fetch_json(
            f"/data/event/{quote(reactome_id, safe='')}/participatingPhysicalEntities"
        )
    except HTTPError as exc:
        if exc.code == 404:
            logger.warning(
                "Reactome get_pathway_details participants endpoint missing for reactome_id=%s",
                reactome_id,
            )
        else:
            raise

    logger.info(
        "Reactome get_pathway_details parsed reactome_id=%s contained_events=%s participants=%s",
        reactome_id,
        len(contained_events or []),
        len(participants or []),
    )

    return ReactomePathwayDetails(
        db_id=details.get("dbId"),
        st_id=details.get("stId"),
        display_name=details.get("displayName") or reactome_id,
        schema_class=details.get("schemaClass"),
        species=details.get("speciesName"),
        summary=_summary_from_payload(details),
        literature_count=len(details.get("literatureReference") or []),
        contained_events=[
            _as_reference_item(item) for item in (contained_events or [])[:20]
        ],
        participants=[_as_reference_item(item) for item in (participants or [])[:20]],
    )


def get_reaction_details(reactome_id: str) -> ReactomeReactionDetails:
    logger.info("Reactome get_reaction_details start reactome_id=%s", reactome_id)
    details = _fetch_json(f"/data/query/enhanced/{quote(reactome_id, safe='')}")

    logger.info(
        "Reactome get_reaction_details parsed reactome_id=%s inputs=%s outputs=%s catalysts=%s",
        reactome_id,
        len(details.get("input") or []),
        len(details.get("output") or []),
        len(details.get("catalystActivity") or []),
    )

    return ReactomeReactionDetails(
        db_id=details.get("dbId"),
        st_id=details.get("stId"),
        display_name=details.get("displayName") or reactome_id,
        schema_class=details.get("schemaClass"),
        species=details.get("speciesName"),
        summary=_summary_from_payload(details),
        inputs=[_as_reference_item(item) for item in (details.get("input") or [])[:10]],
        outputs=[_as_reference_item(item) for item in (details.get("output") or [])[:10]],
        catalysts=[
            _as_reference_item(item) for item in (details.get("catalystActivity") or [])[:10]
        ],
    )


def get_neighbors(entity_id: str) -> ReactomeNeighborsResponse:
    logger.info("Reactome get_neighbors start entity_id=%s", entity_id)
    entity = _fetch_json(f"/data/query/{quote(entity_id, safe='')}")
    pathways = _fetch_json(f"/data/entity/{quote(entity_id, safe='')}/pathways")
    reactions = _fetch_json(f"/data/entity/{quote(entity_id, safe='')}/reactions")

    logger.info(
        "Reactome get_neighbors parsed entity_id=%s pathways=%s reactions=%s",
        entity_id,
        len(pathways or []),
        len(reactions or []),
    )

    return ReactomeNeighborsResponse(
        entity_id=entity_id,
        entity_name=entity.get("displayName"),
        pathways=[_as_reference_item(item) for item in (pathways or [])[:20]],
        reactions=[_as_reference_item(item) for item in (reactions or [])[:20]],
    )


def analyze_goal(
    organism: str,
    target_metabolite: str,
    goal: str,
    model_type: str,
) -> ReactomeAnalyzeGoalResponse:
    logger.info(
        "Reactome analyze_goal start organism=%r target=%r goal=%r model_type=%r",
        organism,
        target_metabolite,
        goal,
        model_type,
    )
    hits = search_pathways(target_metabolite, species=organism)
    top_pathway = None
    reactions: List[ReactomeReactionDetails] = []

    logger.info("Reactome analyze_goal pathway hits=%s", len(hits))

    if hits:
        top_identifier = hits[0].st_id or (str(hits[0].db_id) if hits[0].db_id else None)
        logger.info("Reactome analyze_goal top pathway identifier=%s", top_identifier)

        if top_identifier:
            top_pathway = get_pathway_details(top_identifier)

    if not hits:
        logger.info("Reactome analyze_goal falling back to entity search")
        entity_hits = search_items(
            target_metabolite,
            species=organism,
            types=["Chemical Compound", "Complex", "Protein", "Set"],
        )

        logger.info("Reactome analyze_goal entity hits=%s", len(entity_hits))

        if entity_hits:
            entity_identifier = entity_hits[0].st_id or (
                str(entity_hits[0].db_id) if entity_hits[0].db_id else None
            )
            logger.info("Reactome analyze_goal top entity identifier=%s", entity_identifier)

            if entity_identifier:
                neighbors = get_neighbors(entity_identifier)
                logger.info(
                    "Reactome analyze_goal neighbor pathways=%s neighbor reactions=%s",
                    len(neighbors.pathways),
                    len(neighbors.reactions),
                )
                hits = [
                    ReactomeSearchItem(
                        db_id=item.db_id,
                        st_id=item.st_id,
                        name=item.name,
                        schema_class=item.schema_class,
                        species=organism,
                    )
                    for item in neighbors.pathways
                ]

                if hits:
                    top_identifier = hits[0].st_id or (
                        str(hits[0].db_id) if hits[0].db_id else None
                    )
                    logger.info(
                        "Reactome analyze_goal top pathway identifier from neighbors=%s",
                        top_identifier,
                    )

                    if top_identifier:
                        top_pathway = get_pathway_details(top_identifier)


    if top_pathway:
        for event in top_pathway.contained_events[:5]:
            if not event.st_id:
                logger.info(
                    "Reactome analyze_goal skipping contained event without st_id name=%r",
                    event.name,
                )
                continue

            try:
                reactions.append(get_reaction_details(event.st_id))
            except Exception:
                logger.exception(
                    "Reactome analyze_goal failed to fetch reaction details st_id=%s",
                    event.st_id,
                )
                continue

    if top_pathway:
        narrative = (
            f"For {organism}, the strongest Reactome match for '{target_metabolite}' is "
            f"'{top_pathway.display_name}'. To support the goal '{goal}', inspect the "
            f"contained reactions and participants in that pathway first, then trace "
            f"upstream/downstream entities for intervention points."
        )
    else:
        narrative = (
            f"No clear Reactome pathway hit was found for '{target_metabolite}' in "
            f"{organism}. Refine the target name, identifier, or organism and retry."
        )

    logger.info(
        "Reactome analyze_goal done hits=%s top_pathway=%s reactions=%s",
        len(hits),
        top_pathway.display_name if top_pathway else None,
        len(reactions),
    )
    return ReactomeAnalyzeGoalResponse(
        organism=organism,
        target_metabolite=target_metabolite,
        goal=goal,
        model_type=model_type,
        narrative=narrative,
        pathway_hits=hits,
        top_pathway=top_pathway,
        reactions=reactions,
    )
