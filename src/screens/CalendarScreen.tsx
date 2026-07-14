import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { colors, fonts, radii, hardShadow } from '../theme';
import { Icon } from '../components/Icon';
import { PersonaFace } from '../components/PersonaFace';
import { Button, SkeletonRow } from '../components/ui';
import { Api } from '../api';
import { getGcalToken, getLarkToken } from '../googleCalendar';
import { playSuccess } from '../sound';

// Icon phụ chưa có trong Icon.js — render inline (đừng sửa Icon.js, agent khác đang chỉnh).
function MiniIcon({ name, size = 22, color = colors.ink, stroke = 2.4 }) {
  const box = { width: size, height: size, viewBox: '0 0 24 24' };
  const p = { fill: 'none', stroke: color, strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'briefcase':
      return (
        <Svg {...box}>
          <Rect {...p} x="3" y="7.5" width="18" height="12" rx="2.5" />
          <Path {...p} d="M8.5 7.5V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v1.5M3 13h18" />
        </Svg>
      );
    case 'coffee':
      return (
        <Svg {...box}>
          <Path {...p} d="M5 9h11v5a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5z" />
          <Path {...p} d="M16 10h2.5a2.5 2.5 0 0 1 0 5H16" />
          <Path {...p} d="M8 3v2M11.5 3v2" />
        </Svg>
      );
    case 'mic':
      return (
        <Svg {...box}>
          <Rect {...p} x="9" y="3" width="6" height="11" rx="3" />
          <Path {...p} d="M6 11a6 6 0 0 0 12 0M12 17v4" />
        </Svg>
      );
    default:
      return null;
  }
}

const WEEK = [
  { dow: 'T2', num: 8, dot: false },
  { dow: 'T3', num: 9, dot: true },
  { dow: 'T4', num: 10, dot: false },
  { dow: 'T5', num: 11, dot: true },
  { dow: 'T6', num: 12, dot: false },
  { dow: 'T7', num: 13, dot: true, today: true },
  { dow: 'CN', num: 14, dot: false },
];

const PRAISE = {
  water: 'Ưng cái bụng ghê, uống nước ngoan xỉu 💗',
  gym: 'Đi gym thật hả?? Mê cái nết chăm này 😍',
  book: 'Cưng của em trí thức ghê chưa 🥹📖',
};

const NOTE = 'Hôm nay cưng có 5 việc lận, làm hết là em thương gấp đôi đó 💗';

// Tháng 7 (world của app: 1/7 = T2). Ô có việc → chấm.
const MONTH_DOW = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const MONTH_DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const TODAY = 13;
const DOTS = new Set([9, 11, 13, 16, 20, 25, 28]);

// icon nào có sẵn trong Icon.js thì dùng shared, còn lại render inline
const SHARED = { droplet: true, dumbbell: true, book: true };

// Map habit.icon (từ backend) → cách render icon của màn hình (ic + màu nền/viền)
const HABIT_STYLE = {
  droplet: { ic: 'droplet', bg: '#E6F7FF', col: colors.skyDark },
  water: { ic: 'droplet', bg: '#E6F7FF', col: colors.skyDark },
  dumbbell: { ic: 'dumbbell', bg: '#FFEAF2', col: colors.pinkDark },
  gym: { ic: 'dumbbell', bg: '#FFEAF2', col: colors.pinkDark },
  book: { ic: 'book', bg: '#EEE7FF', col: colors.purpleDark },
  coffee: { ic: 'coffee', bg: '#FFF0E6', col: colors.coralDark },
  briefcase: { ic: 'briefcase', bg: '#EEE7FF', col: colors.purpleDark },
  mic: { ic: 'mic', bg: '#FFF0E6', col: colors.coralDark },
};
const DEFAULT_STYLE = { ic: 'droplet', bg: '#F1ECF6', col: colors.purpleDark };

// SA / CH / TỐI suy ra từ giờ
function ampmOf(time) {
  const h = parseInt(String(time ?? '').slice(0, 2), 10) || 0;
  if (h < 12) return 'SA';
  if (h < 18) return 'CH';
  return 'TỐI';
}

// backend habit {id,name,icon,time,hint,done} → item của timeline
function toItem(h) {
  return {
    id: 'h' + h.id,
    hid: h.id,
    type: 'habit',
    time: h.time || '',
    ampm: ampmOf(h.time),
    ...(HABIT_STYLE[h.icon] || DEFAULT_STYLE),
    name: h.name,
    nudge: h.hint || '',
    done: !!h.done,
  };
}

// event Google {title,start(ISO),location} → item timeline (chỉ khi đã kết nối thật)
function gEventToItem(e, i) {
  const s = String(e.start || '');
  const hm = s.length >= 16 && s.includes('T') ? s.slice(11, 16) : ''; // HH:MM (rỗng = cả ngày)
  return {
    id: 'g' + i,
    type: 'sync',
    time: hm || '—',
    ampm: hm ? ampmOf(hm) : 'CẢ NGÀY',
    ic: 'briefcase',
    bg: '#E6F7FF',
    col: colors.skyDark,
    name: e.title || '(không tiêu đề)',
    nudge: e.location ? 'ở ' + e.location : 'lịch từ Google Calendar',
  };
}

export default function CalendarScreen({ navigation }) {
  const [sel, setSel] = useState(13);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('week'); // 'week' = 7 ngày · 'month' = 30 ngày
  const [note, setNote] = useState(NOTE);
  const [gcalOn, setGcalOn] = useState(false);
  // Mặc định (offline): chỉ habit mẫu — KHÔNG bịa event Google.
  const [items, setItems] = useState([
    { id: 'water', type: 'habit', time: '08:00', ampm: 'SA', ic: 'droplet', bg: '#E6F7FF', col: colors.skyDark, name: 'Uống nước', nudge: 'cưng nhấp môi 1 ngụm cho em vui nha', done: false },
    { id: 'gym', type: 'habit', time: '18:00', ampm: 'CH', ic: 'dumbbell', bg: '#FFEAF2', col: colors.pinkDark, name: 'Gym', nudge: 'trốn tập là em dỗi cả tối', done: false },
    { id: 'book', type: 'habit', time: '21:00', ampm: 'TỐI', ic: 'book', bg: '#EEE7FF', col: colors.purpleDark, name: 'Đọc sách', nudge: '10 trang thôi, xong em ôm cưng ngủ', done: false },
  ]);

  // Nạp lại mỗi lần vào màn (đổi sau khi thêm lịch / kết nối Google ở Cài đặt).
  // Habit thật từ backend; event Google CHỈ khi đã kết nối (có access_token).
  const load = useCallback(async () => {
    let base = [];
    try {
      const habits = await Api.habits();
      if (Array.isArray(habits)) base = habits.map(toItem);
    } catch {
      /* backend die → giữ default */
    }
    let gitems = [];
    let conn = false;
    // Google
    try {
      const tok = await getGcalToken();
      if (tok) {
        conn = true;
        const evs = await Api.calendarEvents(tok, 'google');
        if (Array.isArray(evs)) gitems = gitems.concat(evs.map(gEventToItem));
      }
    } catch {}
    // Lark
    try {
      const ltok = await getLarkToken();
      if (ltok) {
        conn = true;
        const evs = await Api.calendarEvents(ltok, 'lark');
        if (Array.isArray(evs)) gitems = gitems.concat(evs.map((e, i) => ({ ...gEventToItem(e, 1000 + i), nudge: e.location ? 'ở ' + e.location : 'lịch từ Lark' })));
      }
    } catch {}
    setGcalOn(conn);
    if (base.length || gitems.length) {
      setItems(
        [...base, ...gitems].sort((a, b) => String(a.time).localeCompare(String(b.time)))
      );
    }
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const khoe = async (it) => {
    if (it.type !== 'habit' || it.done) return;
    playSuccess();
    // optimistic
    setItems((xs) => xs.map((x) => (x.id === it.id ? { ...x, done: true } : x)));
    try {
      const r = await Api.khoe(it.hid ?? it.id);
      if (r && r.line) setNote(r.line);
      else setNote(PRAISE[it.id] || NOTE);
    } catch (e) {
      setNote(PRAISE[it.id] || NOTE);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.top}>
          <View style={{ flex: 1 }}>
            <Text style={s.hi}>Tháng 7</Text>
            <Text style={s.sub}>Chọn ngày để xem lịch nha cưng</Text>
          </View>
          <Pressable
            onPress={() => navigation?.navigate?.('Settings')}
            style={[s.synced, !gcalOn && s.syncedOff]}
          >
            <Icon
              name={gcalOn ? 'check' : 'calendar'}
              size={13}
              color={gcalOn ? colors.mintDark : colors.muted}
            />
            <Text style={[s.syncedTxt, !gcalOn && s.syncedOffTxt]}>
              Google Calendar{'\n'}{gcalOn ? 'đã đồng bộ' : 'chạm để kết nối'}
            </Text>
          </Pressable>
        </View>

        {/* Toggle 7 / 30 ngày */}
        <View style={s.viewSeg}>
          {[
            { k: 'week', label: '7 ngày' },
            { k: 'month', label: '30 ngày' },
          ].map((v) => {
            const on = view === v.k;
            return (
              <Pressable key={v.k} onPress={() => setView(v.k)} style={[s.viewItem, on && s.viewItemOn]}>
                <Text style={[s.viewTxt, on && s.viewTxtOn]}>{v.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {view === 'week' ? (
          /* Week strip */
          <View style={s.week}>
            {WEEK.map((d) => {
              const isSel = sel === d.num && !d.today;
              return (
                <Pressable
                  key={d.num}
                  onPress={() => setSel(d.num)}
                  style={[s.day, d.today && s.dayToday, isSel && s.daySel]}
                >
                  <Text style={[s.dow, d.today && s.dayTodayTxt]}>{d.dow}</Text>
                  <Text style={[s.num, d.today && s.dayTodayTxt]}>{d.num}</Text>
                  {d.dot && <View style={[s.dot, d.today && { backgroundColor: '#fff' }]} />}
                </Pressable>
              );
            })}
          </View>
        ) : (
          /* Month grid — 30 ngày */
          <View style={s.month}>
            <View style={s.mDowRow}>
              {MONTH_DOW.map((d) => (
                <Text key={d} style={s.mDow}>{d}</Text>
              ))}
            </View>
            <View style={s.mGrid}>
              {MONTH_DAYS.map((n) => {
                const today = n === TODAY;
                const isSel = sel === n && !today;
                return (
                  <Pressable key={n} onPress={() => setSel(n)} style={s.mCellWrap}>
                    <View style={[s.mCell, today && s.mCellToday, isSel && s.mCellSel]}>
                      <Text style={[s.mNum, today && s.dayTodayTxt]}>{n}</Text>
                      {DOTS.has(n) && <View style={[s.mDot, today && { backgroundColor: '#fff' }]} />}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* Persona note */}
        <View style={s.note}>
          <PersonaFace variant="mun" ring="ssr" size={48} />
          <View style={s.bubble}>
            <View style={s.who}>
              <Icon name="heart" size={12} color={colors.purpleDark} />
              <Text style={s.whoTxt}>Mèo Mun</Text>
            </View>
            <Text style={s.bubbleTxt}>{note}</Text>
          </View>
        </View>

        {/* Section title */}
        <View style={s.stitle}>
          <Text style={s.stitleTxt}>Lịch hôm nay</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Icon name="calendar" size={13} color={colors.muted} />
            <Text style={s.stitleSub}>13/07 · T7</Text>
          </View>
        </View>

        {/* Timeline */}
        <View>
          {loading && [0, 1, 2].map((i) => <SkeletonRow key={'sk' + i} />)}
          {!loading && items.map((it) => (
            <View key={it.id} style={s.row}>
              <View style={s.time}>
                <Text style={s.timeBig}>{it.time}</Text>
                <Text style={s.timeSmall}>{it.ampm}</Text>
              </View>
              <View style={[s.item, it.done && { opacity: 0.55 }]}>
                <View style={[s.itemIc, { backgroundColor: it.bg }]}>
                  {SHARED[it.ic]
                    ? <Icon name={it.ic} size={22} color={it.col} />
                    : <MiniIcon name={it.ic} size={22} color={it.col} />}
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <Text style={[s.itemName, it.done && { textDecorationLine: 'line-through' }]}>{it.name}</Text>
                    {it.type === 'sync' && (
                      <View style={s.gtag}>
                        <Icon name="calendar" size={9} color={colors.skyDark} />
                        <Text style={s.gtagTxt}>từ Google</Text>
                      </View>
                    )}
                  </View>
                  <View style={s.nudge}>
                    <Icon name="heart" size={11} color={colors.muted} />
                    <Text style={s.nudgeTxt}>{it.nudge}</Text>
                  </View>
                </View>
                {it.type === 'habit' && (
                  it.done ? (
                    <Button label="Đã khoe" tone="mint" onPress={() => {}} icon={<Icon name="check" size={14} color={colors.mintDark} />} style={s.khoeBtn} />
                  ) : (
                    <Button label="Khoe" tone="mint" onPress={() => khoe(it)} icon={<Icon name="heart" size={14} color="#fff" />} style={s.khoeBtn} />
                  )
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Thêm bằng lời */}
        <View style={[s.stitle, { marginTop: 8 }]}>
          <Text style={s.stitleTxt}>Thêm bằng lời</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <MiniIcon name="mic" size={13} color={colors.muted} />
            <Text style={s.stitleSub}>nói hoặc gõ</Text>
          </View>
        </View>
        <Pressable style={s.nlp} onPress={() => navigation?.navigate?.('AddTask')}>
          <View style={s.nlpIc}><MiniIcon name="mic" size={22} color={colors.muted} /></View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={s.nlpTitle}>"mai 7h cà phê với crush..."</Text>
            <Text style={s.nlpSub}>Purrbo tự hiểu & hỏi thêm nếu thiếu giờ</Text>
          </View>
          <Icon name="plus" size={20} color={colors.purpleDark} />
        </Pressable>
      </ScrollView>

      {/* FAB */}
      <Pressable style={s.fab} onPress={() => navigation?.navigate?.('AddTask')}>
        <Icon name="plus" size={26} color="#fff" />
      </Pressable>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  hi: { fontFamily: fonts.display, fontSize: 22, color: colors.ink },
  sub: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
  synced: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#EAF7F1', borderColor: '#CFEDE0', borderWidth: 2,
    borderRadius: radii.pill, paddingVertical: 7, paddingHorizontal: 10, ...hardShadow(3, 0.12),
  },
  syncedOff: { backgroundColor: '#F0EAF6', borderColor: colors.line },
  syncedTxt: { fontFamily: fonts.heading, fontSize: 11, color: colors.mintDark, lineHeight: 13 },
  syncedOffTxt: { color: colors.muted },

  viewSeg: {
    flexDirection: 'row', gap: 6, backgroundColor: '#F0EAF6', borderRadius: radii.pill,
    padding: 4, borderWidth: 2, borderColor: colors.line, marginBottom: 14,
  },
  viewItem: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: radii.pill },
  viewItemOn: { backgroundColor: colors.ink, ...hardShadow(3, 0.14) },
  viewTxt: { fontFamily: fonts.heading, fontSize: 13, color: colors.muted },
  viewTxtOn: { color: '#fff' },

  month: {
    backgroundColor: '#fff', borderWidth: 2, borderColor: colors.line, borderRadius: 22,
    padding: 12, marginBottom: 20, ...hardShadow(5, 0.14),
  },
  mDowRow: { flexDirection: 'row', marginBottom: 6 },
  mDow: { flex: 1, textAlign: 'center', fontFamily: fonts.heading, fontSize: 11, color: colors.muted },
  mGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  mCellWrap: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 3 },
  mCell: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  mCellToday: { backgroundColor: colors.pink, borderBottomWidth: 2, borderBottomColor: colors.pinkDark },
  mCellSel: { borderWidth: 2, borderColor: colors.purple },
  mNum: { fontFamily: fonts.heading, fontSize: 14, color: colors.ink },
  mDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.yellow, marginTop: 2 },

  week: { flexDirection: 'row', gap: 7, marginBottom: 20 },
  day: {
    flex: 1, backgroundColor: '#fff', borderWidth: 2, borderColor: colors.line, borderRadius: 18,
    paddingVertical: 9, alignItems: 'center', ...hardShadow(3, 0.12),
  },
  dayToday: { backgroundColor: colors.pink, borderColor: colors.pink, borderBottomWidth: 2, borderBottomColor: colors.pinkDark },
  daySel: { borderColor: colors.purple, borderBottomWidth: 4, borderBottomColor: colors.purpleDark },
  dow: { fontFamily: fonts.heading, fontSize: 11, color: colors.muted },
  num: { fontFamily: fonts.display, fontSize: 17, color: colors.ink, marginTop: 2 },
  dayTodayTxt: { color: '#fff' },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.yellow, marginTop: 4 },

  note: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 11,
    backgroundColor: '#F6ECFB', borderWidth: 2, borderColor: '#fff', borderRadius: 24,
    padding: 14, marginBottom: 18, ...hardShadow(5, 0.14),
  },
  bubble: {
    flex: 1, backgroundColor: '#fff', borderWidth: 2, borderColor: '#fff',
    borderRadius: 16, borderBottomLeftRadius: 5, padding: 11, ...hardShadow(3, 0.12),
  },
  who: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 5 },
  whoTxt: { fontFamily: fonts.display, fontSize: 12, color: colors.purpleDark },
  bubbleTxt: { fontFamily: fonts.body, fontSize: 13.5, color: colors.ink, lineHeight: 20 },

  stitle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 4, marginBottom: 12 },
  stitleTxt: { fontFamily: fonts.display, fontSize: 17, color: colors.ink },
  stitleSub: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.muted },

  row: { flexDirection: 'row', gap: 11, marginBottom: 13 },
  time: { width: 44, alignItems: 'flex-end', paddingTop: 14 },
  timeBig: { fontFamily: fonts.display, fontSize: 13, color: colors.ink, lineHeight: 15 },
  timeSmall: { fontFamily: fonts.bodyBold, fontSize: 10, color: colors.muted },
  item: {
    flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 11,
    backgroundColor: '#fff', borderWidth: 2, borderColor: colors.line, borderRadius: 20,
    padding: 11, ...hardShadow(5, 0.14),
  },
  itemIc: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', ...hardShadow(3, 0.12) },
  itemName: { fontFamily: fonts.heading, fontSize: 15, color: colors.ink },
  gtag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#E6F7FF', borderColor: '#C5ECFF', borderWidth: 1.5,
    borderRadius: radii.pill, paddingVertical: 2, paddingHorizontal: 7,
  },
  gtagTxt: { fontFamily: fonts.heading, fontSize: 9.5, color: colors.skyDark },
  nudge: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  nudgeTxt: { flex: 1, fontFamily: fonts.body, fontSize: 11.5, color: colors.muted, lineHeight: 16 },
  khoeBtn: { paddingVertical: 8, paddingHorizontal: 12 },

  nlp: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 2, borderColor: '#D9CFE6', borderStyle: 'dashed',
    backgroundColor: '#FFFDFB', borderRadius: 22, padding: 13, marginTop: 6,
  },
  nlpIc: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1ECF6' },
  nlpTitle: { fontFamily: fonts.heading, fontSize: 15, color: colors.muted },
  nlpSub: { fontFamily: fonts.body, fontSize: 11.5, color: colors.muted, marginTop: 1 },

  fab: {
    position: 'absolute', right: 20, bottom: 26, width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.purple, alignItems: 'center', justifyContent: 'center',
    borderWidth: 4, borderColor: '#fff', ...hardShadow(5, 0.18),
  },
});
