"""Giữ chân user: điểm danh + nhiệm vụ hàng ngày + mời bạn (referral) — nhận đá quý.

- Nhiệm vụ reset theo NGÀY (MissionClaim idempotent theo ymd).
- Referral: mỗi user 1 mã; người mới nhập mã → cả 2 nhận thưởng, 1 lần/tài khoản.
"""
from __future__ import annotations

import uuid
from datetime import timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from api.app.db import get_session
from api.app.deps import get_current_user
from api.app.models import ChatMessage, HabitCompletion, MissionClaim, User, UserState
from api.app.services import _now_local, _user_tz, today_ymd

router = APIRouter(tags=["rewards"])

# Nhiệm vụ hàng ngày: key, tiêu đề, mô tả, mục tiêu, thưởng, icon (app render).
MISSIONS = [
    {"key": "checkin", "title": "Điểm danh hôm nay", "desc": "Ghé thăm là có quà 🎁", "goal": 1, "reward": 20, "icon": "gift"},
    {"key": "khoe3", "title": "Khoe 3 việc", "desc": "Làm xong khoe cho bạn đồng hành 💗", "goal": 3, "reward": 30, "icon": "heart"},
    {"key": "chat1", "title": "Tám 1 câu", "desc": "Nhắn với bạn đồng hành 1 lần", "goal": 1, "reward": 15, "icon": "sparkles"},
]

REF_NEW_BONUS = 100     # người nhập mã (mới)
REF_OWNER_BONUS = 150   # người sở hữu mã (mỗi lượt mời thành công)


def _today_start_utc(tz: str):
    now = _now_local(tz).replace(hour=0, minute=0, second=0, microsecond=0)
    try:
        return now.astimezone(timezone.utc)
    except Exception:
        return now


async def _progress(db: AsyncSession, user_id: str, tz: str) -> dict:
    ymd = today_ymd(tz)
    khoe = (await db.execute(
        select(func.count()).select_from(HabitCompletion).where(
            HabitCompletion.user_id == user_id, HabitCompletion.ymd == ymd)
    )).scalar() or 0
    chat = (await db.execute(
        select(func.count()).select_from(ChatMessage).where(
            ChatMessage.user_id == user_id, ChatMessage.role == "user",
            ChatMessage.created_at >= _today_start_utc(tz))
    )).scalar() or 0
    return {"checkin": 1, "khoe3": int(khoe), "chat1": int(chat)}


async def _claimed_keys(db: AsyncSession, user_id: str, ymd: str) -> set[str]:
    rows = (await db.execute(
        select(MissionClaim.mission_key).where(
            MissionClaim.user_id == user_id, MissionClaim.ymd == ymd)
    )).scalars().all()
    return set(rows)


async def _state(db: AsyncSession, user_id: str) -> UserState:
    st = await db.get(UserState, user_id)
    if st is None:
        st = UserState(user_id=user_id)
        db.add(st)
        await db.flush()
    return st


@router.get("/missions")
async def list_missions(user_id: str = Depends(get_current_user), db: AsyncSession = Depends(get_session)):
    tz = await _user_tz(db, user_id)
    ymd = today_ymd(tz)
    prog = await _progress(db, user_id, tz)
    claimed = await _claimed_keys(db, user_id, ymd)
    out = []
    claimable = 0
    for m in MISSIONS:
        p = min(prog.get(m["key"], 0), m["goal"])
        done = p >= m["goal"]
        is_claimed = m["key"] in claimed
        if done and not is_claimed:
            claimable += m["reward"]
        out.append({**m, "progress": p, "done": done, "claimed": is_claimed})
    return {"missions": out, "claimable_gems": claimable, "date": ymd}


@router.post("/missions/{key}/claim")
async def claim_mission(key: str, user_id: str = Depends(get_current_user), db: AsyncSession = Depends(get_session)):
    m = next((x for x in MISSIONS if x["key"] == key), None)
    if m is None:
        raise HTTPException(status_code=404, detail="nhiệm vụ không tồn tại")
    tz = await _user_tz(db, user_id)
    ymd = today_ymd(tz)
    # đã nhận chưa?
    exists = (await db.execute(
        select(MissionClaim).where(
            MissionClaim.user_id == user_id, MissionClaim.mission_key == key, MissionClaim.ymd == ymd)
    )).scalar_one_or_none()
    if exists is not None:
        raise HTTPException(status_code=409, detail="đã nhận thưởng hôm nay")
    # đủ điều kiện chưa?
    prog = await _progress(db, user_id, tz)
    if prog.get(key, 0) < m["goal"]:
        raise HTTPException(status_code=400, detail="chưa hoàn thành nhiệm vụ")
    db.add(MissionClaim(user_id=user_id, mission_key=key, ymd=ymd))
    st = await _state(db, user_id)
    st.gems += m["reward"]
    await db.commit()
    return {"ok": True, "reward": m["reward"], "gems": st.gems}


# ── Referral ──────────────────────────────────────────────────────────────
async def _ensure_code(db: AsyncSession, u: User) -> str:
    if u.referral_code:
        return u.referral_code
    for _ in range(6):
        code = uuid.uuid4().hex[:6].upper()
        dup = (await db.execute(select(User).where(User.referral_code == code))).scalar_one_or_none()
        if dup is None:
            u.referral_code = code
            await db.commit()
            return code
    u.referral_code = u.id[-6:].upper()
    await db.commit()
    return u.referral_code


@router.get("/referral")
async def get_referral(user_id: str = Depends(get_current_user), db: AsyncSession = Depends(get_session)):
    u = await db.get(User, user_id)
    if u is None:
        raise HTTPException(status_code=404, detail="user không tồn tại")
    code = await _ensure_code(db, u)
    count = (await db.execute(
        select(func.count()).select_from(User).where(User.referred_by == user_id)
    )).scalar() or 0
    return {
        "code": code,
        "referred_count": int(count),
        "already_redeemed": bool(u.referred_by),
        "reward_new": REF_NEW_BONUS,
        "reward_owner": REF_OWNER_BONUS,
    }


class RedeemIn(BaseModel):
    code: str


@router.post("/referral/redeem")
async def redeem_referral(body: RedeemIn, user_id: str = Depends(get_current_user), db: AsyncSession = Depends(get_session)):
    u = await db.get(User, user_id)
    if u is None:
        raise HTTPException(status_code=404, detail="user không tồn tại")
    if u.referred_by:
        raise HTTPException(status_code=409, detail="bạn đã nhập mã mời rồi")
    code = (body.code or "").strip().upper()
    if not code:
        raise HTTPException(status_code=400, detail="thiếu mã")
    owner = (await db.execute(select(User).where(User.referral_code == code))).scalar_one_or_none()
    if owner is None:
        raise HTTPException(status_code=404, detail="mã không đúng")
    if owner.id == user_id:
        raise HTTPException(status_code=400, detail="không thể tự mời mình")
    u.referred_by = owner.id
    # thưởng cả 2
    my_state = await _state(db, user_id)
    my_state.gems += REF_NEW_BONUS
    owner_state = await _state(db, owner.id)
    owner_state.gems += REF_OWNER_BONUS
    await db.commit()
    return {"ok": True, "reward": REF_NEW_BONUS, "gems": my_state.gems}
