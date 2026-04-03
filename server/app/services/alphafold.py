from __future__ import annotations

import json
import logging
import re
from html.parser import HTMLParser
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin
from urllib.request import Request, urlopen

from app.schemas.alphafold import AlphaFoldPrediction

logger = logging.getLogger(__name__)

_PDB_LINK_RE = re.compile(r'href=["\']([^"\']+\.pdb(?:\?[^"\']*)?)["\']', re.IGNORECASE)


def _normalize_accession(accession: str) -> str:
    value = accession.strip().upper()
    if not value:
        raise ValueError("Accession is required.")
    return value


def _request_json(url: str) -> Any:
    request = Request(
        url,
        headers={
            "Accept": "application/json",
            "User-Agent": "biomath-lab/0.1 (+https://alphafold.ebi.ac.uk)",
        },
    )
    logger.info("AlphaFold request JSON url=%s", url)
    with urlopen(request, timeout=60) as response:
        payload = json.loads(response.read().decode("utf-8"))
        logger.info("AlphaFold response JSON url=%s status=%s", url, response.status)
        return payload


def _request_text(url: str) -> str:
    request = Request(
        url,
        headers={
            "Accept": "text/plain, text/html;q=0.9, */*;q=0.8",
            "User-Agent": "biomath-lab/0.1 (+https://alphafold.ebi.ac.uk)",
        },
    )
    logger.info("AlphaFold request text url=%s", url)
    with urlopen(request, timeout=60) as response:
        text = response.read().decode("utf-8", errors="replace")
        logger.info("AlphaFold response text url=%s status=%s bytes=%s", url, response.status, len(text))
        return text


def _pick_value(raw: dict[str, Any], *keys: str) -> Any:
    for key in keys:
        value = raw.get(key)
        if value not in (None, "", []):
            return value
    return None


def _confidence_label(score: float | None) -> str | None:
    if score is None:
        return None
    if score >= 90:
        return "Very high"
    if score >= 70:
        return "High"
    if score >= 50:
        return "Low"
    return "Very low"


def _normalize_prediction(raw: dict[str, Any], accession: str) -> AlphaFoldPrediction:
    entry_id = _pick_value(raw, "entryId", "entry_id", "name")
    average_plddt_raw = _pick_value(raw, "averagePlddt", "average_plddt", "avgPlddt", "plddt")
    sequence_length_raw = _pick_value(raw, "sequenceLength", "sequence_length", "length")
    reviewed_raw = _pick_value(raw, "isReviewed", "reviewed", "is_reviewed")

    average_plddt = None
    if average_plddt_raw is not None:
        try:
            average_plddt = float(average_plddt_raw)
        except (TypeError, ValueError):
            average_plddt = None

    sequence_length = None
    if sequence_length_raw is not None:
        try:
            sequence_length = int(sequence_length_raw)
        except (TypeError, ValueError):
            sequence_length = None

    reviewed = None
    if reviewed_raw is not None:
        reviewed = bool(reviewed_raw)

    return AlphaFoldPrediction(
        accession=_pick_value(raw, "uniprotAccession", "accession", "uniProtAccession") or accession,
        entry_id=entry_id,
        protein_name=_pick_value(raw, "proteinName", "protein_name", "proteinDescription", "name"),
        gene_name=_pick_value(raw, "gene", "geneName", "gene_name"),
        organism_name=_pick_value(raw, "organismName", "organism_name", "sourceOrganism", "species"),
        sequence_length=sequence_length,
        average_plddt=average_plddt,
        confidence_label=_confidence_label(average_plddt),
        reviewed=reviewed,
        uniprot_url=_pick_value(raw, "uniprotUrl", "uniprot_url")
        or f"https://www.uniprot.org/uniprotkb/{accession}/entry",
        entry_url=f"https://alphafold.ebi.ac.uk/entry/{accession}",
        pdb_url=_pick_value(raw, "pdbUrl", "pdb_url"),
        cif_url=_pick_value(raw, "cifUrl", "cif_url"),
        bcif_url=_pick_value(raw, "bcifUrl", "bcif_url"),
        pae_url=_pick_value(raw, "paeDocUrl", "pae_url", "paeJsonUrl"),
        pae_image_url=_pick_value(raw, "paeImageUrl", "pae_image_url"),
        sequence=_pick_value(raw, "sequence"),
    )


def lookup_predictions(accession: str) -> list[AlphaFoldPrediction]:
    normalized = _normalize_accession(accession)
    url = f"https://alphafold.ebi.ac.uk/api/prediction/{normalized}"

    try:
        payload = _request_json(url)
    except HTTPError as exc:
        if exc.code == 404:
            logger.warning("AlphaFold prediction not found accession=%s", normalized)
            return []
        raise

    if isinstance(payload, dict):
        raw_predictions = payload.get("predictions") or payload.get("results") or [payload]
    else:
        raw_predictions = payload

    if not isinstance(raw_predictions, list):
        raw_predictions = [raw_predictions]

    predictions: list[AlphaFoldPrediction] = []
    for raw in raw_predictions:
        if isinstance(raw, dict):
            predictions.append(_normalize_prediction(raw, normalized))

    logger.info("AlphaFold normalized predictions accession=%s count=%s", normalized, len(predictions))
    return predictions


def _explicit_asset_urls(prediction: AlphaFoldPrediction) -> list[str]:
    candidates: list[str] = []
    for url in [prediction.pdb_url, prediction.cif_url, prediction.bcif_url]:
        if url and url not in candidates:
            candidates.append(url)
    return candidates


def _derived_asset_urls(prediction: AlphaFoldPrediction) -> list[str]:
    accession = prediction.accession
    entry_id = prediction.entry_id or f"AF-{accession}-F1-v4"
    return [
        f"https://alphafold.ebi.ac.uk/files/{entry_id}.pdb",
        f"https://alphafold.ebi.ac.uk/files/{entry_id}.cif",
        f"https://alphafold.ebi.ac.uk/files/{entry_id}.bcif",
        f"https://alphafold.ebi.ac.uk/files/AF-{accession}-F1-model_v4.pdb",
        f"https://alphafold.ebi.ac.uk/files/AF-{accession}-F1-model_v4.cif",
        f"https://alphafold.ebi.ac.uk/files/AF-{accession}-F1-v4.pdb",
        f"https://alphafold.ebi.ac.uk/files/AF-{accession}-F1-v4.cif",
    ]


class _LinkExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.links: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag.lower() != "a":
            return
        href = dict(attrs).get("href")
        if href and ".pdb" in href.lower():
            self.links.append(href)


def _entry_page_pdb_links(accession: str) -> list[str]:
    entry_url = f"https://alphafold.ebi.ac.uk/entry/{accession}"
    html = _request_text(entry_url)
    parser = _LinkExtractor()
    parser.feed(html)

    links: list[str] = []
    for link in parser.links:
        absolute = urljoin(entry_url, link)
        if absolute not in links:
            links.append(absolute)

    for match in _PDB_LINK_RE.findall(html):
        absolute = urljoin(entry_url, match)
        if absolute not in links:
            links.append(absolute)

    logger.info("AlphaFold entry page links accession=%s count=%s", accession, len(links))
    return links


def fetch_prediction_pdb_text(accession: str) -> tuple[AlphaFoldPrediction | None, str]:
    predictions = lookup_predictions(accession)
    prediction = predictions[0] if predictions else None
    normalized = _normalize_accession(accession)

    candidates: list[str] = []
    if prediction:
        candidates.extend(_explicit_asset_urls(prediction))

    try:
        candidates.extend(_entry_page_pdb_links(normalized))
    except (HTTPError, URLError) as exc:
        logger.warning("AlphaFold entry page lookup failed accession=%s error=%s", normalized, exc)

    if prediction:
        candidates.extend(_derived_asset_urls(prediction))

    seen: set[str] = set()
    for url in candidates:
        if url in seen:
            continue
        seen.add(url)

        try:
            text = _request_text(url)
        except HTTPError as exc:
            logger.warning("AlphaFold asset request failed accession=%s url=%s status=%s", normalized, url, exc.code)
            continue

        if "ATOM" in text or "HEADER" in text:
            logger.info("AlphaFold PDB resolved accession=%s url=%s", normalized, url)
            return prediction, text

    raise FileNotFoundError(f"No AlphaFold PDB file found for {normalized}.")
