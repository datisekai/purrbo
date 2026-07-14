"""Chọn adapter thoại + bọc fallback (AD-7).

DIALOGUE_PROVIDER = openai (mặc định) | claude | mock
Nếu adapter thật lỗi/timeout → tự rơi về câu mẫu (mock) để không bao giờ treo/trắng.
"""
from __future__ import annotations

import os

from domain.ports import DialogueContext, DialoguePort


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
    from adapters.dialogue_mock import MockDialogue
    mock = MockDialogue()
    provider = os.environ.get("DIALOGUE_PROVIDER", "openai").lower()

    if provider == "mock":
        return mock
    if provider == "claude" and os.environ.get("ANTHROPIC_API_KEY"):
        from adapters.dialogue_claude import ClaudeDialogue
        return _Resilient(ClaudeDialogue(), mock)
    if os.environ.get("OPENAI_API_KEY"):
        from adapters.dialogue_openai import OpenAIDialogue
        return _Resilient(OpenAIDialogue(), mock)
    return mock
