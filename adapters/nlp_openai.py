"""Parse lịch bằng OpenAI (gpt-4o-mini, JSON mode) — resolve ngày tương đối + repeat."""
from __future__ import annotations

import json
import os
from datetime import datetime

from openai import AsyncOpenAI

_MODEL = os.environ.get("OPENAI_NLP_MODEL", "gpt-4o-mini")
_WD_VI = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"]


def _today(now_iso: str) -> datetime:
    if now_iso:
        try:
            return datetime.fromisoformat(now_iso.replace("Z", "+00:00"))
        except ValueError:
            pass
    return datetime.now()


def _system(d: datetime) -> str:
    wd = _WD_VI[d.weekday()]
    return (
        f"Hôm nay là {d.strftime('%Y-%m-%d')} ({wd}). "
        "Bạn tách một câu tiếng Việt thành lịch nhắc. Trả JSON đúng các khoá: "
        '{"name","time","repeat","place","withwho","remind"}.\n'
        "- name: việc gì, ngắn gọn, BỎ phần thời gian.\n"
        "- time: giờ dạng HH:MM 24h (vd '18:00','07:30'); rỗng nếu không có giờ hoặc lặp theo tiếng.\n"
        "- repeat: một trong:\n"
        "    'once:YYYY-MM-DD'  → nếu nói MỘT ngày cụ thể (hôm nay/mai/mốt/thứ X tuần này/ngày dd-mm). "
        "Tự TÍNH ngày ra từ hôm nay ở trên.\n"
        "    'daily'            → lặp hằng ngày (mỗi ngày/hàng ngày/mỗi sáng/mỗi tối).\n"
        "    'weekly:d1,d2'     → lặp theo thứ (thứ 3 5 7 hàng tuần / mỗi thứ 7). d: 0=T2,1=T3,2=T4,3=T5,4=T6,5=T7,6=CN.\n"
        "    'hours:N'          → mỗi N tiếng (mỗi 2 tiếng). time để rỗng.\n"
        "  Không rõ có lặp không → mặc định 'daily'.\n"
        "- place, withwho: rỗng nếu không có. remind: chỉ điền nếu câu nói rõ, không thì rỗng."
    )


class OpenAISchedule:
    def __init__(self, api_key: str | None = None) -> None:
        self._client = AsyncOpenAI(api_key=api_key or os.environ.get("OPENAI_API_KEY"), timeout=8.0, max_retries=1)

    async def parse(self, text: str, now: str = "") -> dict:
        resp = await self._client.chat.completions.create(
            model=_MODEL,
            temperature=0,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": _system(_today(now))},
                {"role": "user", "content": text},
            ],
        )
        try:
            data = json.loads(resp.choices[0].message.content or "{}")
        except json.JSONDecodeError:
            data = {}
        repeat = (data.get("repeat") or "daily").strip() or "daily"
        out = {
            "name": (data.get("name") or text).strip(),
            "time": (data.get("time") or "").strip(),
            "repeat": repeat,
            "place": (data.get("place") or "").strip(),
            "withwho": (data.get("withwho") or "").strip(),
            "remind": (data.get("remind") or "").strip(),
        }
        out["missing"] = [f for f in ("remind",) if not out[f]]
        return out
