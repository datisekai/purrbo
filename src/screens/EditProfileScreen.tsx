import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors, fonts, radii, hardShadow, type AppColors } from '../theme';
import { useC, usePal } from '../themeContext';
import { Icon } from '../components/Icon';
import { Button } from '../components/ui';
import { Api } from '../api';
import { useAuth } from '../auth';

export default function EditProfileScreen({ navigation }) {
  const c = useC();
  const pal = usePal();
  const s = useMemo(() => mkStyles(c, pal), [c, pal]);
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [busy, setBusy] = useState(false);

  const dirty = name.trim() && name.trim() !== (user?.name || '');

  const save = async () => {
    if (!dirty || busy) return;
    setBusy(true);
    try {
      const r = await Api.updateProfile({ name: name.trim() });
      updateUser({ name: r.name });
      navigation?.goBack?.();
    } catch (e: any) {
      Alert.alert('Chưa lưu được', String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.hdr}>
          <Pressable onPress={() => navigation?.goBack?.()} style={s.back}>
            <Icon name="back" size={20} color={colors.ink} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={s.hTitle}>Sửa hồ sơ</Text>
            <Text style={s.hSub}>đổi tên hiển thị của cưng</Text>
          </View>
        </View>

        {/* Avatar */}
        <View style={{ alignItems: 'center', marginBottom: 22 }}>
          <View style={s.avatar}>
            <Svg viewBox="0 0 64 64" width={64} height={64}>
              <Circle cx="32" cy="24" r="12" fill={c.purple} stroke="#2E2A3F" strokeWidth="3" />
              <Path d="M12 56c0-11 9-17 20-17s20 6 20 17z" fill={c.pink} stroke="#2E2A3F" strokeWidth="3" />
            </Svg>
          </View>
          <Text style={s.email}>{user?.email || 'Khách'}</Text>
        </View>

        {/* Name field */}
        <Text style={s.label}>Tên hiển thị</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Tên của cưng"
          placeholderTextColor={colors.muted}
          maxLength={40}
          style={s.input}
        />
        <Text style={s.hint}>{name.length}/40 · Purrbo sẽ gọi cưng bằng tên này</Text>

        <Button
          label={busy ? 'Đang lưu…' : 'Lưu'}
          tone="pink"
          disabled={!dirty || busy}
          onPress={save}
          icon={busy ? <ActivityIndicator color="#fff" /> : <Icon name="check" size={17} color="#fff" />}
          style={{ marginTop: 24, paddingVertical: 15 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const mkStyles = (c: AppColors, pal: any) => StyleSheet.create({
  hdr: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 22 },
  back: {
    width: 42, height: 42, borderRadius: 14, backgroundColor: '#fff',
    borderWidth: 2, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', ...hardShadow(3, 0.12),
  },
  hTitle: { fontFamily: fonts.display, fontSize: 20, color: colors.ink },
  hSub: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },

  avatar: {
    width: 88, height: 88, borderRadius: 30, backgroundColor: pal.soft,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff', ...hardShadow(5, 0.14),
  },
  email: { fontFamily: fonts.body, fontSize: 12.5, color: colors.muted, marginTop: 10 },

  label: { fontFamily: fonts.heading, fontSize: 13, color: colors.ink, marginBottom: 8, marginLeft: 4 },
  input: {
    backgroundColor: '#fff', borderWidth: 2, borderColor: colors.line, borderRadius: 16,
    paddingVertical: 14, paddingHorizontal: 16, fontFamily: fonts.body, fontSize: 16, color: colors.ink, ...hardShadow(3, 0.12),
  },
  hint: { fontFamily: fonts.body, fontSize: 11.5, color: colors.muted, marginTop: 7, marginLeft: 4 },
});
