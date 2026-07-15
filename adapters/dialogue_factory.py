"""Chọn adapter thoại + bọc fallback (AD-7).

DIALOGUE_PROVIDER = openai (mặc định) | claude | mock
Nếu adapter thật lỗi/timeout → tự rơi về câu mẫu (mock) để không bao giờ treo/trắng.
"""
from __future__ import annotations

import os

from domain.ports import DialogueContext, DialoguePort


class _HonestFallback:
    """Khi provider thật lỗi/timeout — nói THẬT là đang lag, KHÔNG giả vờ trả lời
    bằng câu mẫu cứng (tránh persona 'bịa' nội dung không đúng ngữ cảnh)."""

    _LAG = {
        "praise": "Cưng vừa làm xong hả 🥹 mạng em lag mất câu khen rồi — nhưng cưng giỏi lắm nha, thử lại để em nói tử tế hơn 💗",
        "reply": "Em hơi lag xíu 😿 nhắn lại giúp em nha~",
        "nudge_water": "Nhớ chăm bản thân nha cưng 💧 (em đang lag chút, lát nhắc kỹ hơn)",
        "winback": "Em vẫn nhớ cưng lắm 🥺 (mạng hơi lag — quay lại với em nha)",
    }

    async def generate(self, ctx: DialogueContext) -> str:
        return self._LAG.get(ctx.event, "Em hơi lag xíu 😿 thử lại giúp em nha~")


class _Resilient:
    def __init__(self, primary: DialoguePort, fallback: DialoguePort) -> None:
        self._p = primary
        self._f = fallback

    async def generate(self, ctx: DialogueContext) -> str:
        try:
            out = await self._p.generate(ctx)
            return out or await self._f.generate(ctx)
        except Exception:
            return await self._f.generate(ctx)


def make_dialogue() -> DialoguePort:
    provider = os.environ.get("DIALOGUE_PROVIDER", "openai").lower()

    # provider=mock (dev không key) → dùng câu mẫu thật sự.
    if provider == "mock":
        from adapters.dialogue_mock import MockDialogue
        return MockDialogue()

    # provider thật → fallback lỗi là câu "đang lag" HONEST, không bịa nội dung.
    honest = _HonestFallback()
    if provider == "claude" and os.environ.get("ANTHROPIC_API_KEY"):
        from adapters.dialogue_claude import ClaudeDialogue
        return _Resilient(ClaudeDialogue(), honest)
    if os.environ.get("OPENAI_API_KEY"):
        from adapters.dialogue_openai import OpenAIDialogue
        return _Resilient(OpenAIDialogue(), honest)

    # Không có key nào → về mock (dev).
    from adapters.dialogue_mock import MockDialogue
    return MockDialogue()
