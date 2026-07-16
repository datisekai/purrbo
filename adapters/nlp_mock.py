"""Parse lịch kiểu heuristic — chạy dev không cần API key (fallback của OpenAI)."""
from __future__ import annotations

import re
from datetime import datetime, timedelta

try:
    from zoneinfo import ZoneInfo
    _VN = ZoneInfo("Asia/Ho_Chi_Minh")
except Exception:
    from datetime import timezone
    _VN = timezone(timedelta(hours=7))

# Tên thứ đầy đủ → index (0=T2..6=CN). "cn" xử lý riêng bằng \bcn\b (tránh 'picnic').
_WD = {"thứ 2": 0, "thứ hai": 0, "thứ 3": 1, "thứ ba": 1, "thứ 4": 2, "thứ tư": 2,
       "thứ 5": 3, "thứ năm": 3, "thứ 6": 4, "thứ sáu": 4, "thứ 7": 5, "thứ bảy": 5,
       "chủ nhật": 6}


def _now(now_iso: str) -> datetime:
    if now_iso:
        try:
            return datetime.fromisoformat(now_iso.replace("Z", "+00:00")).astimezone(_VN)
        except ValueError:
            pass
    return datetime.now(_VN)


def _weekdays(low: str) -> list[int]:
    """Trích các thứ trong text → [0..6]. Hiểu cả 'thứ 3 5 7' (rút gọn) lẫn 'thứ 3 thứ 5'."""
    days: set[int] = set()
    m = re.search(r"thứ\s*((?:\d\s*){1,7})", low)   # cụm số sau 'thứ' → 'thứ 3 5 7'
    if m:
        for x in re.findall(r"\d", m.group(1)):
            n = int(x)
            if 2 <= n <= 7:
                days.add(n - 2)          # thứ 2→0 .. thứ 7→5
    for k, v in _WD.items():
        if k in low:
            days.add(v)
    if "chủ nhật" in low or re.search(r"\bcn\b", low):
        days.add(6)
    return sorted(days)


def _parse_time(t: str, low: str) -> str:
    """'7h'→07:00 · '7h30'→07:30 · '7h5'→07:05 · '18:30'→18:30 · '7h tối'→19:00 · '3h chiều'→15:00."""
    m = re.search(r"(\d{1,2})[h:](\d{1,2})?", t)
    if not m:
        return ""
    h = int(m.group(1))
    mm = f"{int(m.group(2)):02d}" if m.group(2) else "00"
    if h < 12 and ("tối" in low or "đêm" in low or "chiều" in low):
        h += 12                          # quy đổi buổi → 24h
    if h > 23:
        h = h % 24
    return f"{h:02d}:{mm}"


def _repeat(low: str, base: datetime) -> str:
    mh = re.search(r"mỗi\s*(\d{1,2})\s*(tiếng|h|giờ)", low)   # lặp theo giờ
    if mh:
        return "hours:" + mh.group(1)
    if any(x in low for x in ("hàng ngày", "mỗi ngày", "mỗi sáng", "mỗi tối", "mỗi trưa", "mỗi chiều")):
        return "daily"
    wdays = _weekdays(low)
    if ("hàng tuần" in low or "mỗi" in low) and wdays:       # lặp theo thứ
        return "weekly:" + ",".join(map(str, wdays))
    if any(x in low for x in ("hôm nay", "sáng nay", "trưa nay", "chiều nay", "tối nay")):
        return "once:" + base.strftime("%Y-%m-%d")
    if "ngày mai" in low or re.search(r"\bmai\b", low):
        return "once:" + (base + timedelta(days=1)).strftime("%Y-%m-%d")
    if "mốt" in low or "ngày kia" in low:
        return "once:" + (base + timedelta(days=2)).strftime("%Y-%m-%d")
    if "cuối tuần" in low:               # T7 tuần này
        return "once:" + (base + timedelta(days=(5 - base.weekday()) % 7)).strftime("%Y-%m-%d")
    if wdays:                            # thứ cụ thể (KHÔNG lặp) → once; hiểu tuần này/sau
        wd = wdays[0]
        monday_this = base - timedelta(days=base.weekday())
        if "tuần sau" in low or "tuần tới" in low:
            target = monday_this + timedelta(days=7 + wd)
        elif "tuần này" in low:
            target = monday_this + timedelta(days=wd)
        else:
            target = base + timedelta(days=(wd - base.weekday()) % 7)   # gần nhất tương lai
        return "once:" + target.strftime("%Y-%m-%d")
    # KHÔNG có từ lặp/ngày → MỘT LẦN hôm nay (KHÔNG tự lặp hằng ngày).
    return "once:" + base.strftime("%Y-%m-%d")


class MockSchedule:
    async def parse(self, text: str, now: str = "") -> dict:
        t = (text or "").strip()
        low = t.lower()
        base = _now(now)

        repeat = _repeat(low, base)
        time = "" if repeat.startswith("hours:") else _parse_time(t, low)

        place = ""
        mp = re.search(r"(?:ở|tại)\s+(.+)$", t)
        if mp:
            place = mp.group(1).strip()

        who = ""
        mw = re.search(r"với\s+([^ở,]+)", t)
        if mw:
            who = mw.group(1).replace(place, "").strip(" ,")

        name = re.sub(
            r"(sáng nay|trưa nay|chiều nay|tối nay|hôm nay|ngày mai|mai|mốt|ngày kia|cuối tuần|"
            r"tuần này|tuần sau|tuần tới|thứ\s*[\d\s]+|chủ nhật|mỗi\s*\d*\s*(tiếng|giờ|ngày|sáng|tối|trưa|chiều)|"
            r"hàng ngày|hàng tuần|\d{1,2}[h:]\d{0,2}|sáng|chiều|tối|đêm)",
            "", t, flags=re.I,
        )
        name = re.sub(r"(với|ở|tại).*", "", name).strip(" ,")
        if not name:
            name = t

        return {"name": name, "time": time, "repeat": repeat,
                "place": place, "withwho": who, "remind": "", "missing": ["remind"]}
