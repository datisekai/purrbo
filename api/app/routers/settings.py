from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from api.app.db import get_session
from api.app.deps import get_current_user
from api.app.models import UserState
from api.app.schemas import SettingsIn, StateOut

router = APIRouter(tags=["settings"])

_MOOD = {0: "dịu", 1: "vừa", 2: "gắt"}


@router.put("/settings", response_model=StateOut)
async def update_settings(body: SettingsIn, user_id: str = Depends(get_current_user), db: AsyncSession = Depends(get_session)):
    st = await db.get(UserState, user_id)
    if st is None:
        st = UserState(user_id=user_id)
        db.add(st)
    if body.intimacy is not None:
        st.intimacy = body.intimacy
    if body.lay is not None:
        st.lay = body.lay
        st.mood = _MOOD.get(body.lay, "vừa")   # độ lầy → mood cho DialoguePort
    if body.freq is not None:
        st.freq = body.freq
    await db.commit()
    await db.refresh(st)
    return st
