"""Smoke test — vòng lặp cốt lõi (AD-3 streak, AD-7 anti-farm, AD-8 auth). Dùng mock (không gọi OpenAI)."""
import os

os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./test_purrbo.db"
os.environ["DIALOGUE_PROVIDER"] = "mock"
os.environ["NLP_PROVIDER"] = "mock"
os.environ["MEMORY_PROVIDER"] = "mock"
os.environ["ALLOW_DEV_LOGIN"] = "1"

import httpx  # noqa: E402
import pytest  # noqa: E402

from api.app import main as m  # noqa: E402
from api.app.db import init_db  # noqa: E402
from api.app.main import app  # noqa: E402


async def _client():
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
