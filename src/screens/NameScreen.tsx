import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, radii, hardShadow } from '../theme';
import { AnimatedMascot } from '../components/AnimatedMascot';
import { useAuth } from '../auth';
import GoogleButton, { GOOGLE_LOGIN_READY } from './GoogleButton';

export default function NameScreen() {
  const { loginDev } = useAuth();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  const start = async () => {
    setBusy(true);
    try {
      await loginDev(name.trim() || 'bạn');
    } catch (e) {
      Alert.alert('Ối', 'Chưa kết nối được máy chủ. Kiểm tra backend đang chạy nha.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={s.root}>
      <View style={s.hero}>
        <AnimatedMascot size={120} />
        <Text style={[s.word, { marginTop: 12 }]}>Purr<Text style={{ color: colors.pink }}>bo</Text></Text>
        <Text style={s.tag}>Mình gọi bạn là gì cho thân thương nè? 🐾</Text>
      </View>

      <View style={{ gap: 14 }}>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Tên của bạn..."
          placeholderTextColor={colors.muted}
          style={s.input}
          returnKeyType="go"
          onSubmitEditing={start}
          autoFocus
        />
        <Pressable style={s.start} onPress={start} disabled={busy}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.startTxt}>Bắt đầu ngay</Text>}
        </Pressable>

        {GOOGLE_LOGIN_READY ? (
          <>
            <Text style={s.or}>hoặc</Text>
            <GoogleButton label="Đăng nhập & đồng bộ lịch Google" />
            <Text style={s.note}>Đăng nhập Google sẽ đồng bộ lịch luôn cho cưng — hoặc để sau ở Cài đặt cũng được 📅</Text>
          </>
        ) : (
          <Text style={s.note}>Bạn có thể đăng nhập Google sau, ở phần Cài đặt — để đồng bộ lịch 📅</Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 28, paddingBottom: 40, justifyContent: 'center', gap: 38 },
  hero: { alignItems: 'center' },
  word: { fontFamily: fonts.display, fontSize: 44, color: colors.ink },
  tag: { fontFamily: fonts.body, fontSize: 15, color: colors.muted, textAlign: 'center', marginTop: 10, maxWidth: 280, lineHeight: 22 },
  input: {
    height: 56, borderRadius: radii.md, backgroundColor: '#fff', borderWidth: 2, borderColor: colors.line,
    paddingHorizontal: 18, fontFamily: fonts.bodyBold, fontSize: 17, color: colors.ink, ...hardShadow(4, 0.12),
  },
  start: { height: 54, borderRadius: radii.pill, backgroundColor: colors.pink, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 5, borderBottomColor: colors.pinkDark },
  startTxt: { fontFamily: fonts.heading, fontSize: 17, color: '#fff' },
  or: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, textAlign: 'center' },
  note: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, textAlign: 'center', marginTop: 4, lineHeight: 18 },
});
