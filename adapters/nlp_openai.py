"""Parse lịch bằng OpenAI (gpt-4o-mini, JSON mode)."""
from __future__ import annotations

import json
import os

from openai import AsyncOpenAI

_MODEL = os.environ.get("OPENAI_NLP_MODEL", "gpt-4o-mini")

_SYSTEM = (
    "Bạn tách một câu tiếng Việt tự nhiên thành lịch. Trả JSON đúng khoá: "
    '{"name": "việc gì", "time": "thời gian (vd \'mai 07:00\')", "place": "địa điểm", '
    '"withwho": "với ai", "remind": "nhắc trước bao lâu"}. '
    "Không đoán 'remind' nếu câu không nói (để rỗng). Field không có thì để chuỗi rỗng."
)


class OpenAISchedule:
    def __init__(self, api_key: str | None = None) -> None:
        self._client = AsyncOpenAI(api_key=api_key or os.environ.get("OPENAI_API_KEY"), timeout=8.0, max_retries=1)

    async def parse(self, text: str) -> dict:
        resp = await self._client.chat.completions.create(
            model=_MODEL,
            temperature=0,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": _SYSTEM},
                {"role": "user", "content": text},
            ],
        )
        try:
            data = json.loads(resp.choices[0].message.content or "{}")
        except json.JSONDecodeError:
            data = {}
        out = {
            "name": (data.get("name") or text).strip(),
            "time": (data.get("time") or "").strip(),
            "place": (data.get("place") or "").strip(),
            "withwho": (data.get("withwho") or "").strip(),
            "remind": (data.get("remind") or "").strip(),
        }
        out["missing"] = [f for f in ("remind",) if not out[f]]
        return out
