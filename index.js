import { registerRootComponent } from 'expo';

// Entry point — đăng ký component gốc cho Expo (SDK 50+).
// Dùng require() TRONG try/catch để hoãn việc nạp App: nếu bất kỳ module nào
// trong cây import của App ném lỗi lúc nạp (native module init khác trong bản
// standalone...), ta HIỆN lỗi ra màn hình thay vì để trắng trơn. ErrorBoundary
// không bắt được lỗi lúc import — chỉ chốt chặn ở đây mới thấy được.
let Root;
try {
  Root = require('./App').default;
} catch (e) {
  const React = require('react');
  const { ScrollView, Text } = require('react-native');
  const msg = String((e && (e.stack || e.message)) || e);
  Root = () =>
    React.createElement(
      ScrollView,
      { style: { flex: 1, backgroundColor: '#fff' }, contentContainerStyle: { padding: 24, paddingTop: 72 } },
      React.createElement(Text, { style: { fontSize: 18, fontWeight: '800', color: '#c0143c', marginBottom: 12 } }, 'Purrbo — lỗi khởi động'),
      React.createElement(Text, { style: { fontSize: 13, color: '#2E2A3F', lineHeight: 20 } }, msg)
    );
}

registerRootComponent(Root);
