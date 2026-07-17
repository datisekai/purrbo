from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.app.ai_cap import ai_call_allowed
from api.app.db import SessionLocal, get_session
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
    st = await db.get(UserState, user_id)
    pkey = st.persona_key if st else ""
    rows = (
        await db.execute(
            select(ChatMessage)
            .where(ChatMessage.user_id == user_id, ChatMessage.persona_key == pkey)
            .order_by(ChatMessage.id).limit(200)
        )
    ).scalars().all()
    return [{"role": m.role, "text": m.text} for m in rows]


@router.post("/chat", response_model=ChatOut)
async def send(payload: ChatIn, user_id: str = Depends(get_current_user), db: AsyncSession = Depends(get_session)):
    st = await db.get(UserState, user_id) or UserState(user_id=user_id)
    pkey = st.persona_key or ""
    db.add(ChatMessage(user_id=user_id, role="user", text=payload.text, persona_key=pkey))

    persona = (
        await db.execute(select(Persona).where(Persona.key == st.persona_key))
    ).scalar_one_or_none()
    pname = persona.name if persona else "Mèo Mun"

    recent = (
        await db.execute(
            select(ChatMessage)
            .where(ChatMessage.user_id == user_id, ChatMessage.persona_key == pkey)
            .order_by(ChatMessage.id.desc()).limit(6)
        )
    ).scalars().all()
    recent_lines = [f"{m.role}: {m.text}" for m in reversed(recent)]

    mem = await _memory(db, user_id, st.persona_key)                 # AD-11: trí nhớ bền
    memory_ctx = ([f"[Ghi nhớ] {mem.summary}"] if mem.summary else []) + recent_lines
    mem_summary = mem.summary

    ptag = persona.tag if persona else "cà khịa yêu"
    pvariant = persona.variant if persona else "mun"
    mood, lvl = st.mood, st.affinity_level

    # Chốt tin nhắn user + counter trần AI, commit+đóng session TRƯỚC khi chờ OpenAI
    # (có thể mất tới 8s) — nhả connection về pool thay vì giữ suốt lúc chờ AI, đây
    # là thứ giới hạn trần CCU thật sự khi nhiều người chat cùng lúc.
    ai_ok = await ai_call_allowed(st)
    await db.commit()
    await db.close()

    if ai_ok:
        dialogue = get_dialogue()
        reply = await dialogue.generate(DialogueContext(
            persona_name=pname,
            persona_tag=ptag,
            persona_variant=pvariant,
            mood=mood,
            intimacy_level=lvl,
            event="reply",
            detail=payload.text,
            memory=memory_ctx,
        ))
    else:
        reply = "Cưng ơi hôm nay em nói chuyện nhiều quá rồi, mai tám tiếp nha 🥹"

    # Session MỚI — session cũ đã đóng trong lúc chờ AI ở trên, không đứng đợi.
    async with SessionLocal() as db2:
        db2.add(ChatMessage(user_id=user_id, role="persona", text=reply, persona_key=pkey))
        mem2 = await _memory(db2, user_id, pkey)
        mem2.msg_count += 1
        # Cứ ~6 tin thì cô đọng lại tóm tắt (giảm cost, vẫn giữ moat) — bỏ qua nếu
        # đã chạm trần AI ở trên (khỏi tốn thêm 1 call OpenAI nữa).
        if ai_ok and mem2.msg_count % 6 == 0:
            mem2.summary = await get_memory().summarize(pname, mem_summary, recent_lines + [f"user: {payload.text}"])
        await db2.commit()

    return ChatOut(reply=reply)
