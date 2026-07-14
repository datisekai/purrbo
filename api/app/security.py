"""JWT — ký & giải token phiên (giống McUp)."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

import jwt

from api.app.config import settings


def create_token(user_id: str, days: int = 30) -> str:
    payload = {
        "sub": user_id,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(days=days),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_alg)


def decode_token(token: str) -> str | None:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_alg])
        return payload.get("sub")
    except jwt.PyJWTError:
        return None


def create_admin_token(hours: int = 12) -> str:
    payload = {
        "adm": True,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(hours=hours),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_alg)


def verify_admin_token(token: str) -> bool:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_alg])
        return bool(payload.get("adm"))
    except jwt.PyJWTError:
        return False
