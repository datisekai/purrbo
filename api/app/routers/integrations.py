from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from api.app.db import get_session
from api.app.deps import get_billing, get_calendar, get_current_user
from api.app.models import User, UserState

router = APIRouter(tags=["integrations"])


class PushReg(BaseModel):
    token: str


@router.post("/push/register")
async def push_register(body: PushReg, user_id: str = Depends(get_current_user), db: AsyncSession = Depends(get_session)):
    """Lưu Expo push token của user (remote push — AD-9). Chỉ dev build mới có token."""
    u = await db.get(User, user_id)
    if u is not None and body.token:
        u.push_token = body.token[:256]
        await db.commit()
    return {"ok": True}


@router.get("/calendar/events")
async def calendar_events(
    gtoken: str = "",
    provider: str = "google",
    user_id: str = Depends(get_current_user),
):
    """AD-13: import event lịch (read-only). provider=google|lark|mock.

    App tự OAuth rồi truyền access_token qua ?gtoken=. Không token → adapter trả []
    (không bịa). CALENDAR_PROVIDER=mock để demo.
    """
    from adapters.calendar_factory import make_calendar
    cal = make_calendar(provider)
    events = await cal.list_events(access_token=gtoken)
    return [{"title": e.title, "start": e.start, "location": e.location} for e in events]


class BuyIn(BaseModel):
    receipt: str
    gems: int = 0


@router.post("/billing/verify")
async def billing_verify(body: BuyIn, user_id: str = Depends(get_current_user), db: AsyncSession = Depends(get_session)):
    """AD-14: verify receipt server-side rồi mới cấp gems (client không tự cộng)."""
    ok = await get_billing().verify_purchase(user_id, body.receipt)
    if not ok:
        return {"ok": False}
    st = await db.get(UserState, user_id) or UserState(user_id=user_id)
    st.gems += max(0, body.gems)
    db.add(st)
    await db.commit()
    return {"ok": True, "gems": st.gems}
