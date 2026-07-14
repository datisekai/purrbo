# Purrbo — Chạy & Deploy

## 0. Bộ khoá / env
- **Backend**: điền secret vào `api/.env` (xem `api/.env.example`). Quan trọng nhất: `OPENAI_API_KEY`.
- **App**: `EXPO_PUBLIC_API_URL`
  - Dev (Expo Go): file `.env` ở gốc → IP LAN máy chạy backend.
  - Build thật: `eas.json` ép sẵn theo profile (preview/production → domain https).

## 1. Chạy DEV (không Docker)
```bash
# Backend
bash api/run.sh                      # venv + uvicorn :8000 (đọc api/.env)

# App
nvm use 20 && npx expo start         # quét QR bằng Expo Go (cùng WiFi)
```
Persona nói bằng AI khi `OPENAI_API_KEY` có trong `api/.env` (không thì dùng câu mẫu).

## 2. Chạy bằng Docker (staging — SQLite)
```bash
docker compose up --build            # API :8000, DB SQLite persist ở ./data
curl localhost:8000/health
```

## Web (landing + admin) & deploy 1 lệnh
API tự phục vụ web tĩnh: **`/`** landing · **`/privacy`** · **`/terms`** · **`/admin`** (đăng nhập `ADMIN_USERNAME`/`ADMIN_PASSWORD`).
```bash
./deploy.sh          # pull → build docker-compose.prod (Postgres+API+Caddy) → HTTPS tự động
./release-ios.sh     # EAS build production iOS + submit TestFlight (cần eas-cli + Apple account)
```
- **Domain purrbo.fun**: trỏ **A record** `purrbo.fun` (+ `www`) về IP VPS, mở cổng **80 + 443**. Caddy tự xin cert Let's Encrypt (không cần certbot). App prod đã trỏ `https://purrbo.fun` (eas.json).
- **Cấu hình động**: app đọc `GET /v1/config` (gói nạp/đặc biệt, tỉ lệ túi mù, câu nhắc). Sửa persona + trang bị + config ở `/admin` → app nhận ngay.

## 3. Deploy PROD (Postgres + Caddy)
```bash
# đặt secret trong api/.env (OPENAI_API_KEY, JWT_SECRET mạnh, CORS_ORIGINS domain thật)
POSTGRES_PASSWORD='matkhau-manh' \
  docker compose -f docker-compose.prod.yml up --build -d
# Caddy lắng nghe :80/:443, HTTPS tự động → proxy api:8000
```
- Gắn domain + HTTPS: trỏ DNS về server, thêm TLS (Caddy/Traefik hoặc certbot cho nginx).
- Prod chạy Postgres → cần chạy migration (Alembic) thay vì `create_all`. (Alembic đã có trong requirements; scaffold migration khi cần.)

## 4. Build app (EAS)
```bash
npm i -g eas-cli && eas login
eas build --profile preview --platform android     # APK nội bộ, trỏ domain prod
eas build --profile production --platform ios       # TestFlight
```
Icon mèo cam + splash áp dụng ở các bản build này (Expo Go luôn hiện icon Expo Go).

## Migrations (Alembic — AD-6) & Tests
```bash
# Sinh migration khi đổi model:
alembic -c api/alembic.ini revision --autogenerate -m "mô tả"
# Áp lên DB (prod dùng cái này thay create_all):
DATABASE_URL=postgresql+asyncpg://... alembic -c api/alembic.ini upgrade head
# Smoke test (mock, không gọi OpenAI):
python -m pytest api/tests -c api/pytest.ini -q
```

## Còn lại (follow-up theo spine)
- **AD-9**: widget native + remote push (PushPort/Expo Push) — cần build thật (Expo Go chỉ chạy local notification). Bố cục widget ("hôm nay / sắp tới") đã thiết kế sẵn ở `src/components/WidgetPreview.tsx` (xem trước trong Home) → port sang WidgetKit (iOS) / Glance (Android) khi dựng dev build.
- **Âm thanh**: sfx + nhạc nền ở `assets/audio/*.wav` (tap/success/open/bg) là bản tổng hợp tạm — thay bằng file thật của Finn (giữ nguyên tên) là xong; bật/tắt trong Cài đặt → Âm thanh.
- **AD-10**: migrate từng màn sang `useQuery` (React Query đã set provider; hiện màn vẫn fetch trực tiếp).
- **AD-13**: Google Calendar thật ĐÃ cắm — adapter `calendar_google.py` (read-only,
  scope `calendar.readonly`), app tự OAuth ở Cài đặt → truyền `access_token` qua
  `/v1/calendar/events?gtoken=`. Chỉ cần `EXPO_PUBLIC_GOOGLE_CLIENT_ID` (Google Cloud)
  để bật; chưa có creds thì nút kết nối báo cần cấu hình. `CALENDAR_PROVIDER=mock` để demo.
- **AD-14**: RevenueCat thật (BillingPort + mock đã có).

## Kiến trúc
```
api/        FastAPI (app/ = routers, models, services, security, db, config)
domain/     ports.py — interface (DialoguePort, SchedulePort, PushPort, BillingPort)
adapters/   dialogue_openai|claude|mock · nlp_openai|mock  (đổi vendor không sửa domain)
src/        App React Native (screens, components, api.ts, auth)
```
