#!/usr/bin/env bash
# Chạy backend Purrbo một phát. Mặc định SQLite (không cần Docker).
# Persona sinh thoại: có ANTHROPIC_API_KEY thì dùng Claude, không thì mock tự động.
set -e
cd "$(dirname "$0")"                 # purrbo-app/api
[ -d .venv ] || python3 -m venv .venv
source .venv/bin/activate
pip install -q -r requirements.txt
cd ..                               # purrbo-app/ (gốc) — để api/ domain/ adapters/ import sạch
echo "→ http://localhost:8000/health   (Ctrl+C để dừng)"
# --host 0.0.0.0 để điện thoại (Expo Go) cùng LAN gọi được
uvicorn api.app.main:app --reload --host 0.0.0.0 --port 8000
