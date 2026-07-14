"""Calendar mock — dev không cần Google. (Google thật: calendar_google.py sau.)"""
from __future__ import annotations

from domain.ports import CalendarEvent


class MockCalendar:
    async def list_events(self, access_token: str) -> list[CalendarEvent]:
        return [
            CalendarEvent(title="Họp nhóm", start="2026-07-13T09:00:00", location="Google Meet"),
            CalendarEvent(title="Cà phê với crush", start="2026-07-13T15:00:00", location="The Coffee House"),
        ]
