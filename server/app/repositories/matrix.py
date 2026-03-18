from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from app.models.matrix import MatrixRecord
from app.schemas.matrix import MatrixCreate, MatrixUpdate


const_limit_max = 200


class MatrixRepository:
    async def create(self, db: AsyncSession, payload: MatrixCreate) -> MatrixRecord:
        row = MatrixRecord(
            name=payload.name,
            matrix=payload.matrix,  # pydantic -> python structures -> JSONB ok
        )
        db.add(row)
        await db.commit()
        await db.refresh(row)
        return row

    async def get(self, db: AsyncSession, matrix_id: int) -> Optional[MatrixRecord]:
        result = await db.execute(
            select(MatrixRecord).where(MatrixRecord.id == matrix_id)
        )
        return result.scalar_one_or_none()

    async def list(
        self, db: AsyncSession, limit: int = 50, offset: int = 0
    ) -> list[MatrixRecord]:
        safe_limit = min(max(limit, 1), const_limit_max)
        safe_offset = max(offset, 0)

        result = await db.execute(
            select(MatrixRecord)
            .order_by(MatrixRecord.id.desc())
            .limit(safe_limit)
            .offset(safe_offset)
        )
        return list(result.scalars().all())

    async def update(
        self, db: AsyncSession, row: MatrixRecord, payload: MatrixUpdate
    ) -> MatrixRecord:
        if payload.name is not None:
            row.name = payload.name

        if payload.matrix is not None:
            row.matrix = payload.matrix

        await db.commit()
        await db.refresh(row)
        return row

    async def delete(self, db: AsyncSession, row: MatrixRecord) -> None:
        await db.delete(row)
        await db.commit()