"""Ports — mọi phụ thuộc ngoài nằm sau interface (giống McUp AD-2).

Domain phụ thuộc các Protocol này, KHÔNG phụ thuộc adapter cụ thể.
Adapter (Claude, Expo Push, RevenueCat...) hiện thực chúng ở `adapters/`
và được tiêm vào từ ngoài. Đổi vendor = viết adapter mới, không sửa domain.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol


@dataclass
class DialogueContext:
    """Ngữ cảnh để persona sinh 1 câu thoại — càng giàu càng ít lặp."""
    persona_name: str
    persona_tag: str          # "cà khịa yêu · gắt gỏng dễ thương"
    mood: str                 # "gắt" | "dịu" | "vừa"
    intimacy_level: int       # 1..10 (Lv thân thiết)
    event: str                # "nudge_water" | "praise" | "reply" | "winback" ...
    persona_variant: str = "" # mun/cam/ly/sep/bong/xu/bo/sin → chọn VOICE riêng
    detail: str = ""          # việc cụ thể / tin nhắn user
    memory: list[str] | None = None   # vài kỷ niệm/chuyện cũ để nhắc lại


class DialoguePort(Protocol):
    """Sinh lời thoại persona (Claude hôm nay, đổi model sau).

    Đây là MOAT: thoại động theo ngữ cảnh + lõi tính cách cố định → không lặp.
    """
    async def generate(self, ctx: DialogueContext) -> str: ...


class SchedulePort(Protocol):
    """Tách lịch từ ngôn ngữ tự nhiên → field có cấu trúc (OpenAI hôm nay).

    Trả dict: {name, time, repeat, place, withwho, remind, missing:[field còn thiếu]}.
    `now` = ISO datetime của client (để resolve 'hôm nay/mai/thứ 7 tuần này').
    """
    async def parse(self, text: str, now: str = "") -> dict: ...


class PushPort(Protocol):
    async def send(self, user_id: str, title: str, body: str) -> None: ...


class BillingPort(Protocol):
    async def verify_purchase(self, user_id: str, receipt: str) -> bool: ...


class MemoryPort(Protocol):
    """AD-11: cô đọng lịch sử chat thành tóm tắt bền cho persona (MOAT trí nhớ)."""
    async def summarize(self, persona_name: str, old_summary: str, messages: list[str]) -> str: ...


@dataclass
class CalendarEvent:
    title: str
    start: str          # ISO8601
    location: str = ""


class CalendarPort(Protocol):
    """AD-13: import lịch (Google...) read-only → event chuẩn hoá."""
    async def list_events(self, access_token: str) -> list["CalendarEvent"]: ...
