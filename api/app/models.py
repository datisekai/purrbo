"""Models — SQLAlchemy 2.0. MVP: Persona (catalog), Habit, ChatMessage, UserState.

Auth/JWT & bảng User đầy đủ sẽ thêm ở bước sau; hiện dùng demo_user_id cố định.
"""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from api.app.db import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


class AppConfig(Base):
    """Cấu hình động app (gói/tỉ lệ/copy...) — quản lý từ web admin, app fetch /v1/config."""
    __tablename__ = "app_config"
    key: Mapped[str] = mapped_column(String(64), primary_key=True)
    value: Mapped[str] = mapped_column(Text, default="")   # JSON string


class Persona(Base):
    __tablename__ = "personas"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    key: Mapped[str] = mapped_column(String(32), unique=True, index=True)  # mun/gau/tong/xu
    name: Mapped[str] = mapped_column(String(64))
    variant: Mapped[str] = mapped_column(String(16))
    rarity: Mapped[str] = mapped_column(String(16))                       # Thường/Hiếm/SSR
    tag: Mapped[str] = mapped_column(String(128))
    intro: Mapped[str] = mapped_column(Text, default="")


class Habit(Base):
    __tablename__ = "habits"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[str] = mapped_column(String(64), index=True)
    name: Mapped[str] = mapped_column(String(128))
    icon: Mapped[str] = mapped_column(String(32), default="droplet")
    time: Mapped[str] = mapped_column(String(16), default="")
    hint: Mapped[str] = mapped_column(String(128), default="")
    done: Mapped[bool] = mapped_column(Boolean, default=False)
    # Lịch lặp: "daily" | "weekly:0,2,4" (0=T2..6=CN) | "hours:2" (mỗi 2 tiếng)
    repeat: Mapped[str] = mapped_column(String(24), default="daily")


class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[str] = mapped_column(String(64), index=True)
    role: Mapped[str] = mapped_column(String(8))       # "user" | "persona"
    text: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)


class UserState(Base):
    __tablename__ = "user_state"
    user_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    persona_key: Mapped[str] = mapped_column(String(32), default="mun")
    mood: Mapped[str] = mapped_column(String(16), default="gắt")
    affinity_points: Mapped[int] = mapped_column(Integer, default=0)   # user MỚI bắt đầu từ 0
    affinity_level: Mapped[int] = mapped_column(Integer, default=1)
    streak: Mapped[int] = mapped_column(Integer, default=0)
    gems: Mapped[int] = mapped_column(Integer, default=1250)           # đá quý khởi đầu
    intimacy: Mapped[int] = mapped_column(Integer, default=1)          # 0 nhẹ · 1 vừa · 2 đắm
    lay: Mapped[int] = mapped_column(Integer, default=2)               # 0 dịu · 1 vừa · 2 gắt
    freq: Mapped[int] = mapped_column(Integer, default=1)              # 0 ít · 1 vừa · 2 nhiều
    onboarded: Mapped[bool] = mapped_column(Boolean, default=False)    # đã qua onboarding chưa


class OwnedPersona(Base):
    __tablename__ = "owned_personas"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[str] = mapped_column(String(64), index=True)
    persona_key: Mapped[str] = mapped_column(String(32))


class PersonaMemory(Base):
    """AD-11: tóm tắt bền per (user, persona) = moat trí nhớ."""
    __tablename__ = "persona_memory"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[str] = mapped_column(String(64), index=True)
    persona_key: Mapped[str] = mapped_column(String(32))
    summary: Mapped[str] = mapped_column(Text, default="")
    msg_count: Mapped[int] = mapped_column(Integer, default=0)


class User(Base):
    __tablename__ = "users"
    id: Mapped[str] = mapped_column(String(64), primary_key=True)       # uuid nội bộ
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(128), default="")
    avatar: Mapped[str] = mapped_column(String(512), default="")
    provider: Mapped[str] = mapped_column(String(16), default="guest")  # google | guest
    timezone: Mapped[str] = mapped_column(String(48), default="Asia/Ho_Chi_Minh")  # AD-4
    push_token: Mapped[str] = mapped_column(String(256), default="")  # Expo push token (remote)
    referral_code: Mapped[str] = mapped_column(String(12), default="", index=True)  # mã mời của user
    referred_by: Mapped[str] = mapped_column(String(64), default="")  # user_id người giới thiệu
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)


class Item(Base):
    """Catalog trang bị/phụ kiện cosmetic (mũ/kính/cổ). slot: hat|glasses|neck."""
    __tablename__ = "items"
    key: Mapped[str] = mapped_column(String(32), primary_key=True)
    name: Mapped[str] = mapped_column(String(64))
    slot: Mapped[str] = mapped_column(String(16))       # hat | glasses | neck
    price: Mapped[int] = mapped_column(Integer, default=100)
    rarity: Mapped[str] = mapped_column(String(12), default="Thường")


class OwnedItem(Base):
    __tablename__ = "owned_items"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[str] = mapped_column(String(64), index=True)
    item_key: Mapped[str] = mapped_column(String(32))


class EquippedItem(Base):
    """Item đang mặc theo slot (mỗi slot 1 item)."""
    __tablename__ = "equipped_items"
    user_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    slot: Mapped[str] = mapped_column(String(16), primary_key=True)
    item_key: Mapped[str] = mapped_column(String(32))


class MissionClaim(Base):
    """Đã nhận thưởng nhiệm vụ nào trong ngày nào (idempotent theo ngày)."""
    __tablename__ = "mission_claims"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[str] = mapped_column(String(64), index=True)
    mission_key: Mapped[str] = mapped_column(String(24))
    ymd: Mapped[str] = mapped_column(String(10))


class HabitCompletion(Base):
    """AD-3: mỗi lần khoe = 1 row/ngày. 'done hôm nay' & 'streak' DẪN XUẤT từ đây."""
    __tablename__ = "habit_completions"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[str] = mapped_column(String(64), index=True)
    habit_id: Mapped[int] = mapped_column(Integer, index=True)
    ymd: Mapped[str] = mapped_column(String(10), index=True)            # 'YYYY-MM-DD' theo tz user
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
