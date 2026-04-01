from __future__ import annotations

import os


os.environ.setdefault(
    "DATABASE_URL",
    "postgresql+asyncpg://app:app@localhost:5432/app",
)
os.environ.setdefault("NEXTAUTH_SECRET", "test-secret")

