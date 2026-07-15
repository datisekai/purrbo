"""Parse lịch kiểu heuristic — chạy dev không cần API key."""
from __future__ import annotations

import re
from datetime import datetime, timedelta

try:
    from zoneinfo import ZoneInfo
    _VN = ZoneInfo("Asia/Ho_Chi_Minh")
except Exception:
    from datetime import timezone
    _VN = timezone(timedelta(hours=7))

_WD = {"thứ 2": 0, "thứ hai": 0, "thứ 3": 1, "thứ ba": 1, "thứ 4": 2, "thứ tư": 2,
       "thứ 5": 3, "thứ năm": 3, "thứ 6": 4, "thứ sáu": 4, "thứ 7": 5, "thứ bảy": 5,
       "chủ nhật": 6, "cn": 6}


def _now(now_iso: str) -> datetime:
    if now_iso:
        try:
            return datetime.fromisoformat(now_iso.replace("Z", "+00:00")).astimezone(_VN)
        except ValueError:
            pass
    return datetime.now(_VN)


def _repeat(low: str, base: datetime) -> str:
    mh = re.search(r"mỗi\s*(\d{1,2})\s*(tiếng|h|giờ)", low)
    if mh:
        return "hours:" + mh.group(1)
    if "hàng ngày" in low or "mỗi ngày" in low or "mỗi sáng" in low or "mỗi tối" in low or "mỗi trưa" in low:
        return "daily"
    # thứ trong tuần lặp lại (có 'hàng tuần'/'mỗi')
    if "hàng tuần" in low or ("mỗi" in low and any(k in low for k in _WD)):
        days = sorted({v for k, v in _WD.items() if k in low})
        if days:
            return "weekly:" + ",".join(map(str, days))
    # một ngày cụ thể
    if "hôm nay" in low or "sáng nay" in low or "trưa nay" in low or "chiều nay" in low or "tối nay" in low:
        return "once:" + base.strftime("%Y-%m-%d")
    if "ngày mai" in low or re.search(r"\bmai\b", low):
        return "once:" + (base + timedelta(days=1)).strftime("%Y-%m-%d")
    if "mốt" in low or "ngày kia" in low:
        return "once:" + (base + timedelta(days=2)).strftime("%Y-%m-%d")
    for k, wd in _WD.items():
        if k in low:  # "thứ 7 tuần này" (không 'mỗi') → once vào thứ đó
            delta = (wd - base.weekday()) % 7
            return "once:" + (base + timedelta(days=delta)).strftime("%Y-%m-%d")
    return "daily"


class MockSchedule:
    async def parse(self, text: str, now: str = "") -> dict:
        t = (text or "").strip()
        low = t.lower()
        base = _now(now)

        time = ""
        m = re.search(r"(\d{1,2})[h:](\d{2})?", t)
        if m:
            time = f"{int(m.group(1)):02d}:{m.group(2) or '00'}"

        place = ""
        mp = re.search(r"(?:ở|tại)\s+(.+)$", t)
        if mp:
            place = mp.group(1).strip()

        who = ""
        mw = re.search(r"với\s+([^ở,]+)", t)
        if mw:
            who = mw.group(1).replace(place, "").strip(" ,")

        name = re.sub(r"(sáng nay|trưa nay|chiều nay|tối nay|hôm nay|ngày mai|mai|mốt|thứ\s*\w+|chủ nhật|mỗi\s*\d*\s*(tiếng|giờ|ngày|sáng|tối|trưa)|hàng ngày|hàng tuần|\d{1,2}[h:]\d{0,2})", "", t, flags=re.I)
        name = re.sub(r"(với|ở|tại).*", "", name).strip(" ,")
        if not name:
            name = t

        return {"name": name, "time": time, "repeat": _repeat(low, base),
                "place": place, "withwho": who, "remind": "", "missing": ["remind"]}
