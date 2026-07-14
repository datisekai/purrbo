from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from api.app.db import get_session
from api.app.deps import get_current_user
from api.app.models import HabitCompletion, OwnedPersona, User, UserState
from api.app.schemas import ProfileOut
from api.app.services import compute_streak, _user_tz

router = APIRouter(tags=["profile"])


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    timezone: Optional[str] = None


@router.put("/profile")
async def update_profile(body: ProfileUpdate, user_id: str = Depends(get_current_user), db: AsyncSession = Depends(get_session)):
    u = await db.get(User, user_id)
    if u is None:
        raise HTTPException(status_code=404, detail="user không tồn tại")
    if body.name is not None:
        n = body.name.strip()
        if n:
            u.name = n[:40]
    if body.timezone is not None and body.timezone.strip():
        u.timezone = body.timezone.strip()
    await db.commit()
    await db.refresh(u)
    return {"id": u.id, "email": u.email, "name": u.name, "avatar": u.avatar}


@router.get("/profile", response_model=ProfileOut)
async def get_profile(user_id: str = Depends(get_current_user), db: AsyncSession = Depends(get_session)):
    u = await db.get(User, user_id)
    st = await db.get(UserState, user_id)
    if st is None:
        st = UserState(user_id=user_id)
        db.add(st)
        await db.commit()
        await db.refresh(st)
    total_done = (
        await db.execute(select(func.count()).select_from(HabitCompletion).where(HabitCompletion.user_id == user_id))
    ).scalar() or 0
    owned = (
        await db.execute(select(func.count()).select_from(OwnedPersona).where(OwnedPersona.user_id == user_id))
    ).scalar() or 0
    streak = await compute_streak(db, user_id, await _user_tz(db, user_id))
    return ProfileOut(
        name=(u.name if u else "bạn"),
        email=(u.email if u else ""),
        streak=streak,
        total_done=total_done,
        owned_count=owned,
        persona_key=st.persona_key,
        affinity_level=st.affinity_level,
    )
