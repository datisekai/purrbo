import React, { useEffect, useState } from 'react';
import { Pressable, Text, View, Alert, StyleSheet } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { colors, fonts, radii, hardShadow } from '../theme';
import { useAuth } from '../auth';

WebBrowser.maybeCompleteAuthSession();

// 3 client id theo nền tảng — expo-auth-session tự chọn đúng cái khi chạy.
// aud của id_token = client id của nền tảng đó → backend nhận cả 3 (GOOGLE_CLIENT_IDS).
export const GOOGLE_IDS = {
  ios: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  android: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  web: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
};
export const GOOGLE_LOGIN_READY = !!(GOOGLE_IDS.ios || GOOGLE_IDS.android || GOOGLE_IDS.web);

// Chỉ render khi GOOGLE_LOGIN_READY = true → hook luôn có ít nhất 1 client id.
export default function GoogleButton({ label = 'Đăng nhập với Google' }: { label?: string }) {
  const { loginGoogle } = useAuth();
  const [busy, setBusy] = useState(false);
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    iosClientId: GOOGLE_IDS.ios,
    androidClientId: GOOGLE_IDS.android,
    webClientId: GOOGLE_IDS.web,
  });

  useEffect(() => {
    if (response?.type === 'success' && response.params?.id_token) {
      setBusy(true);
      loginGoogle(response.params.id_token)
        .catch((e) => Alert.alert('Đăng nhập lỗi', String(e)))
        .finally(() => setBusy(false));
    }
  }, [response]);

  return (
    <Pressable style={s.btn} disabled={!request || busy} onPress={() => promptAsync()}>
      <View style={s.g}><Text style={{ fontFamily: fonts.display, fontSize: 15, color: '#4285F4' }}>G</Text></View>
      <Text style={s.txt}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 52, borderRadius: radii.pill, backgroundColor: '#fff', borderWidth: 2, borderColor: colors.line, ...hardShadow(5, 0.14) },
  g: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', ...hardShadow(2, 0.1) },
  txt: { fontFamily: fonts.heading, fontSize: 15, color: colors.ink },
});
