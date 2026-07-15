"""Thống kê thói quen — hoàn thành 30 ngày, streak dài nhất, tổng việc (từ HabitCompletion)."""
from __future__ import annotations

from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from api.app.db import get_session
from api.app.deps import get_current_user
from api.app.models import HabitCompletion, User, UserState
from api.app.services import _now_local, _user_tz, compute_streak

router = APIRouter(tags=["stats"])


def _best_streak(ymds: set[str]) -> int:
    dates = sorted(date.fromisoformat(d) for d in ymds if d)
    best = cur = 0
    prev = None
    for d in dates:
        cur = cur + 1 if (prev and (d - prev).days == 1) else 1
        best = max(best, cur)
        prev = d
    return best


@router.get("/stats")
async def get_stats(user_id: str = Depends(get_current_user), db: AsyncSession = Depends(get_session)):
    tz = await _user_tz(db, user_id)

    rows = (await db.execute(
        select(HabitCompletion.ymd, func.count()).where(HabitCompletion.user_id == user_id).group_by(HabitCompletion.ymd)
    )).all()
    by_day = {ymd: int(c) for ymd, c in rows}

    total_done = sum(by_day.values())
    active_days = len(by_day)
    best = _best_streak(set(by_day.keys()))
    streak = await compute_streak(db, user_id, tz)

    # 30 ngày gần nhất (cũ → mới) để vẽ biểu đồ
    today = _now_local(tz).date()
    days = []
    for i in range(29, -1, -1):
        d = today - timedelta(days=i)
        ymd = d.isoformat()
        days.append({"ymd": ymd, "dd": d.day, "count": by_day.get(ymd, 0)})

    return {
        "streak": streak,
        "best_streak": best,
        "total_done": total_done,
        "active_days": active_days,
        "days": days,
    }


@router.get("/leaderboard")
async def leaderboard(user_id: str = Depends(get_current_user), db: AsyncSession = Depends(get_session)):
    """Bảng xếp hạng: top theo streak (tie-break điểm thân thiết). Đánh dấu 'me'."""
    rows = (
        await db.execute(
            select(User.id, User.name, UserState.streak, UserState.affinity_level, UserState.affinity_points)
            .join(UserState, UserState.user_id == User.id)
            .order_by(UserState.streak.desc(), UserState.affinity_points.desc())
            .limit(50)
        )
    ).all()
    top = [
        {
            "rank": i + 1,
            "name": (r.name or "Ẩn danh").strip() or "Ẩn danh",
            "streak": r.streak or 0,
            "level": r.affinity_level or 1,
            "me": r.id == user_id,
        }
        for i, r in enumerate(rows)
    ]
    my_rank = next((t["rank"] for t in top if t["me"]), None)
    if my_rank is None:  # user ngoài top 50 → tính hạng thật bằng số người xếp trên
        me = await db.get(UserState, user_id)
        if me:
            higher = (
                await db.execute(
                    select(func.count()).select_from(UserState).where(
                        (UserState.streak > me.streak)
                        | ((UserState.streak == me.streak) & (UserState.affinity_points > me.affinity_points))
                    )
                )
            ).scalar()
            my_rank = (higher or 0) + 1
    return {"top": top, "my_rank": my_rank}
