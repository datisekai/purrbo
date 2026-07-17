"""Purrbo API — FastAPI async (hexagonal). Chạy: bash api/run.sh hoặc docker compose up."""
from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import func, select, text
from starlette.exceptions import HTTPException as StarletteHTTPException

from api.app.config import settings
from api.app.db import SessionLocal, engine, init_db
from api.app.models import Persona
from api.app.routers import (
    admin, appconfig, auth, chat, gacha, habits, integrations, items, nlp, personas, profile,
    rewards, stats, settings as settings_router,
)
from api.app.routers.items import seed_items

# Roster GenZ — mỗi persona một "gu" rõ. (key, name, variant, rarity, tag, intro)
_PERSONAS = [
    ("mun", "Mun", "mun", "SSR", "tsundere · cà khịa yêu",
     "Mèo mun lạnh ngoài gắt trong thương — miệng cà khịa mà đêm nào cũng đợi cưng khoe mới chịu ngủ."),
    ("cam", "Mochi", "cam", "SSR", "soft · ngọt xỉu thả thính",
     "Mèo cam mềm oặt, thả thính cả ngày, dỗ cưng ngọt tới mức sâu răng. Ai cưng cũng đổ."),
    ("ly", "Lỳ", "ly", "SSR", "bad-boy · thính thủ lạnh",
     "Cáo lạnh lùng, nói ít nhưng câu nào cũng trúng tim. Khó gần mà ai chạm được là nghiện."),
    ("sep", "Sếp", "sep", "Hiếm", "tổng tài · chủ động",
     "Đeo kính, quen ra lệnh — nhưng bí mật lên lịch chăm cưng đâu ra đó. Nghiêm mà cưng."),
    ("bong", "Bông", "bong", "Hiếm", "nũng nịu · uwu",
     "Thỏ hồng nũng nịu, làm nũng đỉnh cao, dỗ một câu là cưng mềm lòng ngay."),
    ("xu", "Xu", "xu", "Hiếm", "hype · năng lượng vô cực",
     "Mèo xanh quậy tưng, rủ cưng làm mọi thứ cho vui. Ở cạnh Xu là hết buồn."),
    ("bo", "Bơ", "bo", "Thường", "chill · ít nói mà ấm",
     "Gấu xanh trầm tính, không giỏi đạo lý, chỉ lặng lẽ nhắc cưng ăn no ngủ đủ."),
    ("sin", "Sìn", "sin", "Thường", "trung thành · quấn chủ",
     "Shiba quấn cưng như hình với bóng, cưng làm gì cũng vỗ tay khen giỏi."),
]


async def _seed_personas() -> None:
    """Đồng bộ catalog: upsert theo _PERSONAS + xoá persona không còn trong danh sách."""
    keys = {k for k, *_ in _PERSONAS}
    async with SessionLocal() as db:
        existing = {p.key: p for p in (await db.execute(select(Persona))).scalars().all()}
        for k, n, v, r, t, intro in _PERSONAS:
            p = existing.get(k)
            if p is None:
                db.add(Persona(key=k, name=n, variant=v, rarity=r, tag=t, intro=intro))
            else:
                p.name, p.variant, p.rarity, p.tag, p.intro = n, v, r, t, intro
        for k, p in existing.items():
            if k not in keys:
                await db.delete(p)
        await db.commit()


async def _ensure_columns() -> None:
    """Dev bootstrap: thêm cột mới cho bảng đã tồn tại (create_all không ALTER).
    Prod dùng Alembic (AD-6). Idempotent — lỗi 'đã tồn tại' bỏ qua."""
    from sqlalchemy import text
    stmts = [
        "ALTER TABLE habits ADD COLUMN repeat VARCHAR(24) DEFAULT 'daily'",
        "ALTER TABLE users ADD COLUMN push_token VARCHAR(256) DEFAULT ''",
        "ALTER TABLE users ADD COLUMN referral_code VARCHAR(12) DEFAULT ''",
        "ALTER TABLE users ADD COLUMN referred_by VARCHAR(64) DEFAULT ''",
        "ALTER TABLE chat_messages ADD COLUMN persona_key VARCHAR(32) DEFAULT ''",
        "ALTER TABLE user_state ADD COLUMN ai_calls_ymd VARCHAR(10) DEFAULT ''",
        "ALTER TABLE user_state ADD COLUMN ai_calls_count INTEGER DEFAULT 0",
        # Index chịu tải (idempotent). Composite phủ đúng query thực tế.
        "CREATE INDEX IF NOT EXISTS ix_userstate_rank ON user_state (streak DESC, affinity_points DESC)",
        "CREATE INDEX IF NOT EXISTS ix_chat_user_persona_id ON chat_messages (user_id, persona_key, id)",
        "CREATE INDEX IF NOT EXISTS ix_hc_user_ymd ON habit_completions (user_id, ymd)",
    ]
    async with SessionLocal() as db:
        for sql in stmts:
            try:
                await db.execute(text(sql))
                await db.commit()
            except Exception:
                await db.rollback()


# Khoá cố định riêng cho bootstrap Purrbo (số bất kỳ, chỉ cần ổn định giữa các
# lần chạy). Chạy nhiều uvicorn worker (--workers 2) → mỗi worker là 1 process
# riêng, lifespan chạy độc lập ở từng process → không có khoá thì 2 worker cùng
# ALTER TABLE / seed persona song song sẽ đụng race (trùng insert, lỗi cột đã có
# giữa chừng...). pg_advisory_lock xếp hàng chúng lại: worker sau đợi worker
# trước bootstrap xong (idempotent) rồi mới chạy tiếp — an toàn dù chạy lại.
_BOOTSTRAP_LOCK_KEY = 727271


@asynccontextmanager
async def _bootstrap_guard():
    async with engine.connect() as conn:
        await conn.execute(text(f"SELECT pg_advisory_lock({_BOOTSTRAP_LOCK_KEY})"))
        try:
            yield
        finally:
            await conn.execute(text(f"SELECT pg_advisory_unlock({_BOOTSTRAP_LOCK_KEY})"))


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with _bootstrap_guard():
        await init_db()          # dev bootstrap; prod dùng Alembic (AD-6)
        await _ensure_columns()
        await _seed_personas()
        async with SessionLocal() as db:
            await seed_items(db)
    yield


app = FastAPI(title=settings.app_name, lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",")],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(StarletteHTTPException)
async def _http_exc(request, exc: StarletteHTTPException):
    # AD-12: error envelope nhất quán {detail, code}
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail, "code": f"http_{exc.status_code}"})


# AD-12: mọi API dưới /v1
for r in (auth, personas, habits, chat, gacha, settings_router, profile, nlp, integrations, appconfig, admin, rewards, items, stats):
    app.include_router(r.router, prefix="/v1")


@app.get("/health")
async def health():
    return {"ok": True, "app": settings.app_name}


# ── Web: landing + chính sách + admin (phục vụ tĩnh từ api/app/web/) ──
from pathlib import Path

from fastapi.responses import FileResponse, HTMLResponse, PlainTextResponse, Response

_WEB = Path(__file__).resolve().parent / "web"


def _page(name: str):
    async def _h():
        f = _WEB / name
        if f.exists():
            return FileResponse(f)
        return HTMLResponse("<h1>Purrbo</h1><p>Trang đang cập nhật.</p>")
    return _h


async def _favicon():
    f = _WEB / "favicon.svg"
    if f.exists():
        return FileResponse(f, media_type="image/svg+xml")
    return HTMLResponse(status_code=404, content="")


async def _og_image():
    f = _WEB / "og-image.png"
    if f.exists():
        return FileResponse(f, media_type="image/png")
    return HTMLResponse(status_code=404, content="")


_SITE = "https://purrbo.fun"


async def _robots():
    body = (
        "User-agent: *\n"
        "Allow: /\n"
        "Disallow: /admin\n"
        f"Sitemap: {_SITE}/sitemap.xml\n"
    )
    return PlainTextResponse(body)


async def _sitemap():
    urls = [("/", "weekly", "1.0"), ("/privacy", "yearly", "0.5"), ("/terms", "yearly", "0.5")]
    items = "".join(
        f"<url><loc>{_SITE}{p}</loc><changefreq>{c}</changefreq><priority>{pr}</priority></url>"
        for p, c, pr in urls
    )
    xml = f'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{items}</urlset>'
    return Response(content=xml, media_type="application/xml")


app.add_api_route("/", _page("landing.html"), methods=["GET"], include_in_schema=False)
app.add_api_route("/privacy", _page("privacy.html"), methods=["GET"], include_in_schema=False)
app.add_api_route("/terms", _page("terms.html"), methods=["GET"], include_in_schema=False)
app.add_api_route("/admin", _page("admin.html"), methods=["GET"], include_in_schema=False)
app.add_api_route("/favicon.svg", _favicon, methods=["GET"], include_in_schema=False)
app.add_api_route("/favicon.ico", _favicon, methods=["GET"], include_in_schema=False)
app.add_api_route("/og-image.png", _og_image, methods=["GET"], include_in_schema=False)
app.add_api_route("/robots.txt", _robots, methods=["GET"], include_in_schema=False)
app.add_api_route("/sitemap.xml", _sitemap, methods=["GET"], include_in_schema=False)
