from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.dna_sequence import DNASequenceRecord
from app.models.user import User
from app.schemas.dna_sequence import DNASequenceCreate
from app.repositories.user import upsert_user_by_email


class DNASequenceRepository:
    async def create(
        self,
        db: AsyncSession,
        payload: DNASequenceCreate,
    ) -> DNASequenceRecord:
        user = await upsert_user_by_email(db, payload.email)

        row = DNASequenceRecord(
            user_id=user.id,
            name=payload.name,
            sequence=payload.sequence,
            source=payload.source,
        )
        db.add(row)
        await db.commit()
        await db.refresh(row)
        return row

    async def latest_for_email(
        self,
        db: AsyncSession,
        email: str,
    ) -> Optional[DNASequenceRecord]:
        result = await db.execute(
            select(User).where(User.email == email.strip().lower())
        )
        user = result.scalar_one_or_none()

        if user is None:
            return None

        result = await db.execute(
            select(DNASequenceRecord)
            .where(DNASequenceRecord.user_id == user.id)
            .order_by(DNASequenceRecord.updated_at.desc(), DNASequenceRecord.id.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()
