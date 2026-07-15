import React, { useEffect, useState } from 'react';
import { Pressable, Text, View, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { colors, fonts, radii, hardShadow } from '../theme';
import { Icon } from '../components/Icon';
import { GCAL_SCOPE, setGcalToken } from '../googleCalendar';
import { GOOGLE_IDS } from './GoogleButton';

WebBrowser.maybeCompleteAuthSession();

// CHỈ render khi GOOGLE_LOGIN_READY → hook luôn có ít nhất 1 client id.
// OAuth lấy access_token (không phải id_token) để gọi Calendar API read-only.
export default function GcalConnectButton({
  label = 'Kết nối Google Calendar',
  onConnected,
}: {
  label?: string;
  onConnected?: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: GOOGLE_IDS.ios,
    androidClientId: GOOGLE_IDS.android,
    webClientId: GOOGLE_IDS.web,
    scopes: [GCAL_SCOPE],
    extraParams: { access_type: 'offline', prompt: 'consent', include_granted_scopes: 'true' },
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const tok = response.authentication?.accessToken;
      if (tok) {
        setBusy(true);
        setGcalToken(tok)
          .then(() => onConnected?.())
          .catch((e) => Alert.alert('Kết nối lỗi', String(e)))
          .finally(() => setBusy(false));
      }
    } else if (response?.type === 'error') {
      Alert.alert('Kết nối lỗi', String(response.error ?? 'Google từ chối'));
    }
  }, [response]);

  return (
    <Pressable style={s.btn} disabled={!request || busy} onPress={() => promptAsync()}>
      {busy ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <>
          <Icon name="calendar" size={17} color="#fff" />
          <Text style={s.txt}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const s = StyleSheet.create({
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9,
    paddingVertical: 13, borderRadius: radii.pill, backgroundColor: colors.skyDark,
    borderBottomWidth: 4, borderBottomColor: '#2A7FB8', ...hardShadow(4, 0.16),
  },
  txt: { fontFamily: fonts.heading, fontSize: 15, color: '#fff' },
});
