from pydantic import BaseModel
from datetime import datetime


class UserCreate(BaseModel):
    email: str


class UserOut(BaseModel):
    id: int
    email: str
    updatedAt: datetime
    createdAt: datetime

    class Config:
        from_attributes = True