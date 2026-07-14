from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.app.db import get_session
from api.app.deps import get_current_user
from api.app.models import OwnedPersona, Persona, UserState
from api.app.schemas import PersonaOut, StateOut
from api.app.services import compute_streak, _user_tz

router = APIRouter(tags=["personas"])


async def _state(db: AsyncSession, user_id: str) -> UserState:
    st = await db.get(UserState, user_id)
    if st is None:
        st = UserState(user_id=user_id)
        db.add(st)
        await db.commit()
        await db.refresh(st)
    return st


@router.get("/personas", response_model=list[PersonaOut])
async def list_personas(db: AsyncSession = Depends(get_session)):
    rows = (await db.execute(select(Persona))).scalars().all()
    return list(rows)


@router.get("/state", response_model=StateOut)
async def get_state(user_id: str = Depends(get_current_user), db: AsyncSession = Depends(get_session)):
    st = await _state(db, user_id)
    st.streak = await compute_streak(db, user_id, await _user_tz(db, user_id))  # AD-3 dẫn xuất
    return st


@router.get("/me/personas")
async def my_collection(user_id: str = Depends(get_current_user), db: AsyncSession = Depends(get_session)):
    st = await _state(db, user_id)
    catalog = (await db.execute(select(Persona))).scalars().all()
    owned_keys = set(
        (await db.execute(select(OwnedPersona.persona_key).where(OwnedPersona.user_id == user_id))).scalars().all()
    )
    return [
        {"key": p.key, "name": p.name, "variant": p.variant, "rarity": p.rarity,
         "tag": p.tag, "intro": p.intro,
         "owned": p.key in owned_keys, "active": p.key == st.persona_key}
        for p in catalog
    ]


class SetPersona(BaseModel):
    key: str


@router.put("/state/persona", response_model=StateOut)
async def set_persona(body: SetPersona, user_id: str = Depends(get_current_user), db: AsyncSession = Depends(get_session)):
    owned = (
        await db.execute(select(OwnedPersona).where(OwnedPersona.user_id == user_id, OwnedPersona.persona_key == body.key))
    ).scalar_one_or_none()
    if owned is None:
        raise HTTPException(status_code=403, detail="chưa sở hữu persona này")
    st = await _state(db, user_id)
    st.persona_key = body.key
    await db.commit()
    await db.refresh(st)
    return st


@router.post("/onboarding", response_model=StateOut)
async def onboarding_pick(body: SetPersona, user_id: str = Depends(get_current_user), db: AsyncSession = Depends(get_session)):
    """Persona khởi đầu từ quiz → cấp quyền sở hữu + đặt active."""
    owned = (
        await db.execute(select(OwnedPersona).where(OwnedPersona.user_id == user_id, OwnedPersona.persona_key == body.key))
    ).scalar_one_or_none()
    if owned is None:
        db.add(OwnedPersona(user_id=user_id, persona_key=body.key))
    st = await _state(db, user_id)
    st.persona_key = body.key
    st.onboarded = True
    await db.commit()
    await db.refresh(st)
    return st
