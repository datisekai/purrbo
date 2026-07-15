import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet, Alert, ActivityIndicator, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { colors, fonts, radii, hardShadow } from '../theme';
import { Icon } from '../components/Icon';
import { PersonaFace } from '../components/PersonaFace';
import { DatePickerModal } from '../components/DatePickerModal';
import { Button, Bubble } from '../components/ui';
import { Api } from '../api';

const DDMM = (d: Date) => `${d.getDate()}/${d.getMonth() + 1}`;

// Icon còn thiếu (coffee/pin/wand/bell) — vẽ inline tại đây, KHÔNG sửa Icon.js.
function IconX({ name, size = 20, color = colors.ink, stroke = 2.4 }) {
  const box = { width: size, height: size, viewBox: '0 0 24 24' };
  const p = { fill: 'none', stroke: color, strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'coffee':
      return <Svg {...box}><Path {...p} d="M4 9h13v4a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z" /><Path {...p} d="M17 10h2.5a2.5 2.5 0 0 1 0 5H17" /><Path {...p} d="M8 2.5v2M12 2.5v2" /></Svg>;
    case 'pin':
      return <Svg {...box}><Path {...p} d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" /><Circle {...p} cx="12" cy="10" r="2.6" /></Svg>;
    case 'wand':
      return <Svg {...box}><Path {...p} d="M15 6l3 3M4 20l10.5-10.5 2.5 2.5L6.5 22.5z" /><Path {...p} d="M18 3l.6 1.4L20 5l-1.4.6L18 7l-.6-1.4L16 5l1.4-.6z" /><Path {...p} d="M20 11l.4 1 1 .4-1 .4-.4 1-.4-1-1-.4 1-.4z" /></Svg>;
    case 'bell':
      return <Svg {...box}><Path {...p} d="M18 8a6 6 0 0 0-12 0c0 6-3 8-3 8h18s-3-2-3-8" /><Path {...p} d="M10.5 20a2 2 0 0 0 3 0" /></Svg>;
    case 'x':
      return <Svg {...box}><Path {...p} d="M6 6l12 12M18 6L6 18" /></Svg>;
    default:
      return null;
  }
}

// Mẫu lịch nhanh theo nhóm — chạm để điền sẵn form (user tinh chỉnh rồi tạo).
// days: 0=T2..6=CN (chỉ dùng khi mode='weekly').
const TEMPLATE_CATS: {
  key: string; label: string;
  items: { name: string; icon: string; mode: string; time?: string; every?: number; days?: number[] }[];
}[] = [
  {
    key: 'health', label: '💧 Sức khoẻ',
    items: [
      { name: 'Uống nước', icon: 'droplet', mode: 'hours', every: 2 },
      { name: 'Uống vitamin', icon: 'heart', mode: 'daily', time: '09:00' },
      { name: 'Skincare', icon: 'sparkles', mode: 'daily', time: '22:00' },
      { name: 'Thiền 10 phút', icon: 'star', mode: 'daily', time: '06:30' },
      { name: 'Ngủ sớm', icon: 'star', mode: 'daily', time: '23:00' },
    ],
  },
  {
    key: 'gym', label: '💪 Gym & vận động',
    items: [
      { name: 'Gym 3 buổi/tuần', icon: 'dumbbell', mode: 'weekly', time: '18:00', days: [0, 2, 4] },
      { name: 'Chạy bộ sáng', icon: 'dumbbell', mode: 'daily', time: '06:00' },
      { name: 'Yoga tối', icon: 'dumbbell', mode: 'weekly', time: '20:00', days: [1, 3, 6] },
      { name: 'Đi 10k bước', icon: 'dumbbell', mode: 'daily', time: '19:00' },
    ],
  },
  {
    key: 'meal', label: '🍜 Ăn uống',
    items: [
      { name: 'Ăn sáng', icon: 'heart', mode: 'daily', time: '07:00' },
      { name: 'Ăn trưa', icon: 'heart', mode: 'daily', time: '12:00' },
      { name: 'Ăn tối', icon: 'heart', mode: 'daily', time: '19:00' },
      { name: 'Meal prep CN', icon: 'heart', mode: 'weekly', time: '10:00', days: [6] },
    ],
  },
  {
    key: 'study', label: '📚 Học tập',
    items: [
      { name: 'Đọc sách', icon: 'book', mode: 'daily', time: '21:00' },
      { name: 'Học tiếng Anh', icon: 'book', mode: 'daily', time: '20:00' },
      { name: 'Ôn bài', icon: 'book', mode: 'weekly', time: '19:30', days: [0, 2, 4] },
      { name: 'Viết nhật ký', icon: 'book', mode: 'daily', time: '22:30' },
    ],
  },
  {
    key: 'life', label: '🌙 Sinh hoạt',
    items: [
      { name: 'Đi làm', icon: 'star', mode: 'daily', time: '08:00' },
      { name: 'Dọn nhà', icon: 'star', mode: 'weekly', time: '09:00', days: [5] },
      { name: 'Gọi về nhà', icon: 'heart', mode: 'weekly', time: '20:00', days: [6] },
      { name: 'Tưới cây', icon: 'droplet', mode: 'daily', time: '07:30' },
    ],
  },
];

// Icon chọn được ở chế độ tự nhập (dùng Icon.js có sẵn)
const ICON_CHOICES = [
  { key: 'droplet', bg: '#E6F7FF', col: colors.skyDark },
  { key: 'dumbbell', bg: '#FFEAF2', col: colors.pinkDark },
  { key: 'book', bg: '#EEE7FF', col: colors.purpleDark },
  { key: 'heart', bg: '#FFF0E6', col: colors.coralDark },
  { key: 'star', bg: '#FFF7E0', col: '#C79200' },
];

// Đoán icon từ tên việc (NLP không trả icon)
function iconFor(name: string): string {
  const s = (name || '').toLowerCase();
  if (/(nước|uống|trà|cà phê|cafe)/.test(s)) return 'droplet';
  if (/(gym|tập|chạy|bơi|yoga|thể dục|đá banh|bóng)/.test(s)) return 'dumbbell';
  if (/(đọc|sách|học|bài|ôn)/.test(s)) return 'book';
  if (/(ăn|cơm|trưa|tối|sáng|đồ ăn|nấu)/.test(s)) return 'heart';
  return 'star';
}

export default function AddScreen({ navigation }) {
  const [mode, setMode] = useState('nlp'); // 'nlp' = gõ bằng lời · 'manual' = tự nhập
  const [text, setText] = useState(''); // để trống — user tự gõ hoặc chạm gợi ý
  const [parsed, setParsed] = useState(null);
  const [remind, setRemind] = useState(null);
  const [toast, setToast] = useState(false);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [pVariant, setPVariant] = useState('mun');  // persona active → PersonaFace/copy đúng
  const [pName, setPName] = useState('bạn đồng hành');
  useEffect(() => {
    (async () => {
      try {
        const [st, cat] = await Promise.all([Api.state(), Api.personas()]);
        const active = Array.isArray(cat) ? cat.find((p: any) => p.key === st.persona_key) : null;
        if (active?.variant) setPVariant(active.variant);
        if (active?.name) setPName(active.name);
      } catch {}
    })();
  }, []);
  const tRef = useRef(null);

  // Tự nhập
  const [mName, setMName] = useState('');
  const [mIcon, setMIcon] = useState('droplet');
  const [mTime, setMTime] = useState('');
  const [mRemind, setMRemind] = useState('15 phút');
  // Lặp lại
  const [rMode, setRMode] = useState('daily');   // daily | weekly | hours | once
  const [rDays, setRDays] = useState([0, 2, 4]);  // 0=T2..6=CN
  const [rEvery, setREvery] = useState(2);        // mỗi X giờ
  const [rDate, setRDate] = useState(() => new Date());  // 'once' → ngày cụ thể
  const [pickerOpen, setPickerOpen] = useState(false);
  const [tplCat, setTplCat] = useState(TEMPLATE_CATS[0].key);
  const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const addDays = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return d; };
  const mValid =
    mName.trim().length > 0 &&
    (rMode === 'hours' ? rEvery >= 1 : /^\d{1,2}:\d{2}$/.test(mTime.trim())) &&
    (rMode !== 'weekly' || rDays.length > 0);

  const buildRepeat = () => {
    if (rMode === 'once') return 'once:' + ymd(rDate);
    if (rMode === 'weekly') return 'weekly:' + [...rDays].sort((a, b) => a - b).join(',');
    if (rMode === 'hours') return 'hours:' + rEvery;
    return 'daily';
  };
  const toggleDay = (d: number) =>
    setRDays((xs) => (xs.includes(d) ? xs.filter((x) => x !== d) : [...xs, d]));

  const complete = !!remind;

  const showToast = () => {
    setToast(true);
    if (tRef.current) clearTimeout(tRef.current);
    tRef.current = setTimeout(() => {
      setToast(false);
      navigation?.goBack?.();
    }, 1100);
  };

  const applyTemplate = (t: any) => {
    setMName(t.name); setMIcon(t.icon); setRMode(t.mode);
    if (t.mode === 'hours') setREvery(t.every || 2);
    else setMTime(t.time || '');
    if (t.mode === 'weekly' && Array.isArray(t.days)) setRDays(t.days);
  };

  const createManual = async () => {
    if (!mValid || creating) return;
    Keyboard.dismiss();
    setCreating(true);
    try {
      const repeat = buildRepeat();
      const hintBits = [];
      if (rMode === 'weekly') hintBits.push('hằng tuần');
      if (rMode === 'hours') hintBits.push('mỗi ' + rEvery + ' tiếng');
      if (mRemind && rMode !== 'hours') hintBits.push('nhắc trước ' + mRemind);
      await Api.createHabit({
        name: mName.trim(),
        icon: mIcon,
        time: rMode === 'hours' ? '' : mTime.trim(),
        hint: hintBits.join(' · '),
        repeat,
      });
      showToast();
    } catch (e) {
      Alert.alert('Ối, tạo lịch chưa được', String(e?.message ?? e));
    } finally { setCreating(false); }
  };

  const detected = parsed
    ? [
        { key: 'work', ic: 'coffee', inline: true, bg: '#FFEAF2', col: colors.pinkDark, label: 'Việc', val: parsed.name },
        { key: 'who', ic: 'user', inline: false, bg: '#EEE7FF', col: colors.purpleDark, label: 'Với ai', val: parsed.withwho },
        { key: 'time', ic: 'clock', inline: false, bg: '#E6F7FF', col: colors.skyDark, label: 'Thời gian', val: parsed.time },
        { key: 'place', ic: 'pin', inline: true, bg: '#FFF0E6', col: colors.coralDark, label: 'Địa điểm', val: parsed.place },
      ]
    : [];

  const reset = () => {
    setParsed(null);
    setRemind(null);
    setToast(false);
    if (tRef.current) clearTimeout(tRef.current);
  };

  const runParse = async () => {
    if (!text.trim() || loading) return;
    Keyboard.dismiss();   // tắt bàn phím để thấy kết quả bên dưới
    setLoading(true);
    try {
      const res = await Api.nlpParse(text);
      const missing = Array.isArray(res?.missing) ? res.missing : [];
      setParsed(res);
      // Nếu backend đã có remind (không nằm trong missing) thì điền sẵn.
      setRemind(res?.remind && !missing.includes('remind') ? res.remind : null);
    } catch (e) {
      Alert.alert('Ối, Purrbo chưa hiểu', String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  };

  const create = async () => {
    if (!complete || !parsed || creating) return;
    setCreating(true);
    try {
      await Api.createHabit({
        name: parsed.name,
        icon: iconFor(parsed.name),
        time: parsed.time,
        hint: parsed.withwho ? 'với ' + parsed.withwho : '',
        repeat: parsed.repeat || 'daily',   // NLP trả repeat (vd weekly:5) → dùng luôn
      });
      showToast();
    } catch (e) {
      Alert.alert('Ối, tạo lịch chưa được', String(e?.message ?? e));
    } finally { setCreating(false); }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      {/* Toast */}
      {toast && (
        <View style={s.toast}>
          <Icon name="heartfill" size={16} color="#FF9BC1" />
          <Text style={s.toastTxt}>Đã thêm! Purrbo sẽ nhắc cưng đúng giờ 💗</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
        {/* Header */}
        <View style={s.hdr}>
          <Pressable onPress={() => navigation?.goBack?.()} style={s.back}>
            <Icon name="back" size={20} color={colors.ink} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={s.hTitle}>Thêm việc mới</Text>
            <Text style={s.hSub}>gõ bằng lời, hoặc tự nhập cho nhanh</Text>
          </View>
        </View>

        {/* Chọn cách thêm */}
        <View style={s.modeSeg}>
          {[
            { k: 'nlp', label: 'Bằng lời' },
            { k: 'manual', label: 'Tự nhập' },
          ].map((m) => {
            const on = mode === m.k;
            return (
              <Pressable key={m.k} onPress={() => setMode(m.k)} style={[s.modeItem, on && s.modeItemOn]}>
                <Text style={[s.modeTxt, on && s.modeTxtOn]}>{m.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {mode === 'manual' && (
          <View style={s.mcard}>
            <Text style={s.mLabel}>Mẫu nhanh</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="always" style={{ marginBottom: 10 }} contentContainerStyle={{ gap: 6 }}>
              {TEMPLATE_CATS.map((c) => {
                const on = tplCat === c.key;
                return (
                  <Pressable key={c.key} onPress={() => setTplCat(c.key)} style={[s.tplCat, on && s.tplCatOn]}>
                    <Text style={[s.tplCatTxt, on && s.tplCatTxtOn]}>{c.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="always" style={{ marginBottom: 16 }} contentContainerStyle={{ gap: 8 }}>
              {(TEMPLATE_CATS.find((c) => c.key === tplCat)?.items || []).map((t) => (
                <Pressable key={t.name} onPress={() => applyTemplate(t)} style={s.tpl}>
                  <Icon name={t.icon} size={15} color={colors.purpleDark} />
                  <Text style={s.tplTxt}>{t.name}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={s.mLabel}>Tên việc</Text>
            <TextInput
              value={mName}
              onChangeText={setMName}
              placeholder="vd: Uống nước"
              placeholderTextColor={colors.muted}
              style={s.mInput}
            />

            <Text style={[s.mLabel, { marginTop: 16 }]}>Icon</Text>
            <View style={s.iconRow}>
              {ICON_CHOICES.map((c) => {
                const on = mIcon === c.key;
                return (
                  <Pressable
                    key={c.key}
                    onPress={() => setMIcon(c.key)}
                    style={[s.iconPick, { backgroundColor: c.bg }, on && s.iconPickOn]}
                  >
                    <Icon name={c.key} size={22} color={c.col} />
                  </Pressable>
                );
              })}
            </View>

            <Text style={[s.mLabel, { marginTop: 16 }]}>Lặp lại</Text>
            <View style={s.rSeg}>
              {[
                { k: 'once', label: 'Một lần' },
                { k: 'daily', label: 'Hằng ngày' },
                { k: 'weekly', label: 'Hằng tuần' },
                { k: 'hours', label: 'Mỗi X giờ' },
              ].map((r) => {
                const on = rMode === r.k;
                return (
                  <Pressable key={r.k} onPress={() => setRMode(r.k)} style={[s.rItem, on && s.rItemOn]}>
                    <Text style={[s.rTxt, on && s.rTxtOn]}>{r.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            {rMode === 'once' && (
              <View style={s.qr}>
                {[{ lbl: 'Hôm nay', n: 0 }, { lbl: 'Mai', n: 1 }, { lbl: 'Mốt', n: 2 }].map((o) => {
                  const on = ymd(rDate) === ymd(addDays(o.n));
                  return (
                    <Pressable key={o.n} onPress={() => setRDate(addDays(o.n))} style={[s.qrChip, on && s.qrChipOn]}>
                      <Text style={[s.qrChipTxt, on && s.qrChipTxtOn]}>{o.lbl}</Text>
                    </Pressable>
                  );
                })}
                {(() => {
                  const preset = [0, 1, 2].some((n) => ymd(rDate) === ymd(addDays(n)));
                  return (
                    <Pressable onPress={() => setPickerOpen(true)} style={[s.qrChip, !preset && s.qrChipOn, { flexDirection: 'row', gap: 4 }]}>
                      <Icon name="calendar" size={14} color={colors.purpleDark} />
                      <Text style={[s.qrChipTxt, !preset && s.qrChipTxtOn]}>{preset ? 'Ngày khác' : DDMM(rDate)}</Text>
                    </Pressable>
                  );
                })()}
              </View>
            )}

            {rMode === 'weekly' && (
              <View style={s.daysRow}>
                {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d, i) => {
                  const on = rDays.includes(i);
                  return (
                    <Pressable key={d} onPress={() => toggleDay(i)} style={[s.dayPick, on && s.dayPickOn]}>
                      <Text style={[s.dayPickTxt, on && s.dayPickTxtOn]}>{d}</Text>
                    </Pressable>
                  );
                })}
              </View>
            )}

            {rMode === 'hours' ? (
              <>
                <Text style={[s.mLabel, { marginTop: 16 }]}>Nhắc mỗi mấy tiếng?</Text>
                <View style={s.qr}>
                  {[1, 2, 3, 4].map((n) => {
                    const on = rEvery === n;
                    return (
                      <Pressable key={n} onPress={() => setREvery(n)} style={[s.qrChip, on && s.qrChipOn]}>
                        <Text style={[s.qrChipTxt, on && s.qrChipTxtOn]}>{n} tiếng</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            ) : (
              <>
                <Text style={[s.mLabel, { marginTop: 16 }]}>Giờ (HH:MM)</Text>
                <TextInput
                  value={mTime}
                  onChangeText={setMTime}
                  placeholder="vd: 08:00"
                  placeholderTextColor={colors.muted}
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                  style={s.mInput}
                />

                <Text style={[s.mLabel, { marginTop: 16 }]}>Nhắc trước</Text>
                <View style={s.qr}>
                  {['15 phút', '30 phút', '1 tiếng'].map((v) => {
                    const on = mRemind === v;
                    return (
                      <Pressable key={v} onPress={() => setMRemind(v)} style={[s.qrChip, on && s.qrChipOn]}>
                        <Text style={[s.qrChipTxt, on && s.qrChipTxtOn]}>{v}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            )}

            <Button
              label={creating ? 'Đang tạo…' : mValid ? 'Tạo lịch' : 'Nhập tên & giờ để tạo'}
              tone="mint"
              disabled={!mValid || creating}
              onPress={createManual}
              icon={creating ? <ActivityIndicator color="#fff" /> : mValid ? <Icon name="check" size={18} color="#fff" /> : null}
              style={{ marginTop: 20, paddingVertical: 15 }}
            />
          </View>
        )}

        {mode === 'nlp' && (
        <>
        {/* NLP input */}
        <View style={s.nlp}>
          <View style={s.tip}>
            <Icon name="sparkles" size={14} color={colors.purpleDark} />
            <Text style={s.tipTxt}>Nói kiểu gì em cũng hiểu</Text>
          </View>
          <View>
            <TextInput
              value={text}
              onChangeText={(v) => { setText(v); if (parsed) reset(); }}
              placeholder="vd: mai 7h cà phê với crush ở The Coffee House"
              placeholderTextColor={colors.muted}
              multiline
              style={s.input}
            />
            {text.length > 0 && (
              <Pressable onPress={() => { setText(''); if (parsed) reset(); }} style={s.clearBtn} hitSlop={8}>
                <IconX name="x" size={16} color={colors.muted} />
              </Pressable>
            )}
          </View>

          {/* Gợi ý mẫu — chạm để điền nhanh */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }} contentContainerStyle={{ gap: 8 }}>
            {['uống nước mỗi 2 tiếng', 'gym 18h thứ 3 5 7', 'mai 7h cà phê với crush', 'đọc sách 21h mỗi tối'].map((ex) => (
              <Pressable key={ex} onPress={() => { setText(ex); if (parsed) reset(); }} style={s.exChip}>
                <Text style={s.exChipTxt}>{ex}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <Button
            label={loading ? 'Purrbo đang hiểu…' : 'Purrbo hiểu giúp'}
            tone="pink"
            disabled={loading || !text.trim()}
            onPress={runParse}
            icon={<IconX name="wand" size={17} color="#fff" />}
            style={{ marginTop: 12, paddingVertical: 14 }}
          />
        </View>

        {parsed && (
          <>
            {/* Section title */}
            <View style={s.sect}>
              <Text style={s.sectTxt}>Purrbo hiểu là</Text>
              <View style={s.pill}>
                <Icon name="check" size={11} color={colors.mintDark} />
                <Text style={s.pillTxt}>{detected.filter((f) => f.val).length + (remind ? 1 : 0)}/5 xong</Text>
              </View>
            </View>

            {/* Parsed card */}
            <View style={s.card}>
              {detected.map((f) => (
                <View key={f.key} style={s.field}>
                  <View style={[s.fic, { backgroundColor: f.bg }]}>
                    {f.inline
                      ? <IconX name={f.ic} size={20} color={f.col} />
                      : <Icon name={f.ic} size={20} color={f.col} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.fLabel}>{f.label}</Text>
                    <Text style={s.fVal}>{f.val}</Text>
                  </View>
                  {f.val ? (
                    <View style={[s.tag, s.tagOk]}>
                      <Icon name="check" size={12} color={colors.mintDark} />
                      <Text style={s.tagOkTxt}>ok</Text>
                    </View>
                  ) : (
                    <View style={[s.tag, s.tagNeed]}><Text style={s.tagNeedTxt}>—</Text></View>
                  )}
                </View>
              ))}

              {/* Missing field */}
              <View style={[s.field, remind ? s.fieldFilled : s.fieldMiss]}>
                <View style={[s.fic, { backgroundColor: remind ? '#EAF7F1' : '#FFF0E6' }]}>
                  <IconX name="bell" size={20} color={remind ? colors.mintDark : colors.coralDark} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.fLabel}>Nhắc trước bao lâu?</Text>
                  {remind
                    ? <Text style={s.fVal}>{remind}</Text>
                    : <Text style={[s.fVal, { color: colors.coralDark }]}>chưa có · {pName} đang hỏi</Text>}
                </View>
                {remind ? (
                  <View style={[s.tag, s.tagOk]}>
                    <Icon name="check" size={12} color={colors.mintDark} />
                    <Text style={s.tagOkTxt}>ok</Text>
                  </View>
                ) : (
                  <View style={[s.tag, s.tagNeed]}>
                    <Text style={s.tagNeedTxt}>thiếu</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Persona helper */}
            <View style={s.helper}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
                <PersonaFace variant={pVariant} ring="ssr" size={52} />
                <Bubble
                  style={{ flex: 1, borderColor: '#fff' }}
                  text={complete
                    ? `Chốt đơn! Em canh giùm cưng trước ${remind}, trễ là em cào sofa đó nha 😼💗`
                    : 'Nhắc trước bao lâu để em canh giùm cưng? 👀'}
                />
              </View>
              {!complete && (
                <View style={s.qr}>
                  {['15 phút', '30 phút', '1 tiếng'].map((v) => (
                    <Pressable key={v} onPress={() => setRemind(v)} style={s.qrChip}>
                      <Text style={s.qrChipTxt}>{v}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            {/* Create */}
            <Button
              label={creating ? 'Đang tạo…' : complete ? 'Tạo lịch' : 'Trả lời để tạo lịch'}
              tone="mint"
              disabled={!complete || creating}
              onPress={create}
              icon={creating ? <ActivityIndicator color="#fff" /> : complete ? <Icon name="check" size={18} color="#fff" /> : null}
              style={{ paddingVertical: 15 }}
            />
          </>
        )}
        </>
        )}
      </ScrollView>
      <DatePickerModal
        visible={pickerOpen}
        value={rDate}
        onSelect={setRDate}
        onClose={() => setPickerOpen(false)}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  // Header
  hdr: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  back: {
    width: 42, height: 42, borderRadius: 14, backgroundColor: '#fff',
    borderWidth: 2, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', ...hardShadow(3, 0.12),
  },
  hTitle: { fontFamily: fonts.display, fontSize: 20, color: colors.ink },
  hSub: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },

  // NLP input
  nlp: {
    backgroundColor: '#F6ECFB', borderRadius: 28, padding: 16,
    borderWidth: 2, borderColor: '#fff', marginBottom: 18, ...hardShadow(5, 0.14),
  },
  tip: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  tipTxt: { fontFamily: fonts.heading, fontSize: 12, color: colors.purpleDark },
  input: {
    backgroundColor: '#fff', borderWidth: 2, borderColor: '#fff', borderRadius: 18,
    paddingVertical: 13, paddingLeft: 14, paddingRight: 40, minHeight: 78, textAlignVertical: 'top',
    fontFamily: fonts.body, fontSize: 15, color: colors.ink, lineHeight: 22, ...hardShadow(3, 0.12),
  },
  clearBtn: {
    position: 'absolute', top: 10, right: 10, width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#F0EAF6', alignItems: 'center', justifyContent: 'center',
  },
  exChip: {
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E3D8FF', borderRadius: radii.pill,
    paddingVertical: 7, paddingHorizontal: 12,
  },
  tpl: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#F1ECF6', borderWidth: 1.5, borderColor: '#E3D8FF', borderRadius: radii.pill,
    paddingVertical: 8, paddingHorizontal: 12,
  },
  tplTxt: { fontFamily: fonts.heading, fontSize: 13, color: colors.purpleDark },
  tplCat: { backgroundColor: colors.bg, borderWidth: 1.5, borderColor: colors.line, borderRadius: radii.pill, paddingVertical: 6, paddingHorizontal: 11 },
  tplCatOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  tplCatTxt: { fontFamily: fonts.heading, fontSize: 12.5, color: colors.muted },
  tplCatTxtOn: { color: '#fff' },
  exChipTxt: { fontFamily: fonts.heading, fontSize: 12, color: colors.purpleDark },

  // Section
  sect: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 4, marginBottom: 12 },
  sectTxt: { fontFamily: fonts.display, fontSize: 16, color: colors.ink },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#EAF7F1',
    borderWidth: 2, borderColor: '#CFEDE0', borderRadius: radii.pill, paddingVertical: 3, paddingHorizontal: 9,
  },
  pillTxt: { fontFamily: fonts.heading, fontSize: 11, color: colors.mintDark },

  // Card
  card: {
    backgroundColor: '#fff', borderWidth: 2, borderColor: colors.line,
    borderRadius: 24, padding: 14, marginBottom: 18, ...hardShadow(5, 0.14),
  },
  field: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 11,
    borderRadius: 18, borderWidth: 2, borderColor: colors.line, marginBottom: 9,
  },
  fieldMiss: { borderColor: '#FFD9C7', backgroundColor: '#FFF6F1' },
  fieldFilled: { borderColor: '#CFEDE0', backgroundColor: '#F3FBF7' },
  fic: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center', ...hardShadow(3, 0.12) },
  fLabel: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.muted, marginBottom: 1 },
  fVal: { fontFamily: fonts.heading, fontSize: 15, color: colors.ink },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: radii.pill, borderWidth: 2, paddingVertical: 5, paddingHorizontal: 9 },
  tagOk: { backgroundColor: '#EAF7F1', borderColor: '#CFEDE0' },
  tagOkTxt: { fontFamily: fonts.heading, fontSize: 11, color: colors.mintDark },
  tagNeed: { backgroundColor: '#FFF0E6', borderColor: '#FFD9C7' },
  tagNeedTxt: { fontFamily: fonts.heading, fontSize: 11, color: colors.coralDark },

  // Persona helper
  helper: {
    backgroundColor: '#F6ECFB', borderRadius: 26, padding: 16,
    borderWidth: 2, borderColor: '#fff', marginBottom: 16, ...hardShadow(5, 0.14),
  },
  qr: { flexDirection: 'row', gap: 8, marginTop: 12 },
  qrChip: {
    flex: 1, backgroundColor: '#fff', borderWidth: 2, borderColor: '#fff',
    borderRadius: 14, paddingVertical: 11, paddingHorizontal: 8, alignItems: 'center', ...hardShadow(3, 0.12),
  },
  qrChipOn: { borderColor: colors.purple },
  qrChipTxt: { fontFamily: fonts.heading, fontSize: 14, color: colors.purpleDark },
  qrChipTxtOn: { color: colors.purpleDark },

  // Chọn cách thêm (segmented)
  modeSeg: {
    flexDirection: 'row', gap: 6, backgroundColor: '#F0EAF6', borderRadius: radii.pill,
    padding: 4, borderWidth: 2, borderColor: colors.line, marginBottom: 18,
  },
  modeItem: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: radii.pill },
  modeItemOn: { backgroundColor: colors.ink, ...hardShadow(3, 0.14) },
  modeTxt: { fontFamily: fonts.heading, fontSize: 14, color: colors.muted },
  modeTxtOn: { color: '#fff' },

  // Card tự nhập
  mcard: {
    backgroundColor: '#fff', borderWidth: 2, borderColor: colors.line,
    borderRadius: 24, padding: 16, marginBottom: 18, ...hardShadow(5, 0.14),
  },
  mLabel: { fontFamily: fonts.heading, fontSize: 13, color: colors.ink, marginBottom: 8 },
  mInput: {
    backgroundColor: colors.bg, borderWidth: 2, borderColor: colors.line, borderRadius: 14,
    paddingVertical: 12, paddingHorizontal: 14, fontFamily: fonts.body, fontSize: 15, color: colors.ink,
  },
  iconRow: { flexDirection: 'row', gap: 10 },
  iconPick: {
    width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'transparent', ...hardShadow(3, 0.12),
  },
  iconPickOn: { borderColor: colors.ink },

  rSeg: {
    flexDirection: 'row', gap: 6, backgroundColor: '#F0EAF6', borderRadius: radii.pill,
    padding: 4, borderWidth: 2, borderColor: colors.line,
  },
  rItem: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: radii.pill },
  rItemOn: { backgroundColor: colors.ink, ...hardShadow(3, 0.14) },
  rTxt: { fontFamily: fonts.heading, fontSize: 12.5, color: colors.muted },
  rTxtOn: { color: '#fff' },
  daysRow: { flexDirection: 'row', gap: 6, marginTop: 12 },
  dayPick: {
    flex: 1, aspectRatio: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff', borderWidth: 2, borderColor: colors.line,
  },
  dayPickOn: { backgroundColor: colors.purple, borderColor: colors.purpleDark },
  dayPickTxt: { fontFamily: fonts.heading, fontSize: 12, color: colors.muted },
  dayPickTxtOn: { color: '#fff' },

  // Toast
  toast: {
    position: 'absolute', top: 52, alignSelf: 'center', zIndex: 30,
    flexDirection: 'row', alignItems: 'center', gap: 8, maxWidth: 320,
    backgroundColor: colors.ink, borderRadius: radii.pill, paddingVertical: 11, paddingHorizontal: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 10,
  },
  toastTxt: { fontFamily: fonts.heading, fontSize: 14, color: '#fff', flexShrink: 1 },
});
