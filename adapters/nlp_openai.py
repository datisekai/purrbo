"""Parse lịch bằng OpenAI (gpt-4o-mini, JSON mode) — resolve ngày tương đối + repeat."""
from __future__ import annotations

import json
import os
from datetime import datetime, timedelta

try:
    from zoneinfo import ZoneInfo
    _VN = ZoneInfo("Asia/Ho_Chi_Minh")
except Exception:  # thiếu tzdata → fallback offset cứng +7
    from datetime import timezone
    _VN = timezone(timedelta(hours=7))

from openai import AsyncOpenAI

from adapters._openai_limit import OPENAI_SEMAPHORE

_MODEL = os.environ.get("OPENAI_NLP_MODEL", "gpt-4o-mini")
_WD_VI = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"]


def _today(now_iso: str) -> datetime:
    # Client gửi UTC (toISOString) → quy về giờ VN để 'hôm nay' đúng quanh nửa đêm.
    if now_iso:
        try:
            return datetime.fromisoformat(now_iso.replace("Z", "+00:00")).astimezone(_VN)
        except ValueError:
            pass
    return datetime.now(_VN)


def _week_table(d: datetime) -> str:
    monday = d - timedelta(days=d.weekday())
    this_w = " · ".join(f"{_WD_VI[i]}={(monday + timedelta(days=i)).strftime('%Y-%m-%d')}" for i in range(7))
    next_w = " · ".join(f"{_WD_VI[i]}={(monday + timedelta(days=i + 7)).strftime('%Y-%m-%d')}" for i in range(7))
    return f"Tuần NÀY: {this_w}\nTuần SAU: {next_w}"


def _system(d: datetime) -> str:
    wd = _WD_VI[d.weekday()]
    return (
        f"Hôm nay là {d.strftime('%Y-%m-%d')} ({wd}).\n{_week_table(d)}\n"
        "Dùng đúng bảng trên để ra ngày — 'thứ X tuần này/tuần sau' TRA THẲNG bảng, ĐỪNG tự tính. "
        "'mai'=hôm nay+1, 'mốt'=hôm nay+2, 'cuối tuần'=T7 tuần này.\n"
        "Bạn tách một câu tiếng Việt thành lịch nhắc. Trả JSON đúng các khoá: "
        '{"name","time","repeat","place","withwho","remind"}.\n'
        "- name: việc gì, ngắn gọn, BỎ phần thời gian.\n"
        "- time: giờ dạng HH:MM 24h. QUY ĐỔI buổi: '7h tối'=19:00, '8h tối'=20:00, '3h chiều'=15:00, "
        "'8h sáng'=08:00, '12h trưa'=12:00. Rỗng nếu không có giờ hoặc lặp theo tiếng.\n"
        "- repeat: một trong:\n"
        "    'once:YYYY-MM-DD'  → MỘT ngày cụ thể (hôm nay/mai/mốt/thứ X tuần này/tuần sau/ngày dd-mm). "
        "Tự TRA bảng tuần ở trên để ra ngày.\n"
        "    'daily'            → CHỈ khi có 'mỗi ngày/hàng ngày/mỗi sáng/mỗi tối'.\n"
        "    'weekly:d1,d2'     → lặp theo thứ ('thứ 3 5 7 hàng tuần'/'mỗi thứ 7'). d: 0=T2,1=T3,2=T4,3=T5,4=T6,5=T7,6=CN. "
        "'thứ 3 5 7' = weekly:1,3,5 (lấy ĐỦ các thứ).\n"
        "    'hours:N'          → mỗi N tiếng. time để rỗng.\n"
        "  QUAN TRỌNG: nếu KHÔNG có từ lặp rõ ('mỗi'/'hàng ngày'/'hàng tuần') → mặc định 'once' HÔM NAY "
        "(vd '18h tập gym' = once hôm nay, KHÔNG phải daily).\n"
        "- place, withwho: rỗng nếu không có. remind: chỉ điền nếu câu nói rõ, không thì rỗng."
    )


class OpenAISchedule:
    def __init__(self, api_key: str | None = None) -> None:
        self._client = AsyncOpenAI(api_key=api_key or os.environ.get("OPENAI_API_KEY"), timeout=8.0, max_retries=1)

    async def parse(self, text: str, now: str = "") -> dict:
        async with OPENAI_SEMAPHORE:
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
        # Fallback khi model trả rỗng: MỘT LẦN hôm nay (không tự lặp hằng ngày).
        today_once = "once:" + _today(now).strftime("%Y-%m-%d")
        repeat = (data.get("repeat") or "").strip() or today_once
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
