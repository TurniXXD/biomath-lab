from fastapi import APIRouter, HTTPException
from fastapi.responses import PlainTextResponse

from app.schemas.alphafold import AlphaFoldLookupRequest, AlphaFoldLookupResponse
from app.services.alphafold import fetch_prediction_pdb_text, lookup_predictions

router = APIRouter(prefix="/alphafold", tags=["alphafold"])


@router.get("/{accession}", response_model=AlphaFoldLookupResponse)
async def alphafold_lookup(accession: str):
    try:
        predictions = lookup_predictions(accession)
        normalized = accession.strip().upper()
        return {
            "accession": normalized,
            "count": len(predictions),
            "predictions": [prediction.model_dump() for prediction in predictions],
        }
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.post("/lookup", response_model=AlphaFoldLookupResponse)
async def alphafold_lookup_body(payload: AlphaFoldLookupRequest):
    try:
        predictions = lookup_predictions(payload.accession)
        normalized = payload.accession.strip().upper()
        return {
            "accession": normalized,
            "count": len(predictions),
            "predictions": [prediction.model_dump() for prediction in predictions],
        }
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.get("/{accession}/pdb")
async def alphafold_pdb(accession: str):
    try:
        _, pdb_text = fetch_prediction_pdb_text(accession)
        return PlainTextResponse(pdb_text, media_type="text/plain")
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

