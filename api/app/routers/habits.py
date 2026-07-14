from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.app.db import get_session
from api.app.deps import get_current_user, get_dialogue
from api.app.models import Habit, Persona, UserState
from api.app.schemas import HabitCreate, HabitOut, KhoeOut
from api.app.services import compute_streak, done_today_ids, record_completion, _user_tz
from domain.ports import DialogueContext

router = APIRouter(tags=["habits"])


async def _state(db: AsyncSession, user_id: str) -> UserState:
    st = await db.get(UserState, user_id)
    if st is None:
        st = UserState(user_id=user_id)
        db.add(st)
        await db.commit()
        await db.refresh(st)
    return st


@router.get("/habits", response_model=list[HabitOut])
async def list_habits(user_id: str = Depends(get_current_user), db: AsyncSession = Depends(get_session)):
    tz = await _user_tz(db, user_id)
    done = await done_today_ids(db, user_id, tz)          # AD-3: done DẪN XUẤT theo ngày
    rows = (
        await db.execute(select(Habit).where(Habit.user_id == user_id).order_by(Habit.id))
    ).scalars().all()
    out = []
    for h in rows:
        out.append(HabitOut(id=h.id, name=h.name, icon=h.icon, time=h.time, hint=h.hint,
                            done=h.id in done, repeat=getattr(h, "repeat", "daily") or "daily"))
    return out


@router.post("/habits", response_model=HabitOut)
async def create_habit(body: HabitCreate, user_id: str = Depends(get_current_user), db: AsyncSession = Depends(get_session)):
    h = Habit(user_id=user_id, name=body.name, icon=body.icon, time=body.time, hint=body.hint, repeat=body.repeat or "daily")
    db.add(h)
    await db.commit()
    await db.refresh(h)
    return HabitOut(id=h.id, name=h.name, icon=h.icon, time=h.time, hint=h.hint, done=False, repeat=h.repeat)


@router.put("/habits/{habit_id}", response_model=HabitOut)
async def update_habit(habit_id: int, body: HabitCreate, user_id: str = Depends(get_current_user), db: AsyncSession = Depends(get_session)):
    h = await db.get(Habit, habit_id)
    if h is None or h.user_id != user_id:
        raise HTTPException(status_code=404, detail="habit not found")
    h.name = body.name
    h.icon = body.icon
    h.time = body.time
    h.hint = body.hint
    h.repeat = body.repeat or "daily"
    await db.commit()
    await db.refresh(h)
    tz = await _user_tz(db, user_id)
    done = await done_today_ids(db, user_id, tz)
    return HabitOut(id=h.id, name=h.name, icon=h.icon, time=h.time, hint=h.hint, done=h.id in done, repeat=h.repeat)


@router.delete("/habits/{habit_id}")
async def delete_habit(habit_id: int, user_id: str = Depends(get_current_user), db: AsyncSession = Depends(get_session)):
    h = await db.get(Habit, habit_id)
    if h is None or h.user_id != user_id:
        raise HTTPException(status_code=404, detail="habit not found")
    await db.delete(h)
    await db.commit()
    return {"ok": True}


@router.post("/habits/{habit_id}/khoe", response_model=KhoeOut)
async def khoe(habit_id: int, user_id: str = Depends(get_current_user), db: AsyncSession = Depends(get_session)):
    """Vòng lặp cốt lõi: khoe → ghi completion (1/ngày) → streak thật + persona khen (AI)."""
    habit = await db.get(Habit, habit_id)
    if habit is None or habit.user_id != user_id:
        raise HTTPException(status_code=404, detail="habit not found")

    tz = await _user_tz(db, user_id)
    is_new = await record_completion(db, user_id, habit.id, tz)   # AD-3: idempotent theo ngày
    await db.flush()

    st = await _state(db, user_id)
    if is_new:                                                    # AD-7: chỉ +điểm khi completion MỚI → chống farm
        st.affinity_points += 30
        while st.affinity_points >= 500:
            st.affinity_level += 1
            st.affinity_points -= 500
    st.streak = await compute_streak(db, user_id, tz)            # DẪN XUẤT, cache lại cho tiện

    persona = (
        await db.execute(select(Persona).where(Persona.key == st.persona_key))
    ).scalar_one_or_none()

    line = ""
    if is_new:
        dialogue = get_dialogue()
        line = await dialogue.generate(DialogueContext(
            persona_name=persona.name if persona else "Mèo Mun",
            persona_tag=persona.tag if persona else "cà khịa yêu",
            mood=st.mood,
            intimacy_level=st.affinity_level,
            event="praise",
            detail=f"Cưng vừa hoàn thành: {habit.name}",
        ))
    else:
        line = "Cưng khoe rồi mà 😝 nay giỏi rồi, mai làm tiếp cho em nha!"

    await db.commit()
    return KhoeOut(line=line, affinity_points=st.affinity_points, affinity_level=st.affinity_level, streak=st.streak)
