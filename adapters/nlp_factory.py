"""Chọn adapter parse lịch + fallback (AD-7). OpenAI lỗi → rơi về heuristic mock."""
from __future__ import annotations

import os

from domain.ports import SchedulePort


class _Resilient:
    def __init__(self, primary: SchedulePort, fallback: SchedulePort) -> None:
        self._p = primary
        self._f = fallback

    async def parse(self, text: str, now: str = "") -> dict:
        try:
            return await self._p.parse(text, now)
        except Exception:
            return await self._f.parse(text, now)


def make_schedule() -> SchedulePort:
    from adapters.nlp_mock import MockSchedule
    mock = MockSchedule()
    provider = os.environ.get("NLP_PROVIDER", "openai").lower()
    if provider != "mock" and os.environ.get("OPENAI_API_KEY"):
        from adapters.nlp_openai import OpenAISchedule
        return _Resilient(OpenAISchedule(), mock)
    return mock
