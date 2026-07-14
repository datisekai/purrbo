"""Admin API — quản lý persona + config động từ web. Bảo vệ bằng X-Admin-Token.

Tối giản, không cần user auth: chỉ cần đúng ADMIN_TOKEN trong header.
"""
from __future__ import annotations

import json
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from api.app.config import settings
from api.app.db import get_session
from api.app.models import AppConfig, Habit, Item, OwnedPersona, Persona, User
from api.app.routers.appconfig import DEFAULT_CONFIG, load_config
from api.app.security import create_admin_token, verify_admin_token

router = APIRouter(prefix="/admin", tags=["admin"])


class AdminLogin(BaseModel):
    username: str
    password: str


@router.post("/login")
async def admin_login(body: AdminLogin):
    """Đăng nhập admin bằng username/password → cấp token phiên (12h)."""
    if body.username != settings.admin_username or body.password != settings.admin_password:
        raise HTTPException(status_code=401, detail="sai tài khoản hoặc mật khẩu")
    return {"token": create_admin_token()}


async def require_admin(
    authorization: str = Header(default=""),
    x_admin_token: str = Header(default=""),
) -> None:
    # 1) token phiên admin (Bearer, từ /admin/login)
    if authorization.lower().startswith("bearer "):
        if verify_admin_token(authorization[7:].strip()):
            return
    # 2) legacy X-Admin-Token (cho script/CI)
    if settings.admin_token and x_admin_token == settings.admin_token:
        return
    raise HTTPException(status_code=401, detail="cần đăng nhập admin")


class PersonaIn(BaseModel):
    key: str
    name: str
    variant: str = "mun"
    rarity: str = "Thường"
    tag: str = ""
    intro: str = ""


class PersonaPatch(BaseModel):
    name: Optional[str] = None
    variant: Optional[str] = None
    rarity: Optional[str] = None
    tag: Optional[str] = None
    intro: Optional[str] = None


def _persona_dict(p: Persona) -> dict:
    return {"key": p.key, "name": p.name, "variant": p.variant, "rarity": p.rarity, "tag": p.tag, "intro": p.intro}


@router.get("/stats", dependencies=[Depends(require_admin)])
async def stats(db: AsyncSession = Depends(get_session)):
    users = (await db.execute(select(func.count()).select_from(User))).scalar() or 0
    habits = (await db.execute(select(func.count()).select_from(Habit))).scalar() or 0
    personas = (await db.execute(select(func.count()).select_from(Persona))).scalar() or 0
    owned = (await db.execute(select(func.count()).select_from(OwnedPersona))).scalar() or 0
    return {"users": users, "habits": habits, "personas": personas, "owned_personas": owned}


@router.get("/personas", dependencies=[Depends(require_admin)])
async def list_personas(db: AsyncSession = Depends(get_session)):
    rows = (await db.execute(select(Persona).order_by(Persona.id))).scalars().all()
    return [_persona_dict(p) for p in rows]


@router.post("/personas", dependencies=[Depends(require_admin)])
async def create_persona(body: PersonaIn, db: AsyncSession = Depends(get_session)):
    exists = (await db.execute(select(Persona).where(Persona.key == body.key))).scalar_one_or_none()
    if exists:
        raise HTTPException(status_code=409, detail="key đã tồn tại")
    p = Persona(key=body.key, name=body.name, variant=body.variant, rarity=body.rarity, tag=body.tag, intro=body.intro)
    db.add(p)
    await db.commit()
    return _persona_dict(p)


@router.put("/personas/{key}", dependencies=[Depends(require_admin)])
async def update_persona(key: str, body: PersonaPatch, db: AsyncSession = Depends(get_session)):
    p = (await db.execute(select(Persona).where(Persona.key == key))).scalar_one_or_none()
    if p is None:
        raise HTTPException(status_code=404, detail="không tìm thấy persona")
    for field in ("name", "variant", "rarity", "tag", "intro"):
        v = getattr(body, field)
        if v is not None:
            setattr(p, field, v)
    await db.commit()
    return _persona_dict(p)


@router.delete("/personas/{key}", dependencies=[Depends(require_admin)])
async def delete_persona(key: str, db: AsyncSession = Depends(get_session)):
    p = (await db.execute(select(Persona).where(Persona.key == key))).scalar_one_or_none()
    if p is None:
        raise HTTPException(status_code=404, detail="không tìm thấy persona")
    await db.delete(p)
    await db.commit()
    return {"ok": True}


# ── Items (trang bị/phụ kiện) ─────────────────────────────────────────────
class ItemIn(BaseModel):
    key: str
    name: str
    slot: str = "hat"      # hat | glasses | neck
    price: int = 100
    rarity: str = "Thường"


class ItemPatch(BaseModel):
    name: Optional[str] = None
    slot: Optional[str] = None
    price: Optional[int] = None
    rarity: Optional[str] = None


def _item_dict(i: Item) -> dict:
    return {"key": i.key, "name": i.name, "slot": i.slot, "price": i.price, "rarity": i.rarity}


@router.get("/items", dependencies=[Depends(require_admin)])
async def admin_list_items(db: AsyncSession = Depends(get_session)):
    rows = (await db.execute(select(Item))).scalars().all()
    return [_item_dict(i) for i in rows]


@router.post("/items", dependencies=[Depends(require_admin)])
async def admin_create_item(body: ItemIn, db: AsyncSession = Depends(get_session)):
    if await db.get(Item, body.key):
        raise HTTPException(status_code=409, detail="key đã tồn tại")
    if body.slot not in ("hat", "glasses", "neck"):
        raise HTTPException(status_code=400, detail="slot phải là hat|glasses|neck")
    it = Item(key=body.key, name=body.name, slot=body.slot, price=max(0, body.price), rarity=body.rarity)
    db.add(it)
    await db.commit()
    return _item_dict(it)


@router.put("/items/{key}", dependencies=[Depends(require_admin)])
async def admin_update_item(key: str, body: ItemPatch, db: AsyncSession = Depends(get_session)):
    it = await db.get(Item, key)
    if it is None:
        raise HTTPException(status_code=404, detail="không tìm thấy item")
    if body.name is not None:
        it.name = body.name
    if body.slot is not None:
        if body.slot not in ("hat", "glasses", "neck"):
            raise HTTPException(status_code=400, detail="slot không hợp lệ")
        it.slot = body.slot
    if body.price is not None:
        it.price = max(0, body.price)
    if body.rarity is not None:
        it.rarity = body.rarity
    await db.commit()
    return _item_dict(it)


@router.delete("/items/{key}", dependencies=[Depends(require_admin)])
async def admin_delete_item(key: str, db: AsyncSession = Depends(get_session)):
    it = await db.get(Item, key)
    if it is None:
        raise HTTPException(status_code=404, detail="không tìm thấy item")
    await db.delete(it)
    await db.commit()
    return {"ok": True}


@router.get("/config", dependencies=[Depends(require_admin)])
async def get_admin_config(db: AsyncSession = Depends(get_session)):
    return {"config": await load_config(db), "defaults": DEFAULT_CONFIG}


class ConfigIn(BaseModel):
    key: str
    value: object   # JSON-serializable


@router.put("/config", dependencies=[Depends(require_admin)])
async def set_admin_config(body: ConfigIn, db: AsyncSession = Depends(get_session)):
    if body.key not in DEFAULT_CONFIG:
        raise HTTPException(status_code=400, detail="key không hợp lệ")
    row = await db.get(AppConfig, body.key)
    payload = json.dumps(body.value, ensure_ascii=False)
    if row is None:
        db.add(AppConfig(key=body.key, value=payload))
    else:
        row.value = payload
    await db.commit()
    return {"ok": True, "key": body.key}
