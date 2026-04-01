from __future__ import annotations

from app.schemas.alphafold import AlphaFoldPrediction
from app.services import alphafold


def test_lookup_predictions_normalizes_alpha_fold_payload(monkeypatch):
    def fake_request_json(url: str):
        assert url == "https://alphafold.ebi.ac.uk/api/prediction/P69905"
        return [
            {
                "entryId": "AF-P69905-F1-v4",
                "proteinName": "Hemoglobin subunit alpha",
                "gene": "HBA1",
                "organismName": "Homo sapiens",
                "sequenceLength": "142",
                "averagePlddt": "93.4",
                "isReviewed": True,
                "sequence": "MAL...",
            }
        ]

    monkeypatch.setattr(alphafold, "_request_json", fake_request_json)

    predictions = alphafold.lookup_predictions("p69905")

    assert len(predictions) == 1
    prediction = predictions[0]
    assert prediction.accession == "P69905"
    assert prediction.entry_id == "AF-P69905-F1-v4"
    assert prediction.protein_name == "Hemoglobin subunit alpha"
    assert prediction.gene_name == "HBA1"
    assert prediction.organism_name == "Homo sapiens"
    assert prediction.sequence_length == 142
    assert prediction.average_plddt == 93.4
    assert prediction.confidence_label == "Very high"
    assert prediction.reviewed is True
    assert prediction.sequence == "MAL..."


def test_fetch_prediction_pdb_text_uses_entry_page_fallback(monkeypatch):
    monkeypatch.setattr(
        alphafold,
        "lookup_predictions",
        lambda accession: [
            AlphaFoldPrediction(
                accession=accession.upper(),
                protein_name="Hemoglobin subunit alpha",
            )
        ],
    )

    def fake_request_text(url: str):
        if url == "https://alphafold.ebi.ac.uk/entry/P69905":
            return '<a href="/files/AF-P69905-F1-model_v4.pdb">PDB</a>'
        if url == "https://alphafold.ebi.ac.uk/files/AF-P69905-F1-model_v4.pdb":
            return "HEADER    ALPHAFOLD MODEL\nATOM      1  N   MET A   1      1.000   2.000   3.000\nEND"
        raise AssertionError(f"Unexpected URL: {url}")

    monkeypatch.setattr(alphafold, "_request_text", fake_request_text)

    prediction, pdb_text = alphafold.fetch_prediction_pdb_text("P69905")

    assert prediction is not None
    assert prediction.accession == "P69905"
    assert "ATOM" in pdb_text
