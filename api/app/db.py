"""DB async — SQLAlchemy 2.0 + asyncpg (PostgreSQL). Session dependency + init_db."""
from __future__ import annotations

import os
from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import NullPool

from api.app.config import settings

# Test (TESTING=1): NullPool → mỗi kết nối mở/đóng riêng, tránh pool dính event-loop
# cũ giữa các test asyncpg. Runtime thường dùng pool mặc định.
_engine_kwargs = {"echo": False, "future": True}
if os.getenv("TESTING"):
    _engine_kwargs["poolclass"] = NullPool
engine = create_async_engine(settings.database_url, **_engine_kwargs)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


class Base(DeclarativeBase):
    pass


async def get_session() -> AsyncIterator[AsyncSession]:
    async with SessionLocal() as session:
        yield session


async def init_db() -> None:
    """Dev: tạo bảng từ models (prod dùng Alembic migrations)."""
    from api.app import models  # noqa: F401  (đăng ký models vào metadata)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
