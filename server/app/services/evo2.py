from __future__ import annotations

import json
import logging
import os
from typing import Any
from urllib.error import HTTPError
from urllib.request import Request, urlopen

from app.schemas.evo2 import Evo2GenerateRequest, Evo2GenerateResponse

logger = logging.getLogger(__name__)

EVO2_URL = "https://health.api.nvidia.com/v1/biology/arc/evo2-40b/generate"


def _sanitize_sequence(sequence: str) -> str:
    normalized = sequence.upper().replace("U", "T")
    return "".join(base for base in normalized if base in {"A", "C", "G", "T", "N"})


def _extract_generated_sequence(data: dict[str, Any]) -> str:
    for key in ("generated_sequence", "sequence", "generation", "text", "output"):
        value = data.get(key)
        if isinstance(value, str):
            return value
    return ""


def _normalize_numeric_series(values: Any) -> list[float]:
    if not isinstance(values, list):
        return []

    normalized: list[float] = []
    for value in values:
        if isinstance(value, (int, float)):
            normalized.append(float(value))
            continue

        if isinstance(value, dict):
            for key in ("prob", "probability", "value", "score"):
                nested = value.get(key)
                if isinstance(nested, (int, float)):
                    normalized.append(float(nested))
                    break

    return normalized


def generate_sequence(payload: Evo2GenerateRequest) -> Evo2GenerateResponse:
    api_key = os.getenv("NVIDIA_API_KEY")

    if not api_key:
        raise RuntimeError("NVIDIA_API_KEY is not set.")

    sequence = _sanitize_sequence(payload.sequence)

    if not sequence:
        raise RuntimeError("Sequence must contain DNA bases A, C, G, T, or N.")

    request_body = {
        "sequence": sequence,
        "num_tokens": payload.num_tokens,
        "temperature": payload.temperature,
        "top_k": payload.top_k,
        "enable_sampled_probs": payload.enable_sampled_probs,
        "enable_elapsed_ms_per_token": payload.enable_elapsed_ms_per_token,
    }

    logger.info("Evo2 request url=%s body=%s", EVO2_URL, request_body)

    request = Request(
        EVO2_URL,
        data=json.dumps(request_body).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        method="POST",
    )

    try:
        with urlopen(request, timeout=90) as response:
            body = response.read().decode("utf-8")
            logger.info(
                "Evo2 response status=%s bytes=%s",
                getattr(response, "status", "unknown"),
                len(body),
            )
            data = json.loads(body)
            logger.info("Evo2 response keys=%s", sorted(data.keys()))
    except HTTPError as exc:
        details = exc.read().decode("utf-8", errors="ignore")
        logger.warning(
            "Evo2 HTTP error status=%s body=%s",
            exc.code,
            details[:1000],
        )
        raise RuntimeError(f"NVIDIA Evo 2 API error {exc.code}: {details}") from exc
    except Exception as exc:
        logger.exception("Evo2 unexpected error")
        raise RuntimeError(str(exc)) from exc

    generated_sequence = _extract_generated_sequence(data)
    sampled_probs = _normalize_numeric_series(data.get("sampled_probs"))
    elapsed_ms_per_token = _normalize_numeric_series(data.get("elapsed_ms_per_token"))

    logger.info(
        "Evo2 parsed generated_length=%s sampled_probs=%s elapsed_ms_per_token=%s",
        len(generated_sequence),
        len(sampled_probs),
        len(elapsed_ms_per_token),
    )

    return Evo2GenerateResponse(
        input_sequence=sequence,
        generated_sequence=generated_sequence,
        full_sequence=f"{sequence}{generated_sequence}",
        sampled_probs=sampled_probs,
        elapsed_ms=data.get("elapsed_ms"),
        elapsed_ms_per_token=elapsed_ms_per_token,
    )
