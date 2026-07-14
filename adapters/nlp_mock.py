"""Parse lịch kiểu heuristic — chạy dev không cần API key."""
from __future__ import annotations

import re


class MockSchedule:
    async def parse(self, text: str) -> dict:
        t = (text or "").strip()
        low = t.lower()

        time = ""
        m = re.search(r"(\d{1,2}h(\d{2})?|\d{1,2}:\d{2})", t)
        if m:
            time = m.group(0)
        for kw in ("mai", "sáng", "chiều", "tối", "hôm nay"):
            if kw in low:
                time = (kw + " " + time).strip()
                break

        place = ""
        mp = re.search(r"(?:ở|tại)\s+(.+)$", t)
        if mp:
            place = mp.group(1).strip()

        who = ""
        mw = re.search(r"với\s+([^ở,]+)", t)
        if mw:
            who = mw.group(1).replace(place, "").strip(" ,")

        name = re.sub(r"(mai|sáng|chiều|tối|hôm nay|\d{1,2}h(\d{2})?|\d{1,2}:\d{2})", "", t, flags=re.I)
        name = re.sub(r"(với|ở|tại).*", "", name).strip(" ,")
        if not name:
            name = t

        missing = [] if False else ["remind"]  # 'nhắc trước bao lâu' luôn cần hỏi thêm
        return {"name": name, "time": time, "place": place, "withwho": who, "remind": "", "missing": missing}
