import asyncio
import os
import sys

from alembic import context
from sqlalchemy import pool
from sqlalchemy.ext.asyncio import async_engine_from_config

sys.path.insert(0, os.getcwd())  # để import api.* khi chạy từ gốc purrbo-app

from api.app.config import settings  # noqa: E402
from api.app.db import Base  # noqa: E402
from api.app import models  # noqa: E402,F401  (đăng ký models vào metadata)

config = context.config
config.set_main_option("sqlalchemy.url", os.environ.get("DATABASE_URL", settings.database_url))
target_metadata = Base.metadata


def _run(connection):
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_online():
    engine = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    async with engine.connect() as conn:
        await conn.run_sync(_run)
    await engine.dispose()


def run_offline():
    context.configure(url=config.get_main_option("sqlalchemy.url"), target_metadata=target_metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()


if context.is_offline_mode():
    run_offline()
else:
    asyncio.run(run_online())
