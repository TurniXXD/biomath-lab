from __future__ import annotations

import json
import os
from datetime import date, timedelta
from urllib.parse import quote, urlencode
from urllib.request import Request, urlopen

from app.models import (
    LatestNewsResponse,
    NewsSearchResponse,
    PublicationItem,
    PublicationSource,
    ServiceSettings,
)

EUTILS_BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"
EUROPE_PMC_BASE = "https://www.ebi.ac.uk/europepmc/webservices/rest/search"


def load_settings() -> ServiceSettings:
    output_dir = os.getenv(
        "PUBLICATIONS_NEWS_OUTPUT_DIR",
        "/Users/teapot/work/test/biomath-lab/services/publications-news/output",
    )
    return ServiceSettings(
        pubmed_tool=os.getenv("PUBMED_TOOL", "biomath-publications-news"),
        pubmed_email=os.getenv("PUBMED_EMAIL"),
        smtp_host=os.getenv("SMTP_HOST"),
        smtp_port=int(os.getenv("SMTP_PORT", "587")),
        smtp_username=os.getenv("SMTP_USERNAME"),
        smtp_password=os.getenv("SMTP_PASSWORD"),
        smtp_use_tls=os.getenv("SMTP_USE_TLS", "true").lower() != "false",
        kindle_recipient=os.getenv("KINDLE_RECIPIENT"),
        kindle_sender=os.getenv("KINDLE_SENDER"),
        output_dir=output_dir,
    )


def _fetch_json(url: str):
    request = Request(
        url,
        headers={
            "Accept": "application/json",
            "User-Agent": "biomath-publications-news/0.1",
        },
    )
    with urlopen(request, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))


def _date_window(days: int = 1, day_offset: int = 0) -> tuple[date, date]:
    end_date = date.today() - timedelta(days=day_offset)
    start_date = end_date - timedelta(days=max(0, days - 1))
    return start_date, end_date


def _pubmed_term(query: str) -> str:
    normalized = query.strip()
    return normalized if normalized else "all[sb]"


def _search_pubmed_window(
    query: str,
    start_date: date,
    end_date: date,
    max_results: int,
) -> list[PublicationItem]:
    settings = load_settings()

    search_params = {
        "db": "pubmed",
        "term": _pubmed_term(query),
        "sort": "pub+date",
        "retmax": str(max_results),
        "retmode": "json",
        "datetype": "pdat",
        "mindate": start_date.isoformat(),
        "maxdate": end_date.isoformat(),
        "tool": settings.pubmed_tool,
    }
    if settings.pubmed_email:
        search_params["email"] = settings.pubmed_email

    search_url = f"{EUTILS_BASE}/esearch.fcgi?{urlencode(search_params)}"
    search_payload = _fetch_json(search_url)
    ids = search_payload.get("esearchresult", {}).get("idlist", [])

    if not ids:
        return []

    summary_params = {
        "db": "pubmed",
        "id": ",".join(ids),
        "retmode": "json",
        "tool": settings.pubmed_tool,
    }
    if settings.pubmed_email:
        summary_params["email"] = settings.pubmed_email

    summary_url = f"{EUTILS_BASE}/esummary.fcgi?{urlencode(summary_params)}"
    summary_payload = _fetch_json(summary_url).get("result", {})

    items: list[PublicationItem] = []
    for pmid in ids:
        raw = summary_payload.get(pmid, {})
        article_ids = raw.get("articleids", []) or []
        doi = next(
            (
                article_id.get("value")
                for article_id in article_ids
                if article_id.get("idtype") == "doi"
            ),
            None,
        )
        authors = [author.get("name", "") for author in (raw.get("authors") or []) if author.get("name")]
        items.append(
            PublicationItem(
                pmid=pmid,
                title=raw.get("title") or "Untitled article",
                authors=authors[:8],
                journal=raw.get("fulljournalname") or raw.get("source"),
                pubdate=raw.get("pubdate"),
                doi=doi,
                url=f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/",
                source="pubmed",
            )
        )

    return items


def _search_europepmc_window(
    query: str,
    start_date: date,
    end_date: date,
    max_results: int,
) -> list[PublicationItem]:
    date_clause = f"FIRST_PDATE:[{start_date.isoformat()} TO {end_date.isoformat()}]"
    normalized_query = query.strip()
    full_query = date_clause if not normalized_query else f"({normalized_query}) AND {date_clause}"
    url = (
        f"{EUROPE_PMC_BASE}?query={quote(full_query)}&format=json&pageSize={max_results}&sort_date:y"
    )

    payload = _fetch_json(url)
    results = payload.get("resultList", {}).get("result", []) or []
    items: list[PublicationItem] = []

    for raw in results[:max_results]:
        pmid = str(raw.get("pmid") or raw.get("id") or "")
        doi = raw.get("doi")
        authors = [author.strip() for author in (raw.get("authorString") or "").split(",") if author.strip()]
        items.append(
            PublicationItem(
                pmid=pmid or str(raw.get("id") or "unknown"),
                title=raw.get("title") or "Untitled article",
                authors=authors[:8],
                journal=raw.get("journalTitle"),
                pubdate=raw.get("firstPublicationDate") or raw.get("pubYear"),
                doi=doi,
                url=f"https://europepmc.org/article/MED/{pmid}" if pmid else "https://europepmc.org",
                source="europepmc",
            )
        )

    return items


def search_source(
    source: PublicationSource,
    query: str,
    start_date: date,
    end_date: date,
    max_results: int,
) -> list[PublicationItem]:
    if source == "pubmed":
        return _search_pubmed_window(query, start_date, end_date, max_results)
    if source == "europepmc":
        return _search_europepmc_window(query, start_date, end_date, max_results)
    return []


def search_publications(
    query: str = "",
    days: int = 1,
    max_results: int = 20,
    sources: list[PublicationSource] | None = None,
) -> NewsSearchResponse:
    selected_sources = sources or ["pubmed", "europepmc"]
    start_date, end_date = _date_window(days=days, day_offset=0)

    items: list[PublicationItem] = []
    for source in selected_sources:
        items.extend(
            search_source(
                source=source,
                query=query,
                start_date=start_date,
                end_date=end_date,
                max_results=max_results,
            )
        )

    items.sort(key=lambda item: item.pubdate or "", reverse=True)
    return NewsSearchResponse(query=query, days=days, count=len(items), items=items)


def latest_publications(
    query: str = "",
    day_offset: int = 0,
    max_results_per_source: int = 12,
    sources: list[PublicationSource] | None = None,
) -> LatestNewsResponse:
    selected_sources = sources or ["pubmed", "europepmc"]
    start_date, end_date = _date_window(days=1, day_offset=day_offset)

    groups: dict[PublicationSource, list[PublicationItem]] = {}
    total_count = 0
    for source in selected_sources:
        items = search_source(
            source=source,
            query=query,
            start_date=start_date,
            end_date=end_date,
            max_results=max_results_per_source,
        )
        groups[source] = items
        total_count += len(items)

    return LatestNewsResponse(
        query=query,
        day_offset=day_offset,
        date_label=end_date.isoformat(),
        total_count=total_count,
        groups=groups,
    )
