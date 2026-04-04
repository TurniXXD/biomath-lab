from typing import Any

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.core.auth import verify_token
from app.db.session import get_db
from app.repositories.user import upsert_user_by_email
from sqlalchemy.ext.asyncio import AsyncSession

security = HTTPBearer(auto_error=False)

NEXTAUTH_COOKIE_NAMES = (
    "__Secure-next-auth.session-token",
    "next-auth.session-token",
)


def extract_session_token(request: Request) -> str | None:
    for cookie_name in NEXTAUTH_COOKIE_NAMES:
        token = request.cookies.get(cookie_name)
        if token:
            return token
    return None


async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    token = credentials.credentials if credentials is not None else None
    if not token:
        token = extract_session_token(request)

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    payload = verify_token(token)

    email = payload.get("email")
    if isinstance(email, str) and email.strip():
        user = await upsert_user_by_email(db, email)
        payload["userId"] = str(user.id)

    return payload
