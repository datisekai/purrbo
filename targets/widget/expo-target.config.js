/** @type {import('@bacons/apple-targets').Config} */
module.exports = {
  type: 'widget',
  name: 'Purrbo',
  deploymentTarget: '16.0',
  // App Group để chia sẻ dữ liệu app RN ↔ widget (phải bật trên App ID ở Apple portal).
  entitlements: {
    'com.apple.security.application-groups': ['group.com.purrbo.app'],
  },
  frameworks: ['SwiftUI', 'WidgetKit'],
};
