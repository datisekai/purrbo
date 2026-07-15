# Widget iOS (WidgetKit) — Setup & Rebuild

Widget đã được dựng ở `targets/widget/` (SwiftUI) + cầu dữ liệu `src/widget.ts`.
Vì là **native**, phải rebuild + làm vài bước phía Apple. Làm theo thứ tự:

## 0. Đã có sẵn (tôi làm rồi)
- `targets/widget/PurrboWidget.swift` — UI widget (small + medium), đọc dữ liệu từ App Group.
- `targets/widget/expo-target.config.js` — khai target widget + App Group.
- `app.json` — plugin `@bacons/apple-targets`, `ios.appleTeamId`, App Group entitlement cho app chính.
- `src/widget.ts` — `pushWidget()` ghi JSON vào App Group + reload timeline; HomeScreen gọi mỗi khi tiến độ đổi.
- Lib đã cài: `@bacons/apple-targets`, `react-native-shared-group-preferences`, `react-native-widgetkit`.
- `ios/` đã chuyển sang CNG (gitignore) → prebuild/EAS tự sinh lại kèm widget.

## 1. Bật App Groups trên Apple Developer portal (BẮT BUỘC — việc của bạn)
[developer.apple.com](https://developer.apple.com/account) → **Certificates, IDs & Profiles → Identifiers**:
1. Tạo App Group: bên trái chọn **App Groups** → **+** → tạo `group.com.purrbo.app`.
2. Vào Identifier **com.purrbo.app** (app chính) → tick **App Groups** → **Edit** → chọn `group.com.purrbo.app` → Save.
3. Widget có bundle id riêng (`com.purrbo.app.Purrbo`). Khi EAS build lần đầu nó sẽ tự tạo identifier này + hỏi tạo profile — cho phép. Sau đó gán App Group `group.com.purrbo.app` cho nó luôn (giống bước 2).

> EAS thường tự lo phần provisioning; App Group thì nên bật tay ở portal cho chắc.

## 2. Regenerate native (kèm widget)
```bash
npx expo prebuild --clean      # sinh lại ios/ từ app.json + targets/ (có widget)
```

## 3. Rebuild
- **Máy thật (nhanh test):** `npx expo run:ios --device <UDID>`
- **TestFlight:** `./release-ios.sh` (EAS build tự prebuild kèm widget)

## 4. Test widget
1. Trên iPhone: giữ màn hình chính → **+** góc trên → search **"Purrbo"** → thêm widget (small/medium).
2. Mở app Purrbo, vào Home 1 lần (để `pushWidget` ghi dữ liệu).
3. Widget hiện: tên persona · câu nhắc · việc kế tiếp · x/y việc · streak.

## Cách hoạt động (data flow)
```
HomeScreen (đổi tiến độ) → pushWidget()
  → SharedGroupPreferences.setItem('purrbo_widget', JSON, 'group.com.purrbo.app')
  → WidgetKit.reloadAllTimelines()
Widget (PurrboWidget.swift) → UserDefaults(suite: group.com.purrbo.app).string('purrbo_widget')
  → decode PurrboData → render
```

## Nếu gặp lỗi
- **Widget không hiện trong gallery:** chưa prebuild/rebuild, hoặc target không được sinh → kiểm tra `ios/` sau prebuild có thư mục `Purrbo` (widget) không.
- **Build lỗi App Group / provisioning:** chưa bật App Groups ở portal (bước 1), hoặc profile widget chưa tạo → mở Xcode `ios/Purrbo.xcworkspace`, chọn target widget → Signing & Capabilities → thêm App Group.
- **Widget hiện nhưng trống ("Mở app để cập nhật"):** chưa mở Home sau khi cài (chưa `pushWidget`), hoặc App Group id 2 bên chưa khớp.
- **App crash chỗ pushWidget:** không xảy ra — `src/widget.ts` guard sẵn (require mềm + try/catch); chưa có native thì no-op.

## Ghi chú
- Widget **không bắt buộc cho TestFlight beta** — nếu build lỗi, tạm bỏ plugin `@bacons/apple-targets` trong app.json để ra beta trước, thêm lại sau.
- Android widget (Glance) là việc riêng, chưa làm.
