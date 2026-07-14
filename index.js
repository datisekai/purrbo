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
  // CHỐT CHẶN CUỐI: chỉ dùng react-native lõi (không import component nào có thể
  // là thứ vừa hỏng). Vẫn phải ĐẸP + đúng brand, tuyệt đối không màn trắng trơ.
  const React = require('react');
  const { View, ScrollView, Text } = require('react-native');
  const h = React.createElement;
  const msg = String((e && (e.stack || e.message)) || e);
  Root = () =>
    h(View, { style: { flex: 1, backgroundColor: '#FFF0F4', alignItems: 'center', justifyContent: 'center', padding: 28 } },
      h(Text, { style: { fontSize: 60 } }, '🐱'),
      h(Text, { style: { marginTop: 10, fontSize: 21, fontWeight: '800', color: '#2E2A3F', textAlign: 'center' } }, 'Purrbo chưa mở được'),
      h(Text, { style: { marginTop: 8, fontSize: 14, color: '#8A8398', textAlign: 'center', lineHeight: 21, maxWidth: 320 } }, 'App vấp lỗi ngay lúc khởi động. Thử mở lại app nha — nếu vẫn vậy, chụp phần bên dưới gửi tụi mình.'),
      h(ScrollView, { style: { marginTop: 16, maxHeight: 220, alignSelf: 'stretch', backgroundColor: '#fff', borderRadius: 14, padding: 14 } },
        h(Text, { selectable: true, style: { fontSize: 11.5, color: '#E0532F', lineHeight: 17 } }, msg)
      )
    );
}

registerRootComponent(Root);
