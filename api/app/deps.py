"""Dependencies dùng chung — auth JWT + DialoguePort singleton."""
from __future__ import annotations

from functools import lru_cache

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from adapters.billing_factory import make_billing
from adapters.calendar_factory import make_calendar
from adapters.dialogue_factory import make_dialogue
from adapters.memory_factory import make_memory
from adapters.nlp_factory import make_schedule
from api.app.security import decode_token
from domain.ports import BillingPort, CalendarPort, DialoguePort, MemoryPort, SchedulePort

_bearer = HTTPBearer(auto_error=True)


async def get_current_user(cred: HTTPAuthorizationCredentials = Depends(_bearer)) -> str:
    """Trả user_id từ Bearer JWT. Thiếu/hỏng token → 401."""
    uid = decode_token(cred.credentials)
    if not uid:
        raise HTTPException(status_code=401, detail="invalid or expired token")
    return uid


@lru_cache(maxsize=1)
def get_dialogue() -> DialoguePort:
    return make_dialogue()


@lru_cache(maxsize=1)
def get_schedule() -> SchedulePort:
    return make_schedule()


@lru_cache(maxsize=1)
def get_memory() -> MemoryPort:
    return make_memory()


@lru_cache(maxsize=1)
def get_calendar() -> CalendarPort:
    return make_calendar()


@lru_cache(maxsize=1)
def get_billing() -> BillingPort:
    return make_billing()
