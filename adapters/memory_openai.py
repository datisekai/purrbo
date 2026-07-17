"""Tóm tắt trí nhớ bằng OpenAI (gpt-4o-mini)."""
from __future__ import annotations

import os

from openai import AsyncOpenAI

from adapters._openai_limit import OPENAI_SEMAPHORE

_MODEL = os.environ.get("OPENAI_MEMORY_MODEL", "gpt-4o-mini")

_SYSTEM = (
    "Bạn cô đọng những điều nhân vật '{name}' nên GHI NHỚ về người dùng (sở thích, thói quen, "
    "chuyện đã hứa, cảm xúc, biệt danh). Gộp với tóm tắt cũ, bỏ trùng, giữ <=120 từ tiếng Việt. "
    "Chỉ trả về đoạn tóm tắt, không lời dẫn."
)


class OpenAIMemory:
    def __init__(self, api_key: str | None = None) -> None:
        self._client = AsyncOpenAI(api_key=api_key or os.environ.get("OPENAI_API_KEY"), timeout=8.0, max_retries=1)

    async def summarize(self, persona_name: str, old_summary: str, messages: list[str]) -> str:
        content = f"Tóm tắt cũ: {old_summary or '(chưa có)'}\n\nHội thoại gần đây:\n" + "\n".join(messages)
        async with OPENAI_SEMAPHORE:
            resp = await self._client.chat.completions.create(
                model=_MODEL,
                temperature=0.3,
                max_tokens=220,
                messages=[
                    {"role": "system", "content": _SYSTEM.format(name=persona_name)},
                    {"role": "user", "content": content},
                ],
            )
        return (resp.choices[0].message.content or old_summary).strip()
