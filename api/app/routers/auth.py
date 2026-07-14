from __future__ import annotations

import uuid

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.app.config import settings
from api.app.db import get_session
from api.app.deps import get_current_user
from api.app.models import User
from api.app.security import create_token
from api.app.services import seed_user_defaults

router = APIRouter(prefix="/auth", tags=["auth"])


class DevLogin(BaseModel):
    email: str = "finn@demo.dev"
    name: str = "Finn"


class GoogleLogin(BaseModel):
    id_token: str


class AuthOut(BaseModel):
    token: str
    user: dict


async def _get_or_create(db: AsyncSession, *, email: str, name: str, avatar: str, provider: str, new_id: str) -> User:
    u = (await db.execute(select(User).where(User.email == email))).scalar_one_or_none()
    if u is None:
        u = User(id=new_id, email=email, name=name, avatar=avatar, provider=provider)
        db.add(u)
        await db.commit()
        await db.refresh(u)
    await seed_user_defaults(db, u.id)
    return u


def _out(u: User) -> AuthOut:
    return AuthOut(token=create_token(u.id), user={"id": u.id, "email": u.email, "name": u.name, "avatar": u.avatar})


@router.post("/dev", response_model=AuthOut)
async def dev_login(body: DevLogin, db: AsyncSession = Depends(get_session)):
    """Tài khoản khách (nhập tên). AD-8: prod tắt qua ALLOW_DEV_LOGIN=0."""
    if not settings.allow_dev_login:
        raise HTTPException(status_code=403, detail="dev/guest login disabled")
    # mỗi lần là 1 khách mới (email ngẫu nhiên để không đụng)
    email = body.email if body.email != "finn@demo.dev" else f"guest-{uuid.uuid4().hex[:8]}@purrbo.guest"
    u = await _get_or_create(db, email=email, name=body.name, avatar="", provider="guest",
                             new_id="guest-" + uuid.uuid4().hex[:12])
    return _out(u)


@router.post("/google", response_model=AuthOut)
async def google_login(body: GoogleLogin, db: AsyncSession = Depends(get_session)):
    """Xác thực Google id_token → tạo/lấy user → cấp JWT phiên."""
    async with httpx.AsyncClient(timeout=10) as c:
        r = await c.get("https://oauth2.googleapis.com/tokeninfo", params={"id_token": body.id_token})
    if r.status_code != 200:
        raise HTTPException(status_code=401, detail="google token invalid")
    info = r.json()
    if settings.google_client_id and info.get("aud") != settings.google_client_id:
        raise HTTPException(status_code=401, detail="google token aud mismatch")  # AD-8
    email = info.get("email")
    if not email:
        raise HTTPException(status_code=401, detail="google token missing email")
    u = await _get_or_create(db, email=email, name=info.get("name", ""), avatar=info.get("picture", ""),
                             provider="google", new_id="g-" + info["sub"])
    return _out(u)


@router.get("/me")
async def me(user_id: str = Depends(get_current_user), db: AsyncSession = Depends(get_session)):
    u = await db.get(User, user_id)
    if u is None:
        raise HTTPException(status_code=404, detail="user not found")
    return {"id": u.id, "email": u.email, "name": u.name, "avatar": u.avatar}
