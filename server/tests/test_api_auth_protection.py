from __future__ import annotations

from app.main import app


def _dependency_calls(route) -> list[object]:
    calls: list[object] = []

    def walk(dependant) -> None:
        for dep in getattr(dependant, "dependencies", []):
            calls.append(dep.call)
            walk(dep)

    walk(route.dependant)
    return calls


def _route_for(path: str):
    for route in app.routes:
        if getattr(route, "path", None) == path:
            return route
    raise AssertionError(f"Route not found: {path}")


def _has_get_current_user(route) -> bool:
    return any(
        getattr(call, "__name__", None) == "get_current_user"
        for call in _dependency_calls(route)
    )


def test_protected_routes_require_auth():
    protected_paths = [
        "/search/",
        "/matrices",
        "/alphafold/{accession}",
        "/alphafold/lookup",
        "/alphafold/{accession}/pdb",
        "/alignment/align",
        "/dna-sequences",
        "/dna-sequences/latest",
        "/reactome/search",
        "/reactome/pathways/{reactome_id}",
        "/reactome/reactions/{reactome_id}",
        "/reactome/entities/{entity_id}/neighbors",
        "/reactome/analyze-goal",
        "/evo2/generate",
        "/metabolism/simulate",
        "/metabolism/providers/{provider}/search",
        "/publications-news/search",
        "/publications-news/latest",
        "/publications-news/digest/run",
        "/user",
    ]

    for path in protected_paths:
        route = _route_for(path)
        assert _has_get_current_user(route), path


def test_public_routes_do_not_require_auth():
    public_paths = [
        "/health",
        "/users/oauth",
    ]

    for path in public_paths:
        route = _route_for(path)
        assert not _has_get_current_user(route), path
