from __future__ import annotations

import argparse

from app.digest import build_digest_pdf
from app.emailer import send_pdf_to_kindle


def main():
    parser = argparse.ArgumentParser(description="Publications digest CLI")
    subparsers = parser.add_subparsers(dest="command", required=True)

    run_digest = subparsers.add_parser("run-digest")
    run_digest.add_argument("--query", action="append", required=True, dest="queries")
    run_digest.add_argument("--days", type=int, default=1)
    run_digest.add_argument("--max-results-per-query", type=int, default=15)
    run_digest.add_argument(
        "--source",
        action="append",
        dest="sources",
        default=["pubmed", "europepmc"],
    )
    run_digest.add_argument("--send-kindle", action="store_true")
    run_digest.add_argument("--output-pdf-path")

    args = parser.parse_args()

    if args.command == "run-digest":
        response, pdf_path = build_digest_pdf(
            queries=args.queries,
            days=args.days,
            max_results_per_query=args.max_results_per_query,
            sources=args.sources,
            output_pdf_path=args.output_pdf_path,
        )
        if args.send_kindle:
            response.emailed_to = send_pdf_to_kindle(pdf_path)
        print(response.model_dump_json(indent=2))


if __name__ == "__main__":
    main()
