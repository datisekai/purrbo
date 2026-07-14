"""Cửa hàng trang bị/phụ kiện cosmetic — mua bằng đá quý, mặc để đổi ngoại hình.

slot: hat (mũ/nơ) · glasses (kính) · neck (cổ/trang sức). Mỗi slot mặc 1 item.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.app.db import get_session
from api.app.deps import get_current_user
from api.app.models import EquippedItem, Item, OwnedItem, UserState

router = APIRouter(tags=["items"])

# Catalog mặc định (key, name, slot, price, rarity). Seed lúc khởi động.
ITEMS_SEED = [
    ("hat_crown", "Vương miện", "hat", 300, "SSR"),
    ("hat_beanie", "Mũ len", "hat", 120, "Thường"),
    ("hat_bow", "Nơ xinh", "hat", 150, "Hiếm"),
    ("glasses_round", "Kính tròn", "glasses", 120, "Thường"),
    ("glasses_cool", "Kính mát", "glasses", 200, "Hiếm"),
    ("neck_bowtie", "Nơ cổ", "neck", 100, "Thường"),
    ("neck_scarf", "Khăn quàng", "neck", 150, "Hiếm"),
    ("neck_chain", "Dây chuyền vàng", "neck", 280, "SSR"),
]


async def seed_items(db: AsyncSession) -> None:
    """Seed catalog mặc định CHỈ khi bảng rỗng — sau đó admin quản lý (thêm/sửa/xoá,
    đổi giá) trên web, không bị ghi đè/prune mỗi lần khởi động."""
    from sqlalchemy import func
    count = (await db.execute(select(func.count()).select_from(Item))).scalar() or 0
    if count:
        return
    for k, n, slot, price, rarity in ITEMS_SEED:
        db.add(Item(key=k, name=n, slot=slot, price=price, rarity=rarity))
    await db.commit()


async def _state(db: AsyncSession, user_id: str) -> UserState:
    st = await db.get(UserState, user_id)
    if st is None:
        st = UserState(user_id=user_id)
        db.add(st)
        await db.flush()
    return st


@router.get("/items")
async def list_items(user_id: str = Depends(get_current_user), db: AsyncSession = Depends(get_session)):
    catalog = (await db.execute(select(Item))).scalars().all()
    owned = set((await db.execute(select(OwnedItem.item_key).where(OwnedItem.user_id == user_id))).scalars().all())
    equipped = {
        e.slot: e.item_key
        for e in (await db.execute(select(EquippedItem).where(EquippedItem.user_id == user_id))).scalars().all()
    }
    return [
        {"key": i.key, "name": i.name, "slot": i.slot, "price": i.price, "rarity": i.rarity,
         "owned": i.key in owned, "equipped": equipped.get(i.slot) == i.key}
        for i in catalog
    ]


@router.get("/items/equipped")
async def equipped(user_id: str = Depends(get_current_user), db: AsyncSession = Depends(get_session)):
    rows = (await db.execute(select(EquippedItem).where(EquippedItem.user_id == user_id))).scalars().all()
    return {e.slot: e.item_key for e in rows}


@router.post("/items/{key}/buy")
async def buy_item(key: str, user_id: str = Depends(get_current_user), db: AsyncSession = Depends(get_session)):
    item = await db.get(Item, key)
    if item is None:
        raise HTTPException(status_code=404, detail="không có món này")
    already = (await db.execute(
        select(OwnedItem).where(OwnedItem.user_id == user_id, OwnedItem.item_key == key)
    )).scalar_one_or_none()
    if already is not None:
        raise HTTPException(status_code=409, detail="đã sở hữu")
    st = await _state(db, user_id)
    if st.gems < item.price:
        raise HTTPException(status_code=402, detail="không đủ đá quý")
    st.gems -= item.price
    db.add(OwnedItem(user_id=user_id, item_key=key))
    await db.commit()
    return {"ok": True, "gems": st.gems}


class EquipIn(BaseModel):
    slot: str
    key: str = ""   # rỗng = tháo ra


@router.put("/items/equip")
async def equip_item(body: EquipIn, user_id: str = Depends(get_current_user), db: AsyncSession = Depends(get_session)):
    row = (await db.execute(
        select(EquippedItem).where(EquippedItem.user_id == user_id, EquippedItem.slot == body.slot)
    )).scalar_one_or_none()
    if not body.key:  # tháo
        if row is not None:
            await db.delete(row)
        await db.commit()
        return {"ok": True, "slot": body.slot, "key": ""}
    item = await db.get(Item, body.key)
    if item is None or item.slot != body.slot:
        raise HTTPException(status_code=400, detail="item không hợp slot")
    owned = (await db.execute(
        select(OwnedItem).where(OwnedItem.user_id == user_id, OwnedItem.item_key == body.key)
    )).scalar_one_or_none()
    if owned is None:
        raise HTTPException(status_code=403, detail="chưa sở hữu item")
    if row is None:
        db.add(EquippedItem(user_id=user_id, slot=body.slot, item_key=body.key))
    else:
        row.item_key = body.key
    await db.commit()
    return {"ok": True, "slot": body.slot, "key": body.key}
