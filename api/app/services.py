"""Services — seed mặc định + tính streak/completion thật (AD-3, AD-4)."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

try:
    from zoneinfo import ZoneInfo
except Exception:  # pragma: no cover
    ZoneInfo = None  # type: ignore

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from api.app.models import Habit, HabitCompletion, OwnedPersona, User, UserState


def _now_local(tz: str) -> datetime:
    if ZoneInfo is not None:
        try:
            return datetime.now(ZoneInfo(tz))
        except Exception:
            pass
    return datetime.now(timezone.utc)


def today_ymd(tz: str) -> str:
    return _now_local(tz).strftime("%Y-%m-%d")


async def _user_tz(db: AsyncSession, user_id: str) -> str:
    u = await db.get(User, user_id)
    return u.timezone if u and u.timezone else "Asia/Ho_Chi_Minh"


async def done_today_ids(db: AsyncSession, user_id: str, tz: str) -> set[int]:
    ymd = today_ymd(tz)
    rows = (
        await db.execute(
            select(HabitCompletion.habit_id).where(
                HabitCompletion.user_id == user_id, HabitCompletion.ymd == ymd
            )
        )
    ).scalars().all()
    return set(rows)


async def compute_streak(db: AsyncSession, user_id: str, tz: str) -> int:
    """Số ngày LIÊN TIẾP (tính tới hôm nay/hôm qua) có >=1 completion."""
    days = set(
        (await db.execute(
            select(HabitCompletion.ymd).where(HabitCompletion.user_id == user_id).distinct()
        )).scalars().all()
    )
    if not days:
        return 0
    cur = _now_local(tz).date()
    if cur.strftime("%Y-%m-%d") not in days:
        cur = cur - timedelta(days=1)  # cho phép streak tính tới hôm qua
        if cur.strftime("%Y-%m-%d") not in days:
            return 0
    streak = 0
    while cur.strftime("%Y-%m-%d") in days:
        streak += 1
        cur = cur - timedelta(days=1)
    return streak


async def record_completion(db: AsyncSession, user_id: str, habit_id: int, tz: str) -> bool:
    """Ghi 1 completion cho hôm nay (idempotent theo ngày). True nếu mới ghi."""
    ymd = today_ymd(tz)
    exists = (
        await db.execute(
            select(HabitCompletion.id).where(
                HabitCompletion.user_id == user_id,
                HabitCompletion.habit_id == habit_id,
                HabitCompletion.ymd == ymd,
            )
        )
    ).scalar_one_or_none()
    if exists:
        return False
    db.add(HabitCompletion(user_id=user_id, habit_id=habit_id, ymd=ymd))
    return True

_DEFAULT_HABITS = [
    ("Uống nước", "droplet", "9:00", "người yêu đang hóng"),
    ("Tập gym", "dumbbell", "18:00", "trốn là em dỗi đó"),
    ("Đọc 10 trang sách", "book", "21:00", "cùng em nha"),
]


async def seed_user_defaults(db: AsyncSession, user_id: str) -> None:
    """User mới → chỉ tạo trạng thái + persona sở hữu. KHÔNG seed lịch mẫu
    (user tự thêm việc của mình — tránh lịch rác)."""
    has_state = await db.get(UserState, user_id)
    if has_state is None:
        db.add(UserState(user_id=user_id))
    owned = (
        await db.execute(select(func.count()).select_from(OwnedPersona).where(OwnedPersona.user_id == user_id))
    ).scalar()
    if not owned:
        db.add(OwnedPersona(user_id=user_id, persona_key="mun"))
        db.add(OwnedPersona(user_id=user_id, persona_key="cam"))
    await db.commit()
