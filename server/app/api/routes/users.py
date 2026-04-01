from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.repositories.user import upsert_user_by_email
from app.schemas.user import UserCreate, UserOut

router = APIRouter(prefix="/users", tags=["users"])


@router.post("/oauth", response_model=UserOut)
async def upsert_oauth_user(
    payload: UserCreate,
    db: AsyncSession = Depends(get_db),
):
    return await upsert_user_by_email(db, payload.email)
