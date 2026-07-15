/** @type {import('@bacons/apple-targets').Config} */
module.exports = {
  type: 'widget',
  // TÊN target phải KHÁC app chính ('Purrbo') — trùng tên gây gán nhầm provisioning
  // profile (app nhận profile widget → thiếu push). Tên hiển thị ở gallery lấy từ
  // configurationDisplayName("Purrbo") trong PurrboWidget.swift.
  name: 'PurrboWidget',
  deploymentTarget: '16.0',
  // App Group để chia sẻ dữ liệu app RN ↔ widget (phải bật trên App ID ở Apple portal).
  entitlements: {
    'com.apple.security.application-groups': ['group.com.purrbo.app'],
  },
  frameworks: ['SwiftUI', 'WidgetKit'],
};
