# Purrbo — Chạy & Deploy

## 0. Bộ khoá / env
- **Backend**: điền secret vào `api/.env` (xem `api/.env.example`). Quan trọng nhất: `OPENAI_API_KEY`.
- **App**: `EXPO_PUBLIC_API_URL`
  - Dev (Expo Go): file `.env` ở gốc → IP LAN máy chạy backend.
  - Build thật: `eas.json` ép sẵn theo profile (preview/production → domain https).

## 1. Chạy DEV (Docker — Postgres, khuyến nghị)
```bash
docker compose up --build            # Postgres (:5432) + API (:8000)
curl localhost:8000/health
```
Điện thoại (Expo Go) gọi vào `http://IP-LAN:8000`. DB = PostgreSQL (không còn SQLite).

## 2. Chạy backend không Docker
```bash
docker compose up -d db              # cần Postgres chạy trước (:5432)
bash api/run.sh                      # venv + uvicorn :8000 (đọc api/.env → localhost Postgres)

nvm use 20 && npx expo start         # app: quét QR Expo Go
```
Persona nói bằng AI khi `OPENAI_API_KEY` có trong `api/.env` (không thì dùng câu mẫu).

## Web (landing + admin) & deploy 1 lệnh
API tự phục vụ web tĩnh: **`/`** landing · **`/privacy`** · **`/terms`** · **`/admin`** (đăng nhập `ADMIN_USERNAME`/`ADMIN_PASSWORD`).
```bash
./deploy.sh          # build docker-compose.prod (Postgres+API) → publish 127.0.0.1:3012
./release-ios.sh     # EAS build production iOS + submit TestFlight (cần eas-cli + Apple account)
```
- **Domain purrbo.fun (nginx VPS)**: copy `nginx.conf` → `/etc/nginx/sites-available/purrbo.fun`, bật site, `certbot --nginx -d purrbo.fun -d www.purrbo.fun`. App prod đã trỏ `https://purrbo.fun` (eas.json). Đổi cổng: `APP_PORT` trong `api/.env`.
- **Cấu hình động**: app đọc `GET /v1/config` (gói nạp/đặc biệt, tỉ lệ túi mù, câu nhắc). Sửa persona + trang bị + config ở `/admin` → app nhận ngay.

## 3. Deploy PROD (Postgres + API, nginx VPS proxy)
```bash
# đặt secret trong api/.env (OPENAI_API_KEY, JWT_SECRET mạnh, ADMIN_PASSWORD, POSTGRES_PASSWORD)
./deploy.sh                       # publish 127.0.0.1:3012 (APP_PORT trong api/.env)
```
- Nginx VPS proxy `purrbo.fun` → `127.0.0.1:3012` (file `nginx.conf`), TLS bằng `certbot --nginx`.
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
