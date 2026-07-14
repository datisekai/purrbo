"""Lark (Feishu) Calendar — read-only. AD-13.

Nhận user_access_token (OAuth Lark) → lấy calendar chính → list event 7 ngày tới.
Không token → []. Miền quốc tế mặc định open.larksuite.com (đổi qua LARK_BASE
nếu dùng feishu.cn).
"""
from __future__ import annotations

import os
import time

import httpx

from domain.ports import CalendarEvent

_BASE = os.getenv("LARK_BASE", "https://open.larksuite.com")


class LarkCalendar:
    async def list_events(self, access_token: str) -> list[CalendarEvent]:
        if not access_token:
            return []
        headers = {"Authorization": f"Bearer {access_token}"}
        now = int(time.time())
        week = now + 7 * 24 * 3600
        async with httpx.AsyncClient(timeout=10, base_url=_BASE) as c:
            # 1) calendar chính
            r = await c.get("/open-apis/calendar/v4/calendars/primary", headers=headers)
            if r.status_code != 200:
                return []
            data = r.json().get("data", {})
            cals = data.get("calendars") or data.get("items") or []
            cal_id = None
            for it in cals:
                cal_id = it.get("calendar", {}).get("calendar_id") or it.get("calendar_id")
                if cal_id:
                    break
            if not cal_id:
                return []
            # 2) event trong 7 ngày
            r2 = await c.get(
                f"/open-apis/calendar/v4/calendars/{cal_id}/events",
                headers=headers,
                params={"start_time": str(now), "end_time": str(week), "page_size": 50},
            )
            if r2.status_code != 200:
                return []
            items = r2.json().get("data", {}).get("items", [])
        out: list[CalendarEvent] = []
        for e in items:
            st = e.get("start_time", {})
            ts = st.get("timestamp")
            start = ""
            if ts:
                try:
                    from datetime import datetime, timezone
                    start = datetime.fromtimestamp(int(ts), tz=timezone.utc).isoformat()
                except Exception:
                    start = ""
            out.append(CalendarEvent(title=e.get("summary", "(không tiêu đề)"), start=start, location=e.get("location", {}).get("name", "") or ""))
        return out
