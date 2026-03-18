from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.matrix import (
    MatrixCreate,
    MatrixUpdate,
    MatrixOut,
    MatrixListOut,
)
from app.repositories.matrix import MatrixRepository

router = APIRouter(prefix="/matrices", tags=["matrices"])
repo = MatrixRepository()


@router.post("", response_model=MatrixOut, status_code=status.HTTP_201_CREATED)
async def create_matrix(
    payload: MatrixCreate,
    db: AsyncSession = Depends(get_db),
):
    row = await repo.create(db, payload)

    return MatrixOut(
        id=row.id,
        name=row.name,
        matrix=row.matrix,
        createdAt=row.created_at,
        updatedAt=row.updated_at,
    )


@router.get("", response_model=MatrixListOut)
async def list_matrices(
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):
    rows = await repo.list(db, limit=limit, offset=offset)

    return MatrixListOut(
        items=[
            MatrixOut(
                id=r.id,
                name=r.name,
                matrix=r.matrix,
                createdAt=r.created_at,
                updatedAt=r.updated_at,
            )
            for r in rows
        ]
    )


@router.get("/{matrix_id}", response_model=MatrixOut)
async def get_matrix(
    matrix_id: int,
    db: AsyncSession = Depends(get_db),
):
    row = await repo.get(db, matrix_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Matrix not found")

    return MatrixOut(
        id=row.id,
        name=row.name,
        matrix=row.matrix,
        createdAt=row.created_at,
        updatedAt=row.updated_at,
    )


@router.patch("/{matrix_id}", response_model=MatrixOut)
async def update_matrix(
    matrix_id: int,
    payload: MatrixUpdate,
    db: AsyncSession = Depends(get_db),
):
    row = await repo.get(db, matrix_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Matrix not found")

    updated = await repo.update(db, row, payload)

    return MatrixOut(
        id=updated.id,
        name=updated.name,
        matrix=updated.matrix,
        createdAt=updated.created_at,
        updatedAt=updated.updated_at,
    )


@router.delete("/{matrix_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_matrix(
    matrix_id: int,
    db: AsyncSession = Depends(get_db),
):
    row = await repo.get(db, matrix_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Matrix not found")

    await repo.delete(db, row)
    return None