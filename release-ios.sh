#!/usr/bin/env bash
# Purrbo — build iOS (production) & submit lên TestFlight qua EAS.
# Yêu cầu: đã `npm i -g eas-cli` và `eas login`; đã có Apple Developer account.
#
#   ./release-ios.sh            # build + submit TestFlight
#   ./release-ios.sh build      # chỉ build
#   ./release-ios.sh submit     # chỉ submit bản build mới nhất
#
set -euo pipefail
cd "$(dirname "$0")"

# Node 20 (nvm) nếu có
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" && nvm use 20 >/dev/null 2>&1 || true

command -v eas >/dev/null 2>&1 || { echo "❌ Chưa có eas-cli. Cài:  npm i -g eas-cli && eas login"; exit 1; }

STEP="${1:-all}"

do_build(){
  echo "▶  EAS build iOS (profile production, trỏ https://api.purrbo.app)..."
  echo "   Lần đầu EAS sẽ hỏi tạo/चọn credentials (App Store Connect API key hoặc Apple ID)."
  eas build --profile production --platform ios --non-interactive || \
    eas build --profile production --platform ios   # fallback tương tác nếu cần credentials
}

do_submit(){
  echo "▶  EAS submit → TestFlight..."
  echo "   Cần App Store Connect API key hoặc Apple ID trong eas submit config."
  eas submit --profile production --platform ios --latest
}

case "$STEP" in
  build)  do_build ;;
  submit) do_submit ;;
  all)    do_build && do_submit ;;
  *) echo "Dùng: ./release-ios.sh [build|submit|all]"; exit 1 ;;
esac

echo "✅  Xong. Vào App Store Connect → TestFlight để mời tester."
