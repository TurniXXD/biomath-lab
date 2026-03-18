from __future__ import annotations

from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class MatrixCell(BaseModel):
    value: str
    isPivot: Optional[bool] = None
    active: Optional[bool] = None


Matrix = List[List[MatrixCell]]


class MatrixCreate(BaseModel):
    name: Optional[str] = None
    matrix: Matrix


class MatrixUpdate(BaseModel):
    name: Optional[str] = None
    matrix: Optional[Matrix] = None


class MatrixOut(BaseModel):
    id: int
    userId: int
    name: Optional[str] = None
    matrix: Matrix
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

class MatrixListOut(BaseModel):
    items: List[MatrixOut]