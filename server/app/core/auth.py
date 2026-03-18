from typing import Any, Dict

import os
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError

security = HTTPBearer()

NEXTAUTH_SECRET = os.getenv("NEXTAUTH_SECRET")
ALGORITHM = "HS256"  # must match NextAuth


def verify_token(token: str) -> Dict[str, Any]:
    if not NEXTAUTH_SECRET:
        raise RuntimeError("NEXTAUTH_SECRET is not set")

    try:
        payload = jwt.decode(token, NEXTAUTH_SECRET, algorithms=[ALGORITHM])
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        ) from e

    if not isinstance(payload, dict):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    return payload


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> Dict[str, Any]:
    token = credentials.credentials
    return verify_token(token)