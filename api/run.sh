#!/usr/bin/env bash
# Chạy backend Purrbo (uvicorn) — DB là PostgreSQL.
# CẦN Postgres chạy trước:  docker compose up -d db   (dev compose expose :5432)
# DATABASE_URL lấy từ api/.env (mặc định postgresql://purrbo:purrbo@localhost:5432/purrbo).
set -e
cd "$(dirname "$0")"                 # purrbo-app/api
[ -d .venv ] || python3 -m venv .venv
source .venv/bin/activate
pip install -q -r requirements.txt
cd ..                               # purrbo-app/ (gốc) — để api/ domain/ adapters/ import sạch
echo "→ http://localhost:8000/health   (Ctrl+C để dừng) · cần: docker compose up -d db"
# --host 0.0.0.0 để điện thoại (Expo Go) cùng LAN gọi được
uvicorn api.app.main:app --reload --host 0.0.0.0 --port 8000
