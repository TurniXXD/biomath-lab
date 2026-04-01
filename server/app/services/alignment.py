from __future__ import annotations

import json
import os
from urllib.error import HTTPError
from urllib.request import Request, urlopen

from app.schemas.alignment import AlignmentAlignRequest, AlignmentAlignResponse


def _base_url() -> str:
    return os.getenv("ALIGNMENT_BASE_URL", "http://127.0.0.1:8200").rstrip("/")


def align_sequences(payload: AlignmentAlignRequest) -> AlignmentAlignResponse:
    request = Request(
        f"{_base_url()}/align",
        data=json.dumps(payload.model_dump()).encode("utf-8"),
        headers={
            "Accept": "application/json",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urlopen(request, timeout=60) as response:
            data = json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        details = exc.read().decode("utf-8", errors="ignore")
        raise RuntimeError(f"Alignment service error {exc.code}: {details}") from exc

    return AlignmentAlignResponse.model_validate(data)
