import React, { useEffect, useState } from 'react';
import { Pressable, Text, View, Alert, StyleSheet } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { colors, fonts, radii, hardShadow } from '../theme';
import { useAuth } from '../auth';

WebBrowser.maybeCompleteAuthSession();

// Component này CHỈ được render khi đã có EXPO_PUBLIC_GOOGLE_CLIENT_ID
// → hook useIdTokenAuthRequest luôn nhận clientId hợp lệ, không crash.
export default function GoogleButton({ clientId, label = 'Đăng nhập với Google' }: { clientId: string; label?: string }) {
  const { loginGoogle } = useAuth();
  const [busy, setBusy] = useState(false);
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({ clientId });

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
