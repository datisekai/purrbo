"""Chọn adapter memory + fallback (AD-7/AD-11)."""
from __future__ import annotations

import os

from domain.ports import MemoryPort


class _Resilient:
    def __init__(self, primary: MemoryPort, fallback: MemoryPort) -> None:
        self._p, self._f = primary, fallback

    async def summarize(self, persona_name: str, old_summary: str, messages: list[str]) -> str:
        try:
            return await self._p.summarize(persona_name, old_summary, messages)
        except Exception:
            return await self._f.summarize(persona_name, old_summary, messages)


def make_memory() -> MemoryPort:
    from adapters.memory_mock import MockMemory
    mock = MockMemory()
    if os.environ.get("MEMORY_PROVIDER", "openai").lower() != "mock" and os.environ.get("OPENAI_API_KEY"):
        from adapters.memory_openai import OpenAIMemory
        return _Resilient(OpenAIMemory(), mock)
    return mock
