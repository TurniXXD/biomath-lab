from __future__ import annotations

import os
import sys
from pathlib import Path


os.environ.setdefault(
    "DATABASE_URL",
    "postgresql+asyncpg://app:app@localhost:5432/app",
)
os.environ.setdefault("NEXTAUTH_SECRET", "test-secret")

SERVER_ROOT = Path(__file__).resolve().parents[1]
if str(SERVER_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVER_ROOT))
