# Purrbo — Phát hành app (iOS TestFlight + Android APK)

Build chạy trên **cloud của Expo (EAS)** — máy bạn chỉ cần `eas login`. Mỗi bản build ép sẵn
`EXPO_PUBLIC_API_URL=https://purrbo.fun` (xem `eas.json`), nên **nhớ deploy backend trước** (`./deploy.sh`)
và trỏ DNS `purrbo.fun` để app kết nối được.

## 0. Chuẩn bị (1 lần)
```bash
npm i -g eas-cli          # đã có: eas 20.x
nvm use 20
eas login                 # đăng nhập tài khoản Expo (miễn phí)
```
- **iOS TestFlight**: cần **Apple Developer** ($99/năm). EAS sẽ tự lo certificate/provisioning.
- **Android APK**: KHÔNG cần tài khoản — chỉ tải APK về cài. (Muốn lên Google Play cần tài khoản $25.)
- Lần build đầu, EAS hỏi tạo project → chọn **Yes** (nó tự ghi `projectId` vào `app.json`).

## 1. iOS → TestFlight
```bash
./release-ios.sh            # build + submit (khuyến nghị)
# hoặc tách:
./release-ios.sh build      # chỉ build (.ipa)
./release-ios.sh submit     # nộp bản build mới nhất lên TestFlight
```
- EAS hỏi credentials iOS → chọn **"Let EAS handle it"** (nó tạo giúp, cần đăng nhập Apple).
- Submit cần **App Store Connect API key** (khuyến nghị) hoặc Apple ID — EAS hướng dẫn tạo.
- Xong: vào **App Store Connect → TestFlight**, thêm tester (email) → họ nhận lời mời cài qua app TestFlight.
- Bundle id: `com.purrbo.app` · version tự tăng (`autoIncrement`).

## 2. Android → APK (cài trực tiếp / gửi tester)
```bash
./release-android.sh        # build APK (profile preview)
```
- Lần đầu EAS hỏi tạo **keystore** → chọn **Yes** (EAS giữ giúp).
- Xong, EAS in **link .apk** → tải về điện thoại, bật "Cài từ nguồn không xác định" rồi cài.
- Cũng xem được ở **expo.dev → Builds**.

### Android → Google Play (khi cần)
```bash
./release-android.sh aab    # build .aab
./release-android.sh submit # nộp Play (cần service account JSON)
```

## Ghi chú
- **Icon mèo cam + splash hồng** áp dụng ở các bản build này (Expo Go thì luôn hiện icon Expo Go).
- Sửa domain: đổi trong `eas.json` (cả `preview` + `production`).
- Đổi version app: sửa `expo.version` trong `app.json`; build number/versionCode do EAS tự tăng.
- Theo dõi tiến độ build: `eas build:list` hoặc trang **expo.dev**.
