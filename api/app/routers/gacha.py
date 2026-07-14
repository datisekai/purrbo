from __future__ import annotations

import random

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.app.db import get_session
from api.app.deps import get_current_user
from api.app.models import OwnedPersona, Persona, UserState
from api.app.schemas import GachaOut, PersonaOut

router = APIRouter(tags=["gacha"])

# bag → (giá đá quý, tỉ lệ theo rarity)
_BAGS = {
    "thuong": (40, {"SSR": 0.01, "Hiếm": 0.14, "Thường": 0.85}),
    "caocap": (120, {"SSR": 0.03, "Hiếm": 0.22, "Thường": 0.75}),
}


def _roll_rarity(odds: dict[str, float]) -> str:
    r = random.random()
    acc = 0.0
    for rarity, p in odds.items():
        acc += p
        if r <= acc:
            return rarity
    return "Thường"


@router.post("/gacha/open", response_model=GachaOut)
async def open_bag(bag: str = "thuong", user_id: str = Depends(get_current_user), db: AsyncSession = Depends(get_session)):
    if bag not in _BAGS:
        raise HTTPException(status_code=400, detail="loại túi không hợp lệ")
    price, odds = _BAGS[bag]

    st = await db.get(UserState, user_id)
    if st is None:
        st = UserState(user_id=user_id)
        db.add(st)
        await db.flush()
    if st.gems < price:
        raise HTTPException(status_code=402, detail="không đủ đá quý")

    catalog = (await db.execute(select(Persona))).scalars().all()
    rarity = _roll_rarity(odds)
    pool = [p for p in catalog if p.rarity == rarity] or catalog
    picked = random.choice(pool)

    st.gems -= price

    owned = (
        await db.execute(select(OwnedPersona).where(OwnedPersona.user_id == user_id, OwnedPersona.persona_key == picked.key))
    ).scalar_one_or_none()
    is_new = owned is None
    if is_new:
        db.add(OwnedPersona(user_id=user_id, persona_key=picked.key))

    await db.commit()
    return GachaOut(persona=PersonaOut.model_validate(picked), gems=st.gems, is_new=is_new)


@router.post("/gacha/open10")
async def open_bag_x10(bag: str = "thuong", user_id: str = Depends(get_current_user), db: AsyncSession = Depends(get_session)):
    """Mở túi x10 (atomic): trừ 10× giá 1 lần, đảm bảo ít nhất 1 Hiếm (pity)."""
    if bag not in _BAGS:
        raise HTTPException(status_code=400, detail="loại túi không hợp lệ")
    price, odds = _BAGS[bag]
    total = price * 10

    st = await db.get(UserState, user_id)
    if st is None:
        st = UserState(user_id=user_id)
        db.add(st)
        await db.flush()
    if st.gems < total:
        raise HTTPException(status_code=402, detail="không đủ đá quý")

    catalog = (await db.execute(select(Persona))).scalars().all()
    if not catalog:
        raise HTTPException(status_code=400, detail="chưa có persona")

    def pick(rarity: str):
        pool = [p for p in catalog if p.rarity == rarity] or catalog
        return random.choice(pool)

    rolls = [_roll_rarity(odds) for _ in range(10)]
    # Pity: nếu 10 lần đều Thường → nâng lần cuối lên Hiếm (nếu có persona Hiếm)
    if all(r == "Thường" for r in rolls) and any(p.rarity == "Hiếm" for p in catalog):
        rolls[-1] = "Hiếm"
    picked = [pick(r) for r in rolls]

    st.gems -= total

    already = set(
        (await db.execute(select(OwnedPersona.persona_key).where(OwnedPersona.user_id == user_id))).scalars().all()
    )
    results = []
    for p in picked:
        is_new = p.key not in already
        if is_new:
            db.add(OwnedPersona(user_id=user_id, persona_key=p.key))
            already.add(p.key)   # dedupe trong cùng lượt mở
        results.append({"persona": PersonaOut.model_validate(p), "is_new": is_new})

    await db.commit()
    return {"results": results, "gems": st.gems}
