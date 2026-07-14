import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, radii, hardShadow } from '../theme';
import { Icon } from '../components/Icon';
import { Button } from '../components/ui';
import { Api } from '../api';

const ICON_CHOICES = [
  { key: 'droplet', bg: '#E6F7FF', col: colors.skyDark },
  { key: 'dumbbell', bg: '#FFEAF2', col: colors.pinkDark },
  { key: 'book', bg: '#EEE7FF', col: colors.purpleDark },
  { key: 'heart', bg: '#FFF0E6', col: colors.coralDark },
  { key: 'star', bg: '#FFF7E0', col: '#C79200' },
];
const DOW = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

// parse "daily" | "weekly:0,2,4" | "hours:2"
function parseRepeat(rep?: string) {
  const r = String(rep || 'daily');
  if (r.startsWith('weekly:')) return { mode: 'weekly', days: r.split(':')[1].split(',').map(Number).filter((n) => n >= 0 && n <= 6), every: 2 };
  if (r.startsWith('hours:')) return { mode: 'hours', days: [0, 2, 4], every: parseInt(r.split(':')[1], 10) || 2 };
  return { mode: 'daily', days: [0, 2, 4], every: 2 };
}

export default function HabitEditScreen({ navigation, route }) {
  const habit = route?.params?.habit || {};
  const init = parseRepeat(habit.repeat);
  const [name, setName] = useState(habit.name || '');
  const [icon, setIcon] = useState(habit.icon || 'droplet');
  const [time, setTime] = useState(habit.time || '');
  const [rMode, setRMode] = useState(init.mode);
  const [rDays, setRDays] = useState<number[]>(init.days.length ? init.days : [0, 2, 4]);
  const [rEvery, setREvery] = useState(init.every);
  const [busy, setBusy] = useState(false);

  const valid = name.trim().length > 0 && (rMode === 'hours' ? rEvery >= 1 : /^\d{1,2}:\d{2}$/.test(time.trim())) && (rMode !== 'weekly' || rDays.length > 0);
  const toggleDay = (d: number) => setRDays((xs) => (xs.includes(d) ? xs.filter((x) => x !== d) : [...xs, d]));
  const buildRepeat = () => (rMode === 'weekly' ? 'weekly:' + [...rDays].sort((a, b) => a - b).join(',') : rMode === 'hours' ? 'hours:' + rEvery : 'daily');

  const save = async () => {
    if (!valid || busy) return;
    setBusy(true);
    try {
      await Api.updateHabit(habit.id, {
        name: name.trim(), icon,
        time: rMode === 'hours' ? '' : time.trim(),
        hint: rMode === 'weekly' ? 'hằng tuần' : rMode === 'hours' ? `mỗi ${rEvery} tiếng` : (habit.hint || ''),
        repeat: buildRepeat(),
      });
      navigation?.goBack?.();
    } catch (e: any) {
      Alert.alert('Chưa lưu được', String(e?.message ?? e));
    } finally { setBusy(false); }
  };

  const remove = () => {
    Alert.alert('Xoá việc này?', `"${habit.name}" sẽ bị xoá. Không hoàn tác được.`, [
      { text: 'Thôi', style: 'cancel' },
      {
        text: 'Xoá', style: 'destructive',
        onPress: async () => {
          try { await Api.deleteHabit(habit.id); navigation?.goBack?.(); }
          catch (e: any) { Alert.alert('Chưa xoá được', String(e?.message ?? e)); }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View style={s.hdr}>
          <Pressable onPress={() => navigation?.goBack?.()} style={s.back}>
            <Icon name="back" size={20} color={colors.ink} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={s.hTitle}>Sửa việc</Text>
            <Text style={s.hSub}>chỉnh lại cho hợp cưng nha</Text>
          </View>
        </View>

        <View style={s.card}>
          <Text style={s.label}>Tên việc</Text>
          <TextInput value={name} onChangeText={setName} placeholder="vd: Uống nước" placeholderTextColor={colors.muted} style={s.input} />

          <Text style={[s.label, { marginTop: 16 }]}>Icon</Text>
          <View style={s.iconRow}>
            {ICON_CHOICES.map((c) => {
              const on = icon === c.key;
              return (
                <Pressable key={c.key} onPress={() => setIcon(c.key)} style={[s.iconPick, { backgroundColor: c.bg }, on && s.iconPickOn]}>
                  <Icon name={c.key} size={22} color={c.col} />
                </Pressable>
              );
            })}
          </View>

          <Text style={[s.label, { marginTop: 16 }]}>Lặp lại</Text>
          <View style={s.seg}>
            {[{ k: 'daily', t: 'Hằng ngày' }, { k: 'weekly', t: 'Hằng tuần' }, { k: 'hours', t: 'Mỗi X giờ' }].map((r) => {
              const on = rMode === r.k;
              return (
                <Pressable key={r.k} onPress={() => setRMode(r.k)} style={[s.segItem, on && s.segItemOn]}>
                  <Text style={[s.segTxt, on && s.segTxtOn]}>{r.t}</Text>
                </Pressable>
              );
            })}
          </View>

          {rMode === 'weekly' && (
            <View style={s.daysRow}>
              {DOW.map((d, i) => {
                const on = rDays.includes(i);
                return (
                  <Pressable key={d} onPress={() => toggleDay(i)} style={[s.dayPick, on && s.dayPickOn]}>
                    <Text style={[s.dayPickTxt, on && { color: '#fff' }]}>{d}</Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          {rMode === 'hours' ? (
            <>
              <Text style={[s.label, { marginTop: 16 }]}>Nhắc mỗi mấy tiếng?</Text>
              <View style={s.qr}>
                {[1, 2, 3, 4].map((n) => {
                  const on = rEvery === n;
                  return (
                    <Pressable key={n} onPress={() => setREvery(n)} style={[s.qrChip, on && s.qrChipOn]}>
                      <Text style={[s.qrChipTxt, on && { color: colors.purpleDark }]}>{n} tiếng</Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          ) : (
            <>
              <Text style={[s.label, { marginTop: 16 }]}>Giờ (HH:MM)</Text>
              <TextInput value={time} onChangeText={setTime} placeholder="vd: 08:00" placeholderTextColor={colors.muted} keyboardType="numbers-and-punctuation" maxLength={5} style={s.input} />
            </>
          )}
        </View>

        <Button label={busy ? 'Đang lưu…' : 'Lưu thay đổi'} tone="mint" disabled={!valid || busy}
          onPress={save} icon={busy ? <ActivityIndicator color="#fff" /> : <Icon name="check" size={18} color="#fff" />}
          style={{ paddingVertical: 15 }} />

        <Pressable onPress={remove} style={s.delBtn}>
          <Text style={s.delTxt}>Xoá việc này</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  hdr: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  back: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#fff', borderWidth: 2, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', ...hardShadow(3, 0.12) },
  hTitle: { fontFamily: fonts.display, fontSize: 20, color: colors.ink },
  hSub: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
  card: { backgroundColor: '#fff', borderWidth: 2, borderColor: colors.line, borderRadius: 24, padding: 16, marginBottom: 18, ...hardShadow(5, 0.14) },
  label: { fontFamily: fonts.heading, fontSize: 13, color: colors.ink, marginBottom: 8 },
  input: { backgroundColor: colors.bg, borderWidth: 2, borderColor: colors.line, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, fontFamily: fonts.body, fontSize: 15, color: colors.ink },
  iconRow: { flexDirection: 'row', gap: 10 },
  iconPick: { width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent', ...hardShadow(3, 0.12) },
  iconPickOn: { borderColor: colors.ink },
  seg: { flexDirection: 'row', gap: 6, backgroundColor: '#F0EAF6', borderRadius: radii.pill, padding: 4, borderWidth: 2, borderColor: colors.line },
  segItem: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: radii.pill },
  segItemOn: { backgroundColor: colors.ink, ...hardShadow(3, 0.14) },
  segTxt: { fontFamily: fonts.heading, fontSize: 12.5, color: colors.muted },
  segTxtOn: { color: '#fff' },
  daysRow: { flexDirection: 'row', gap: 6, marginTop: 12 },
  dayPick: { flex: 1, aspectRatio: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderWidth: 2, borderColor: colors.line },
  dayPickOn: { backgroundColor: colors.purple, borderColor: colors.purpleDark },
  dayPickTxt: { fontFamily: fonts.heading, fontSize: 12, color: colors.muted },
  qr: { flexDirection: 'row', gap: 8 },
  qrChip: { flex: 1, backgroundColor: '#fff', borderWidth: 2, borderColor: '#fff', borderRadius: 14, paddingVertical: 11, alignItems: 'center', ...hardShadow(3, 0.12) },
  qrChipOn: { borderColor: colors.purple },
  qrChipTxt: { fontFamily: fonts.heading, fontSize: 14, color: colors.purpleDark },
  delBtn: { alignSelf: 'center', marginTop: 18, padding: 10 },
  delTxt: { fontFamily: fonts.heading, fontSize: 14, color: colors.coralDark },
});
