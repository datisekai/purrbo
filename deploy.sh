#!/usr/bin/env bash
# Purrbo — deploy web/backend 1 lệnh (Postgres + API + nginx qua docker-compose.prod.yml).
# Nginx nghe :80 → proxy sang api:8000. Trỏ domain của bạn về server này là xong.
#
#   ./deploy.sh
#
set -euo pipefail
cd "$(dirname "$0")"

COMPOSE="docker compose -f docker-compose.prod.yml"

# --- 0. Kéo code mới nhất (nếu là git repo) ---
if [ -d .git ]; then
  BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo main)"
  echo "▶  git pull origin ${BRANCH}..."
  BEFORE="$(git rev-parse HEAD 2>/dev/null || echo none)"
  if git pull --ff-only origin "$BRANCH"; then
    AFTER="$(git rev-parse HEAD 2>/dev/null || echo none)"
    if [ "$BEFORE" != "$AFTER" ] && [ -z "${PURRBO_REEXEC:-}" ]; then
      echo "↻  deploy.sh có bản mới — chạy lại..."
      export PURRBO_REEXEC=1
      exec bash "$0" "$@"
    fi
  else
    echo "⚠️  git pull không thành công — deploy code hiện tại."
  fi
fi

# --- 1. Kiểm tra api/.env ---
if [ ! -f api/.env ]; then
  cp api/.env.example api/.env
  echo "⚠️  Chưa có api/.env — đã tạo từ mẫu."
  echo "   MỞ api/.env đổi: OPENAI_API_KEY, JWT_SECRET (mạnh), ADMIN_TOKEN (mạnh),"
  echo "   CORS_ORIGINS (domain thật), rồi chạy lại ./deploy.sh"
  exit 1
fi

# --- 2. Cảnh báo secret mặc định ---
grep -q '^JWT_SECRET=changeme' api/.env 2>/dev/null && echo "⚠️  JWT_SECRET vẫn mặc định — NÊN đổi."
grep -q 'doi-mat-khau-nay' api/.env 2>/dev/null && echo "⚠️  ADMIN_PASSWORD vẫn mặc định — NÊN đổi."

# --- 3. Cổng publish (mặc định 3012; nginx VPS proxy vào cổng này) ---
APP_PORT="$(grep -E '^APP_PORT=' api/.env 2>/dev/null | head -1 | cut -d= -f2- | tr -d '"'"'"' ' || true)"
APP_PORT="${APP_PORT:-3012}"
export APP_PORT

# --- 4. Build & chạy ---
echo "▶  Build & chạy Purrbo (Postgres + API) — publish 127.0.0.1:${APP_PORT}..."
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-purrbo}" $COMPOSE up -d --build

# --- 5. Chờ API sẵn sàng ---
echo "⏳  Chờ API sẵn sàng..."
for i in $(seq 1 40); do
  if curl -fsS "http://127.0.0.1:${APP_PORT}/health" >/dev/null 2>&1; then
    echo ""
    echo "✅  Purrbo đang chạy tại http://127.0.0.1:${APP_PORT} (chỉ localhost)"
    echo "    • Health : http://127.0.0.1:${APP_PORT}/health"
    echo "    • Landing/Admin/API do nginx VPS phục vụ qua domain."
    echo ""
    echo "→ Bước cuối (1 lần): copy file nginx vào sites-available, bật site, xin HTTPS:"
    echo "    sudo cp nginx.conf /etc/nginx/sites-available/purrbo.fun"
    echo "    sudo ln -sf /etc/nginx/sites-available/purrbo.fun /etc/nginx/sites-enabled/"
    echo "    sudo nginx -t && sudo systemctl reload nginx"
    echo "    sudo certbot --nginx -d purrbo.fun -d www.purrbo.fun"
    exit 0
  fi
  sleep 2
done

echo "⚠️  API chưa phản hồi sau 80s. Xem log:  $COMPOSE logs -f api"
exit 1
