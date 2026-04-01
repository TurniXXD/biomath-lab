from __future__ import annotations

import json
import os
from urllib.request import Request, urlopen


def _base_url() -> str:
    return os.getenv("PUBLICATIONS_NEWS_BASE_URL", "http://127.0.0.1:8100").rstrip("/")


def _request(path: str, method: str = "GET", payload: dict | None = None):
    data = None
    headers = {"Accept": "application/json"}

    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
        headers["Content-Type"] = "application/json"

    request = Request(f"{_base_url()}{path}", data=data, headers=headers, method=method)
    with urlopen(request, timeout=60) as response:
        return json.loads(response.read().decode("utf-8"))


def get_health():
    return _request("/health")


def search_news(payload: dict):
    return _request("/news/search", method="POST", payload=payload)


def search_latest_news(payload: dict):
    return _request("/news/latest", method="POST", payload=payload)


def run_digest(payload: dict):
    return _request("/digest/run", method="POST", payload=payload)
