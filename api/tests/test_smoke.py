"""Smoke test — vòng lặp cốt lõi (AD-3 streak, AD-7 anti-farm, AD-8 auth). Mock (không gọi OpenAI).

DB: PostgreSQL (giống dev/prod). Cần Postgres chạy — CI có service, local thì
`docker compose up -d db`. Test tự tạo database `purrbo_test` và làm mới schema mỗi lần.
"""
import asyncio
import os
from urllib.parse import urlparse

os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://purrbo:purrbo@localhost:5432/purrbo_test")
os.environ["TESTING"] = "1"   # → db.py dùng NullPool (an toàn với event-loop từng test)
os.environ["DIALOGUE_PROVIDER"] = "mock"
os.environ["NLP_PROVIDER"] = "mock"
os.environ["MEMORY_PROVIDER"] = "mock"
os.environ["ALLOW_DEV_LOGIN"] = "1"


def _ensure_test_db() -> None:
    """Tạo database test nếu chưa có (kết nối maintenance db 'postgres')."""
    import asyncpg

    p = urlparse(os.environ["DATABASE_URL"].replace("postgresql+asyncpg", "postgresql"))
    dbname = p.path.lstrip("/")

    async def go() -> None:
        conn = await asyncpg.connect(
            host=p.hostname, port=p.port or 5432, user=p.username, password=p.password, database="postgres"
        )
        try:
            if not await conn.fetchval("SELECT 1 FROM pg_database WHERE datname=$1", dbname):
                await conn.execute(f'CREATE DATABASE "{dbname}"')
        finally:
            await conn.close()

    asyncio.run(go())


_ensure_test_db()

import httpx  # noqa: E402
import pytest  # noqa: E402

from api.app import main as m  # noqa: E402
from api.app.db import Base, engine, init_db  # noqa: E402
from api.app.main import app  # noqa: E402


async def _client():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)   # schema sạch mỗi test
    await init_db()
    await m._seed_personas()
    return httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://t")


@pytest.mark.asyncio
async def test_health():
    async with await _client() as c:
        assert (await c.get("/health")).json()["ok"] is True


@pytest.mark.asyncio
async def test_khoe_streak_and_antifarm():
    async with await _client() as c:
        tok = (await c.post("/v1/auth/dev", json={"name": "Test"})).json()["token"]
        h = {"Authorization": f"Bearer {tok}"}
        assert (await c.get("/v1/state", headers=h)).json()["streak"] == 0
        hid = (await c.get("/v1/habits", headers=h)).json()[0]["id"]
        k1 = (await c.post(f"/v1/habits/{hid}/khoe", headers=h)).json()
        assert k1["streak"] == 1 and k1["affinity_points"] == 30
        k2 = (await c.post(f"/v1/habits/{hid}/khoe", headers=h)).json()
        assert k2["streak"] == 1 and k2["affinity_points"] == 30  # AD-7: không farm được


@pytest.mark.asyncio
async def test_auth_required():
    async with await _client() as c:
        assert (await c.get("/v1/state")).status_code in (401, 403)
