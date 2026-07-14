"""Tóm tắt trí nhớ kiểu đơn giản — dev không cần key."""
from __future__ import annotations


class MockMemory:
    async def summarize(self, persona_name: str, old_summary: str, messages: list[str]) -> str:
        user_lines = [m.split("user:", 1)[1].strip() for m in messages if m.startswith("user:")]
        joined = " · ".join(user_lines[-4:])
        return (old_summary + " · " + joined).strip(" ·")[:600]
