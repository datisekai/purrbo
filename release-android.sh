#!/usr/bin/env bash
# Purrbo — build Android qua EAS.
#   ./release-android.sh              # APK (profile preview, cài trực tiếp / chia sẻ link)
#   ./release-android.sh aab          # AAB (profile production, nộp Google Play)
#   ./release-android.sh submit       # nộp bản mới nhất lên Google Play (cần service account)
#
# Yêu cầu: npm i -g eas-cli && eas login. Lần đầu EAS sẽ hỏi tạo project + keystore.
set -euo pipefail
cd "$(dirname "$0")"

export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" && nvm use 20 >/dev/null 2>&1 || true

command -v eas >/dev/null 2>&1 || { echo "❌ Chưa có eas-cli. Cài:  npm i -g eas-cli && eas login"; exit 1; }

STEP="${1:-apk}"
case "$STEP" in
  apk)
    echo "▶  EAS build Android APK (profile preview, trỏ https://purrbo.fun)..."
    echo "   Lần đầu: EAS tạo keystore giúp (chọn Yes). Xong sẽ in link .apk để tải/cài."
    eas build --profile preview --platform android
    ;;
  aab)
    echo "▶  EAS build Android AAB (profile production) — để nộp Google Play..."
    eas build --profile production --platform android
    ;;
  submit)
    echo "▶  EAS submit → Google Play (cần service account JSON, xem eas submit docs)..."
    eas submit --profile production --platform android --latest
    ;;
  *) echo "Dùng: ./release-android.sh [apk|aab|submit]"; exit 1 ;;
esac

echo "✅  Xong. APK: tải từ link EAS in ra (hoặc trang expo.dev › Builds)."
