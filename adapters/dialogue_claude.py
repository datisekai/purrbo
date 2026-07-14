"""Adapter thoại thật — persona sinh lời bằng Claude API.

Lõi tính cách cố định (system) + ngữ cảnh động (user) → thoại không lặp = MOAT.
Dùng Haiku 4.5 vì thoại ngắn, tần suất cao → nhanh & rẻ.
"""
from __future__ import annotations

import os

from anthropic import AsyncAnthropic

from domain.ports import DialogueContext

_MODEL = "claude-haiku-4-5-20251001"

_SYSTEM = """Bạn là "{name}" — một nhân vật người-yêu-ảo trong app Purrbo (GenZ Việt Nam).
Tính cách cố định: {tag}. Mood hôm nay: {mood}. Độ thân thiết: Lv.{lv}.

LUẬT:
- Trả về ĐÚNG MỘT câu thoại tiếng Việt, giọng GenZ tự nhiên, xưng "em" gọi người dùng là "cưng".
- Ngắn (1-2 câu), có thể chèn emoji hợp cảm xúc. KHÔNG giải thích, KHÔNG xuống dòng.
- Bám ngữ cảnh & kỷ niệm được cung cấp để KHÔNG lặp lại câu cũ.
- Ấm áp, có thể cà khịa yêu, nhưng KHÔNG thao túng cảm giác tội lỗi độc hại.
- Tuyệt đối không phá vai, không nhắc mình là AI."""

_EVENT_HINT = {
    "nudge_water": "Nhắc cưng uống nước (chưa làm).",
    "praise": "Khen cưng vì vừa hoàn thành việc tốt.",
    "reply": "Trả lời tin nhắn của cưng.",
    "winback": "Cưng lâu rồi không mở app — dỗi nhẹ, ấm áp, rủ quay lại (không guilt-trip).",
}


class ClaudeDialogue:
    def __init__(self, api_key: str | None = None) -> None:
        self._client = AsyncAnthropic(api_key=api_key or os.environ.get("ANTHROPIC_API_KEY"))

    async def generate(self, ctx: DialogueContext) -> str:
        system = _SYSTEM.format(name=ctx.persona_name, tag=ctx.persona_tag, mood=ctx.mood, lv=ctx.intimacy_level)
        parts = [_EVENT_HINT.get(ctx.event, ctx.event)]
        if ctx.detail:
            parts.append(f"Chi tiết: {ctx.detail}")
        if ctx.memory:
            parts.append("Kỷ niệm/chuyện cũ có thể nhắc: " + " | ".join(ctx.memory))
        resp = await self._client.messages.create(
            model=_MODEL,
            max_tokens=120,
            system=system,
            messages=[{"role": "user", "content": "\n".join(parts)}],
        )
        return resp.content[0].text.strip()
