from __future__ import annotations

from app.services import publications_news


def test_search_latest_news_proxies_payload(monkeypatch):
    captured: dict[str, object] = {}

    def fake_request(path: str, method: str = "GET", payload: dict | None = None):
        captured["path"] = path
        captured["method"] = method
        captured["payload"] = payload
        return {"ok": True}

    monkeypatch.setattr(publications_news, "_request", fake_request)

    result = publications_news.search_latest_news(
        {
            "query": "glycolysis",
            "day_offset": 1,
            "max_results_per_source": 5,
            "sources": ["pubmed", "europepmc"],
        }
    )

    assert result == {"ok": True}
    assert captured["path"] == "/news/latest"
    assert captured["method"] == "POST"
    assert captured["payload"] == {
        "query": "glycolysis",
        "day_offset": 1,
        "max_results_per_source": 5,
        "sources": ["pubmed", "europepmc"],
    }
