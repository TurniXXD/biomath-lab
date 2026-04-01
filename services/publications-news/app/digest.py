from __future__ import annotations

from datetime import datetime
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer

from app.models import DigestRunResponse, PublicationItem, PublicationSource
from app.pubmed import load_settings, search_publications


def build_digest_pdf(
    queries: list[str],
    days: int,
    max_results_per_query: int,
    sources: list[PublicationSource],
    output_pdf_path: str | None = None,
) -> tuple[DigestRunResponse, Path]:
    settings = load_settings()
    settings.output_dir.mkdir(parents=True, exist_ok=True)

    if output_pdf_path:
        pdf_path = Path(output_pdf_path)
    else:
        timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        pdf_path = settings.output_dir / f"publications-digest-{timestamp}.pdf"

    sections: dict[str, list[PublicationItem]] = {}
    for query in queries:
        response = search_publications(
            query=query,
            days=days,
            max_results=max_results_per_query,
            sources=sources,
        )
        sections[query] = response.items

    styles = getSampleStyleSheet()
    heading = styles["Heading1"]
    subheading = styles["Heading2"]
    body = ParagraphStyle(
        "DigestBody",
        parent=styles["BodyText"],
        leading=14,
        fontSize=10,
        textColor=colors.HexColor("#1f2937"),
    )

    story = [
        Paragraph("BioMath Publications Digest", heading),
        Paragraph(
            f"Generated {datetime.now().strftime('%Y-%m-%d %H:%M')} for the last {days} day(s).",
            body,
        ),
        Spacer(1, 0.25 * inch),
    ]

    total_items = 0
    section_counts: dict[str, int] = {}
    for query, items in sections.items():
        section_counts[query] = len(items)
        total_items += len(items)
        story.append(Paragraph(query, subheading))
        if not items:
            story.append(Paragraph("No new publications found.", body))
            story.append(Spacer(1, 0.14 * inch))
            continue

        for index, item in enumerate(items, start=1):
            author_text = ", ".join(item.authors[:5]) if item.authors else "Unknown authors"
            journal_bits = [value for value in [item.journal, item.pubdate, item.doi] if value]
            journal_text = " | ".join(journal_bits)
            story.append(Paragraph(f"{index}. <b>{item.title}</b>", body))
            story.append(Paragraph(author_text, body))
            if journal_text:
                story.append(Paragraph(journal_text, body))
            story.append(Paragraph(f"Source: {item.source.upper()}", body))
            story.append(Paragraph(item.url, body))
            story.append(Spacer(1, 0.12 * inch))

        story.append(Spacer(1, 0.18 * inch))

    document = SimpleDocTemplate(str(pdf_path), pagesize=letter, topMargin=0.7 * inch)
    document.build(story)

    return (
        DigestRunResponse(
            queries=queries,
            total_items=total_items,
            output_pdf_path=str(pdf_path),
            sections={query: count for query, count in section_counts.items()},
        ),
        pdf_path,
    )
