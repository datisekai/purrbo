"""Cấu hình app — đọc từ api/.env (SQLite dev / Postgres prod)."""
from __future__ import annotations

from pathlib import Path

from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

# api/.env — nạp vào os.environ để cả adapter (OPENAI_API_KEY...) đọc được,
# đồng thời pydantic-settings map vào Settings bên dưới. Đường dẫn tuyệt đối
# theo vị trí file này → chạy uvicorn từ đâu cũng đúng.
ENV_PATH = Path(__file__).resolve().parents[1] / ".env"   # purrbo-app/api/.env
load_dotenv(ENV_PATH, override=False)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=str(ENV_PATH), extra="ignore")

    app_name: str = "Purrbo API"
    # Dev: SQLite (không cần Docker). Prod: postgresql+asyncpg://user:pass@host/db
    database_url: str = "sqlite+aiosqlite:///./purrbo_dev.db"
    jwt_secret: str = "dev-secret-doi-truoc-khi-len-prod"
    jwt_alg: str = "HS256"
    cors_origins: str = "*"
    allow_dev_login: bool = True          # AD-8: prod đặt False (tắt /auth/dev)
    google_client_id: str = ""            # AD-8: verify aud của Google id_token
    admin_token: str = "purrbo-admin-doi-truoc-khi-len-prod"  # (legacy) header X-Admin-Token cho script
    admin_username: str = "admin"                             # đăng nhập web admin
    admin_password: str = "purrbo-doi-truoc-khi-len-prod"     # ĐỔI trước khi lên prod
    ai_daily_cap: int = 100               # AD-7: trần call AI / user / ngày
    # DIALOGUE_PROVIDER=openai|claude|mock · NLP_PROVIDER=openai|mock · OPENAI_API_KEY=...


settings = Settings()
