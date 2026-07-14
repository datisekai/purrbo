"""Chọn adapter calendar (AD-13). CALENDAR_PROVIDER=google|mock (mặc định google).

Adapter stateless: access_token của user truyền theo từng request (app tự OAuth
scope calendar.readonly, backend KHÔNG lưu token). Không token → GoogleCalendar
trả [] (thành thật); đặt CALENDAR_PROVIDER=mock để demo có event mẫu.
"""
from __future__ import annotations

import os

from domain.ports import CalendarPort


def make_calendar(provider: str = "") -> CalendarPort:
    provider = (provider or os.getenv("CALENDAR_PROVIDER", "google")).lower()
    if provider == "mock":
        from adapters.calendar_mock import MockCalendar
        return MockCalendar()
    if provider == "lark":
        from adapters.calendar_lark import LarkCalendar
        return LarkCalendar()
    from adapters.calendar_google import GoogleCalendar
    return GoogleCalendar()
