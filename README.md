# Purrbo 🐱

App nuôi thói quen bằng một **bạn đồng hành** persona (GenZ) — nhắc lịch, khoe → được cưng, túi mù sưu tầm persona, trang bị/phụ kiện, nhiệm vụ & mời bạn nhận đá quý.

- **App**: Expo (React Native, TypeScript, SDK 54) — chạy dev: `nvm use 20 && npx expo start`
- **Backend**: FastAPI async + Postgres (hexagonal: `domain/ports.py` + `adapters/`)
- **Web**: landing + chính sách + admin (do API phục vụ tĩnh ở `api/app/web/`)

## Deploy trên VPS

App chạy trong Docker, publish ở **127.0.0.1:3012**; **nginx của VPS** (sites-available) proxy `purrbo.fun` → cổng đó + HTTPS bằng certbot.

```bash
git clone git@github.com:datisekai/purrbo.git
cd purrbo
cp api/.env.example api/.env      # điền OPENAI_API_KEY, JWT_SECRET mạnh, ADMIN_PASSWORD, POSTGRES_PASSWORD
./deploy.sh                       # Postgres + API (publish 127.0.0.1:3012)

# nginx (1 lần) — trỏ purrbo.fun → 127.0.0.1:3012:
sudo cp nginx.conf /etc/nginx/sites-available/purrbo.fun
sudo ln -sf /etc/nginx/sites-available/purrbo.fun /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d purrbo.fun -d www.purrbo.fun     # HTTPS
```

**DNS**: trỏ `purrbo.fun` (+ `www`) **A record** về IP VPS trước khi chạy certbot.

Sau khi chạy:
- Landing: https://purrbo.fun/
- Chính sách: https://purrbo.fun/privacy · /terms
- Admin: https://purrbo.fun/admin (đăng nhập `ADMIN_USERNAME`/`ADMIN_PASSWORD`)
- API: https://purrbo.fun/v1/… (health: `/health`)

## Build app (TestFlight / APK)

```bash
npm i -g eas-cli && eas login
./release-ios.sh                                   # iOS → TestFlight
eas build --profile preview --platform android     # APK nội bộ
```

Chi tiết vận hành: xem [DEPLOY.md](DEPLOY.md).

> ⚠️ `api/.env` (chứa `OPENAI_API_KEY`) đã được `.gitignore` — KHÔNG commit. Tạo mới trên VPS từ `api/.env.example`.
