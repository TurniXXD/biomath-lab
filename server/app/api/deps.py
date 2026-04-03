from typing import Any

from fastapi import Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.core.auth import verify_token
from app.db.session import get_db
from app.repositories.user import upsert_user_by_email
from sqlalchemy.ext.asyncio import AsyncSession

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    token = credentials.credentials
    payload = verify_token(token)

    email = payload.get("email")
    if isinstance(email, str) and email.strip():
        user = await upsert_user_by_email(db, email)
        payload["userId"] = str(user.id)

    return payload
