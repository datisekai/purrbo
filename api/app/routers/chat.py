from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.app.db import get_session
from api.app.deps import get_current_user, get_dialogue, get_memory
from api.app.models import ChatMessage, Persona, PersonaMemory, UserState
from api.app.schemas import ChatIn, ChatOut
from domain.ports import DialogueContext

router = APIRouter(tags=["chat"])


async def _memory(db: AsyncSession, user_id: str, persona_key: str) -> PersonaMemory:
    m = (
        await db.execute(
            select(PersonaMemory).where(PersonaMemory.user_id == user_id, PersonaMemory.persona_key == persona_key)
        )
    ).scalar_one_or_none()
    if m is None:
        m = PersonaMemory(user_id=user_id, persona_key=persona_key, summary="", msg_count=0)
        db.add(m)
    return m


@router.get("/chat")
async def history(user_id: str = Depends(get_current_user), db: AsyncSession = Depends(get_session)):
    rows = (
        await db.execute(
            select(ChatMessage).where(ChatMessage.user_id == user_id).order_by(ChatMessage.id).limit(200)
        )
    ).scalars().all()
    return [{"role": m.role, "text": m.text} for m in rows]


@router.post("/chat", response_model=ChatOut)
async def send(payload: ChatIn, user_id: str = Depends(get_current_user), db: AsyncSession = Depends(get_session)):
    db.add(ChatMessage(user_id=user_id, role="user", text=payload.text))

    st = await db.get(UserState, user_id) or UserState(user_id=user_id)
    persona = (
        await db.execute(select(Persona).where(Persona.key == st.persona_key))
    ).scalar_one_or_none()
    pname = persona.name if persona else "Mèo Mun"

    recent = (
        await db.execute(
            select(ChatMessage).where(ChatMessage.user_id == user_id).order_by(ChatMessage.id.desc()).limit(6)
        )
    ).scalars().all()
    recent_lines = [f"{m.role}: {m.text}" for m in reversed(recent)]

    mem = await _memory(db, user_id, st.persona_key)                 # AD-11: trí nhớ bền
    memory_ctx = ([f"[Ghi nhớ] {mem.summary}"] if mem.summary else []) + recent_lines

    dialogue = get_dialogue()
    reply = await dialogue.generate(DialogueContext(
        persona_name=pname,
        persona_tag=persona.tag if persona else "cà khịa yêu",
        persona_variant=persona.variant if persona else "mun",
        mood=st.mood,
        intimacy_level=st.affinity_level,
        event="reply",
        detail=payload.text,
        memory=memory_ctx,
    ))
    db.add(ChatMessage(user_id=user_id, role="persona", text=reply))

    # Cứ ~6 tin thì cô đọng lại tóm tắt (giảm cost, vẫn giữ moat)
    mem.msg_count += 1
    if mem.msg_count % 6 == 0:
        mem.summary = await get_memory().summarize(pname, mem.summary, recent_lines + [f"user: {payload.text}"])

    await db.commit()
    return ChatOut(reply=reply)
