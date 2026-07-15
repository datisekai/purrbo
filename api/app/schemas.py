"""Schemas Pydantic — hợp đồng API cho app."""
from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field


class PersonaOut(BaseModel):
    key: str
    name: str
    variant: str
    rarity: str
    tag: str
    intro: str = ""

    class Config:
        from_attributes = True


class HabitOut(BaseModel):
    id: int
    name: str
    icon: str
    time: str
    hint: str
    done: bool
    repeat: str = "daily"

    class Config:
        from_attributes = True


class HabitCreate(BaseModel):
    name: str
    icon: str = "droplet"
    time: str = ""
    hint: str = ""
    repeat: str = "daily"


class StateOut(BaseModel):
    persona_key: str
    mood: str
    affinity_points: int
    affinity_level: int
    streak: int
    gems: int
    intimacy: int
    lay: int
    freq: int
    onboarded: bool

    class Config:
        from_attributes = True


class SettingsIn(BaseModel):
    intimacy: Optional[int] = None
    lay: Optional[int] = None
    freq: Optional[int] = None


class KhoeOut(BaseModel):
    line: str
    affinity_points: int
    affinity_level: int
    streak: int


class ChatIn(BaseModel):
    text: str = Field(..., min_length=1, max_length=1000)  # AD-7 cap độ dài


class ChatOut(BaseModel):
    reply: str


class GachaOut(BaseModel):
    persona: PersonaOut
    gems: int
    is_new: bool


class OwnedOut(BaseModel):
    key: str
    name: str
    variant: str
    rarity: str
    active: bool


class ProfileOut(BaseModel):
    name: str
    email: str
    streak: int
    total_done: int
    owned_count: int
    persona_key: str
    affinity_level: int


class NlpIn(BaseModel):
    text: str = Field(..., min_length=1, max_length=500)  # AD-7 cap độ dài
    now: str = ""  # ISO datetime của client → resolve 'hôm nay/mai/thứ 7 tuần này'


class NlpOut(BaseModel):
    name: str
    time: str = ""
    repeat: str = "daily"   # once:YYYY-MM-DD | daily | weekly:d1,d2 | hours:N
    place: str = ""
    withwho: str = ""
    remind: str = ""
    missing: list[str] = []
