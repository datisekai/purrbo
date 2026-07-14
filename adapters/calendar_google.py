"""Google Calendar thật (read-only) — AD-13.

Nhận access_token (OAuth scope calendar.readonly) do app lấy được rồi gọi
Calendar API v3. Không lưu token server-side: app truyền theo từng request.
Không có token → trả [] (thành thật, không bịa event).
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

import httpx

from domain.ports import CalendarEvent

_API = "https://www.googleapis.com/calendar/v3/calendars/primary/events"


class GoogleCalendar:
    async def list_events(self, access_token: str) -> list[CalendarEvent]:
        if not access_token:
            return []
        now = datetime.now(timezone.utc)
        params = {
            "timeMin": now.isoformat(),
            "timeMax": (now + timedelta(days=7)).isoformat(),
            "singleEvents": "true",
            "orderBy": "startTime",
            "maxResults": "20",
        }
        headers = {"Authorization": f"Bearer {access_token}"}
        async with httpx.AsyncClient(timeout=10) as c:
            r = await c.get(_API, params=params, headers=headers)
        if r.status_code != 200:
            # token hết hạn / thiếu scope → coi như chưa có gì (app sẽ báo kết nối lại)
            return []
        out: list[CalendarEvent] = []
        for it in r.json().get("items", []):
            start = it.get("start", {})
            out.append(
                CalendarEvent(
                    title=it.get("summary", "(không tiêu đề)"),
                    start=start.get("dateTime") or start.get("date") or "",
                    location=it.get("location", "") or "",
                )
            )
        return out
