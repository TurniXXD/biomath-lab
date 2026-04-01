from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.repositories.dna_sequence import DNASequenceRepository
from app.schemas.dna_sequence import (
    DNASequenceCreate,
    DNASequenceLatestOut,
    DNASequenceOut,
)

router = APIRouter(prefix="/dna-sequences", tags=["dna-sequences"])
repo = DNASequenceRepository()


@router.post("", response_model=DNASequenceOut)
async def save_dna_sequence(
    payload: DNASequenceCreate,
    db: AsyncSession = Depends(get_db),
):
    row = await repo.create(db, payload)

    return DNASequenceOut(
        id=row.id,
        name=row.name,
        sequence=row.sequence,
        source=row.source,
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


@router.get("/latest", response_model=DNASequenceLatestOut)
async def get_latest_dna_sequence(
    email: str,
    db: AsyncSession = Depends(get_db),
):
    row = await repo.latest_for_email(db, email)

    if row is None:
        return DNASequenceLatestOut(sequence=None)

    return DNASequenceLatestOut(
        sequence=DNASequenceOut(
            id=row.id,
            name=row.name,
            sequence=row.sequence,
            source=row.source,
            created_at=row.created_at,
            updated_at=row.updated_at,
        )
    )
