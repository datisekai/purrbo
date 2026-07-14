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
grep -q 'admin-doi-truoc' api/.env 2>/dev/null && echo "⚠️  ADMIN_TOKEN vẫn mặc định — NÊN đổi."

# --- 3. Build & chạy ---
echo "▶  Build & chạy Purrbo (Postgres + API + Caddy :80/:443, HTTPS tự động)..."
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-purrbo}" $COMPOSE up -d --build

# --- 4. Chờ API sẵn sàng (kiểm tra trong container, không phụ thuộc TLS) ---
echo "⏳  Chờ API sẵn sàng..."
for i in $(seq 1 40); do
  if $COMPOSE exec -T api python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://localhost:8000/health').status==200 else 1)" >/dev/null 2>&1; then
    echo ""
    echo "✅  API đã chạy. Caddy đang xin/áp chứng chỉ HTTPS cho purrbo.fun..."
    echo "    • Landing : https://purrbo.fun/"
    echo "    • Chính sách : https://purrbo.fun/privacy · /terms"
    echo "    • Admin   : https://purrbo.fun/admin"
    echo "    • API     : https://purrbo.fun/v1/...  (health: /health)"
    echo ""
    echo "→ Điều kiện HTTPS: DNS purrbo.fun (+ www) trỏ A record về IP VPS này, mở cổng 80 + 443."
    echo "  Lần đầu Caddy mất ~30-60s để lấy cert. Xem log: $COMPOSE logs -f caddy"
    exit 0
  fi
  sleep 2
done

echo "⚠️  API chưa phản hồi sau 80s. Xem log:  $COMPOSE logs -f api"
exit 1
