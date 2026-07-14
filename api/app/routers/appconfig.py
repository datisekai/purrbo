"""Cấu hình động app: web admin sửa → app fetch /v1/config (public).

Nội dung động: gói nạp đá quý, gói đặc biệt, tỉ lệ túi mù, vài dòng copy.
Persona catalog quản lý riêng ở /v1/admin/personas.
"""
from __future__ import annotations

import json

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.app.db import get_session
from api.app.models import AppConfig

router = APIRouter(tags=["config"])

# Giá trị mặc định — admin ghi đè từng khoá.
DEFAULT_CONFIG = {
    "gem_packs": [
        {"id": "p1", "gems": 100, "bonus": 0, "price": "20.000₫"},
        {"id": "p2", "gems": 500, "bonus": 50, "price": "99.000₫"},
        {"id": "p3", "gems": 1000, "bonus": 200, "price": "199.000₫", "best": True},
        {"id": "p4", "gems": 2000, "bonus": 500, "price": "399.000₫"},
    ],
    "packages": [
        {"id": "nuoi", "name": "Nuôi 3 bạn đồng hành cùng lúc", "price": "Gói tháng · 79k",
         "sub": "Mở 3 slot persona song song — mỗi em một tính cách, một câu chuyện.", "tag": "bán chiều sâu, không bán may rủi"},
        {"id": "doi", "name": "Đổi persona không giới hạn", "price": "Gói tháng · 59k",
         "sub": "Hôm nay muốn Sếp, mai muốn Xu — đổi thoải mái, không tốn túi mù.", "tag": "tự do, không FOMO"},
    ],
    "bag_odds": {
        "thuong": {"SSR": 1, "Hiếm": 14, "Thường": 85},
        "caocap": {"SSR": 3, "Hiếm": 22, "Thường": 75},
    },
    "home_nudge": "Ơ 3 tiếng chưa uống giọt nào? Định làm khô mực cho em buồn hả 🙄💧",
}


async def load_config(db: AsyncSession) -> dict:
    cfg = dict(DEFAULT_CONFIG)
    rows = (await db.execute(select(AppConfig))).scalars().all()
    for r in rows:
        try:
            cfg[r.key] = json.loads(r.value)
        except Exception:
            pass
    return cfg


@router.get("/config")
async def get_config(db: AsyncSession = Depends(get_session)):
    return await load_config(db)
