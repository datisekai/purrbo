import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { colors, fonts, radii, hardShadow } from '../theme';
import { Icon } from '../components/Icon';
import { PersonaFace } from '../components/PersonaFace';
import { Button, Card, ProgressBar, RarityBadge } from '../components/ui';
import { Api } from '../api';
import { useAuth } from '../auth';

// Icon phụ (không có trong Icon.js dùng chung) — Svg inline riêng cho màn này.
function LocalIcon({ name, size = 20, color = colors.ink, stroke = 2.4 }) {
  const box = { width: size, height: size, viewBox: '0 0 24 24' };
  const p = { fill: 'none', stroke: color, strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'pencil': return <Svg {...box}><Path {...p} d="M12 20h9" /><Path {...p} d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" /></Svg>;
    case 'lock': return <Svg {...box}><Rect {...p} x="4.5" y="10.5" width="15" height="10" rx="3" /><Path {...p} d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /></Svg>;
    case 'chevron': return <Svg {...box}><Path {...p} d="M9 6l6 6-6 6" /></Svg>;
    case 'bell': return <Svg {...box}><Path {...p} d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6z" /><Path {...p} d="M10 20a2 2 0 0 0 4 0" /></Svg>;
    case 'sync': return <Svg {...box}><Path {...p} d="M20 8a8 8 0 0 0-14-3L4 7" /><Path {...p} d="M4 4v3h3" /><Path {...p} d="M4 16a8 8 0 0 0 14 3l2-2" /><Path {...p} d="M20 20v-3h-3" /></Svg>;
    case 'mic': return <Svg {...box}><Rect {...p} x="9" y="3" width="6" height="11" rx="3" /><Path {...p} d="M6 11a6 6 0 0 0 12 0M12 17v4" /></Svg>;
    case 'globe': return <Svg {...box}><Circle {...p} cx="12" cy="12" r="9" /><Path {...p} d="M3 12h18M12 3c2.5 3 2.5 15 0 18M12 3c-2.5 3-2.5 15 0 18" /></Svg>;
    case 'shield': return <Svg {...box}><Path {...p} d="M12 3l7 3v5c0 5-3.5 8-7 10-3.5-2-7-5-7-10V6z" /></Svg>;
    case 'message': return <Svg {...box}><Path {...p} d="M21 12a8 8 0 0 1-11.5 7.2L4 21l1.8-5.5A8 8 0 1 1 21 12z" /></Svg>;
    default: return null;
  }
}

// Kiểu dữ liệu từ backend.
type Profile = {
  name: string; email: string; streak: number; total_done: number;
  owned_count: number; persona_key: string; affinity_level: number;
};
type CollItem = {
  key?: string; name?: string; variant?: string; rarity?: string;
  owned?: boolean; active?: boolean; placeholder?: boolean; hint?: string;
};

// Fallback đúng design gốc khi backend chết (giữ nguyên UI).
const FALLBACK_COLLECTION: CollItem[] = [
  { key: 'mun', name: 'Mèo Mun', variant: 'mun', rarity: 'SSR', owned: true, active: true },
  { key: 'gau', name: 'Gấu Bông', variant: 'gau', rarity: 'Hiếm', owned: true, active: false },
  { placeholder: true, hint: 'Hiếm' },
  { placeholder: true, hint: 'Thường' },
  { placeholder: true, hint: 'SSR' },
  { placeholder: true, hint: 'Thường' },
];

const SETTINGS = [
  { ic: 'bell', bg: '#FFF0E6', col: colors.coralDark, title: 'Thông báo', sub: 'nhắc việc & tin nhắn bạn đồng hành' },
  { ic: 'sync', bg: '#E6F7FF', col: colors.skyDark, title: 'Đồng bộ lịch', sub: 'Google Calendar' },
  { ic: 'mic', bg: '#EEE7FF', col: colors.purpleDark, title: 'Giọng & độ thân mật', sub: 'tone của persona · cà khịa yêu' },
  { ic: 'globe', bg: '#EAF7F1', col: colors.mintDark, title: 'Ngôn ngữ', sub: 'Tiếng Việt' },
  { ic: 'shield', bg: '#FFEAF2', col: colors.pinkDark, title: 'Tài khoản', sub: 'datly · bảo mật & dữ liệu' },
];

export default function ProfileScreen({ navigation }: any) {
  const { user, logout } = useAuth();
  const onLogout = () =>
    Alert.alert('Đăng xuất?', 'Cưng sẽ về màn nhập tên. Dữ liệu vẫn còn khi đăng nhập lại.', [
      { text: 'Ở lại', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: () => logout() },
    ]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [collection, setCollection] = useState<CollItem[] | null>(null);
  const [stats, setStats] = useState<any>(null);   // /stats: active_days…
  const [stateData, setStateData] = useState<any>(null); // /state: affinity_points…
  const [refreshing, setRefreshing] = useState(false);

  const refreshCollection = useCallback(async () => {
    try {
      const col = await Api.collection();
      if (Array.isArray(col)) setCollection(col);
    } catch {
      // backend chết → giữ nguyên UI (fallback)
    }
  }, []);

  const load = useCallback(async () => {
    // Nạp song song, chỗ nào lỗi thì bỏ qua (giữ UI cũ).
    const [p, stt, sd] = await Promise.allSettled([Api.profile(), Api.stats(), Api.state()]);
    if (p.status === 'fulfilled') setProfile(p.value);
    if (stt.status === 'fulfilled') setStats(stt.value);
    if (sd.status === 'fulfilled') setStateData(sd.value);
    await refreshCollection();
  }, [refreshCollection]);

  // Refetch MỖI lần vào màn (sau khoe/mua/mở túi → luôn số mới nhất).
  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = useCallback(async () => { setRefreshing(true); await load(); setRefreshing(false); }, [load]);

  // Tap persona đã sở hữu → đổi bạn đồng hành hiện tại rồi refresh.
  const onPickPersona = async (key?: string) => {
    if (!key) return;
    try {
      await Api.setPersona(key);
      await refreshCollection();
    } catch {
      // không đổi được → im lặng, giữ UI
    }
  };

  // ----- Header -----
  const name = profile?.name ?? 'Finn';
  const handleName = (user?.email ?? profile?.email ?? name)
    .split('@')[0]
    .toLowerCase()
    .replace(/\s+/g, '') || 'finn';

  // ----- Stats (SỐ THẬT — không fallback số giả) -----
  const statCards = [
    { ic: 'flamefill', bg: '#FFF0E6', col: colors.coralDark, n: String(profile?.streak ?? 0), l: 'Streak' },
    { ic: 'calendar', bg: '#E6F7FF', col: colors.skyDark, n: String(stats?.active_days ?? 0), l: 'Ngày chăm' },
    { ic: 'check', bg: '#EAF7F1', col: colors.mintDark, n: String(profile?.total_done ?? 0), l: 'Việc xong' },
    { ic: 'star', bg: '#FFEAF2', col: colors.pinkDark, n: String(profile?.owned_count ?? 0), l: 'Bạn đồng hành' },
  ];

  // ----- Collection -----
  const hasData = !!collection && collection.length > 0;
  const source: CollItem[] = hasData ? collection! : FALLBACK_COLLECTION;
  // Đệm cho đủ tối thiểu 6 ô để giữ lưới đầy như design.
  const slots: CollItem[] = [...source];
  while (slots.length < 6) slots.push({ placeholder: true, hint: '???' });

  const ownedCount = source.filter((c) => c.owned).length;
  const total = hasData ? collection!.length : 6;

  // ----- Bạn đồng hành hiện tại -----
  const active = source.find((c) => c.active) ?? { name: 'Mèo Mun', variant: 'mun', rarity: 'SSR' };
  const lvl = profile?.affinity_level ?? stateData?.affinity_level ?? 1;
  const aff = stateData?.affinity_points ?? 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ padding: 18, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.pink} colors={[colors.pink]} />}
      >
        {/* Header */}
        <View style={s.phead}>
          <View style={s.avatar}>
            <Svg viewBox="0 0 64 64" width={48} height={48}>
              <Circle cx="32" cy="24" r="12" fill={colors.purple} stroke="#2E2A3F" strokeWidth="3" />
              <Path d="M12 56c0-11 9-17 20-17s20 6 20 17z" fill={colors.pink} stroke="#2E2A3F" strokeWidth="3" />
            </Svg>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={s.name}>{name}</Text>
            <Text style={s.handle}>@{handleName} · Thành viên từ T7/2026</Text>
          </View>
          <Pressable style={s.iconbtn} onPress={() => navigation.navigate('EditProfile')}>
            <LocalIcon name="pencil" size={19} color={colors.purpleDark} />
          </Pressable>
        </View>

        {/* Stats — chạm để xem biểu đồ */}
        <Pressable onPress={() => navigation.navigate('Stats')}>
          <View style={s.sgrid}>
            {statCards.map((st, i) => (
              <View key={i} style={s.stile}>
                <View style={[s.si, { backgroundColor: st.bg }]}>
                  <Icon name={st.ic} size={18} color={st.col} />
                </View>
                <Text style={s.stileNum}>{st.n}</Text>
                <Text style={s.stileLbl}>{st.l}</Text>
              </View>
            ))}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 8 }}>
            <Text style={{ fontFamily: fonts.heading, fontSize: 12, color: colors.purpleDark }}>Xem thống kê chi tiết</Text>
            <Icon name="star" size={12} color={colors.purpleDark} />
          </View>
        </Pressable>

        {/* Bạn đồng hành hiện tại */}
        <View style={s.stitle}>
          <Text style={s.stitleTxt}>Bạn đồng hành hiện tại</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Icon name="heartfill" size={12} color={colors.muted} />
            <Text style={s.stitleSub}>gắn bó</Text>
          </View>
        </View>
        <View style={s.hero}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <PersonaFace variant={active.variant} ring={active.rarity === 'SSR' ? 'ssr' : undefined} size={58} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontFamily: fonts.display, fontSize: 18, color: colors.ink }}>{active.name}</Text>
                <View style={s.ssr}>
                  <Icon name="star" size={9} color="#fff" />
                  <Text style={{ fontFamily: fonts.heading, fontSize: 10, color: '#fff' }}>{active.rarity}</Text>
                </View>
              </View>
              <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.muted }}>bạn đồng hành · thân thiết Lv.{lvl}</Text>
            </View>
          </View>

          <View style={{ marginTop: 13 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <Icon name="heart" size={13} color={colors.ink} />
                <Text style={{ fontFamily: fonts.heading, fontSize: 12, color: colors.ink }}>Độ thân thiết</Text>
              </View>
              <Text style={{ fontFamily: fonts.heading, fontSize: 12, color: colors.ink }}>{aff}/500 → Lv.{lvl + 1}</Text>
            </View>
            <ProgressBar pct={(aff / 500) * 100} />
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 13 }}>
            <Button
              label="Nhắn tin"
              tone="pink"
              onPress={() => navigation.navigate('Chat')}
              icon={<LocalIcon name="message" size={15} color="#fff" />}
              style={{ paddingVertical: 9, paddingHorizontal: 16 }}
            />
          </View>
        </View>

        {/* Bộ sưu tập */}
        <View style={s.stitle}>
          <Text style={s.stitleTxt}>Bộ sưu tập</Text>
          <Pressable onPress={() => navigation.navigate('Collection')} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={[s.stitleSub, { color: colors.purpleDark }]}>Thư viện {ownedCount}/{total}</Text>
            <Icon name="star" size={12} color={colors.purpleDark} />
          </Pressable>
        </View>
        <View style={s.cgrid}>
          {slots.map((slot, i) =>
            slot.owned ? (
              <Pressable key={slot.key ?? i} onPress={() => onPickPersona(slot.key)} style={[s.slot, slot.active && s.slotActive]}>
                {slot.active && (
                  <View style={s.activetag}>
                    <Icon name="heartfill" size={11} color="#fff" />
                  </View>
                )}
                <View style={s.badge}>
                  <RarityBadge rar={slot.rarity} />
                </View>
                <PersonaFace variant={slot.variant} size={54} ring={slot.rarity === 'SSR' ? 'ssr' : undefined} />
                <Text style={s.sname}>{slot.name}</Text>
              </Pressable>
            ) : (
              <View key={slot.key ?? i} style={[s.slot, s.slotLocked]}>
                <View style={s.lockbox}>
                  <LocalIcon name="lock" size={22} color={colors.muted} />
                </View>
                <Text style={[s.sname, { color: colors.muted }]}>? {slot.hint ?? slot.rarity ?? '???'}</Text>
                <View style={s.hintbtn}>
                  <Icon name="gift" size={11} color={colors.purpleDark} />
                  <Text style={s.hintbtnTxt}>Mở túi mù</Text>
                </View>
              </View>
            )
          )}
        </View>

        {/* Cài đặt */}
        <View style={s.stitle}>
          <Text style={s.stitleTxt}>Cài đặt</Text>
          <Text style={s.stitleSub}>tinh chỉnh Purrbo</Text>
        </View>
        <Card style={{ padding: 0, overflow: 'hidden', marginBottom: 20 }}>
          {SETTINGS.map((st, i) => (
            <Pressable
              key={i}
              onPress={() => navigation.navigate('Settings')}
              style={[s.setrow, i < SETTINGS.length - 1 && s.setrowBorder]}
            >
              <View style={[s.setIc, { backgroundColor: st.bg }]}>
                <LocalIcon name={st.ic} size={19} color={st.col} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={s.setTitle}>{st.title}</Text>
                <Text style={s.setSub}>{st.sub}</Text>
              </View>
              <LocalIcon name="chevron" size={18} color={colors.muted} />
            </Pressable>
          ))}
        </Card>

        <Pressable onPress={onLogout} style={{ alignSelf: 'center', padding: 8 }}>
          <Text style={s.logout}>Đăng xuất</Text>
        </Pressable>
        <Text style={s.verline}>Purrbo v0.1 · làm bằng thương</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  // Header
  phead: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18 },
  avatar: {
    width: 70, height: 70, borderRadius: 35, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F6ECFB', borderWidth: 3, borderColor: '#fff', ...hardShadow(5, 0.14),
  },
  name: { fontFamily: fonts.display, fontSize: 23, color: colors.ink },
  handle: { fontFamily: fonts.body, fontSize: 12.5, color: colors.muted, marginTop: 2 },
  iconbtn: {
    width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff', borderWidth: 2, borderColor: colors.line, ...hardShadow(3, 0.12),
  },

  // Stats
  sgrid: { flexDirection: 'row', gap: 8, marginBottom: 22 },
  stile: {
    flex: 1, backgroundColor: '#fff', borderWidth: 2, borderColor: colors.line, borderRadius: 18,
    paddingVertical: 11, paddingHorizontal: 4, alignItems: 'center', ...hardShadow(3, 0.12),
  },
  si: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 5 },
  stileNum: { fontFamily: fonts.display, fontSize: 19, color: colors.ink },
  stileLbl: { fontFamily: fonts.body, fontSize: 9.5, color: colors.muted, marginTop: 3, textAlign: 'center' },

  // Section title
  stitle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, marginHorizontal: 4 },
  stitleTxt: { fontFamily: fonts.display, fontSize: 17, color: colors.ink },
  stitleSub: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.muted },

  // Hero
  hero: {
    backgroundColor: '#F6ECFB', borderRadius: 28, padding: 16, marginBottom: 22,
    borderWidth: 2, borderColor: '#fff', ...hardShadow(5, 0.14),
  },
  ssr: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: colors.pink, borderRadius: radii.pill, paddingVertical: 2, paddingHorizontal: 8 },

  // Collection
  cgrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 11, marginBottom: 22 },
  slot: {
    width: '31%', flexGrow: 1, backgroundColor: '#fff', borderWidth: 2, borderColor: colors.line, borderRadius: 20,
    paddingVertical: 13, paddingHorizontal: 6, alignItems: 'center', ...hardShadow(3, 0.12),
  },
  slotActive: { borderColor: colors.rSSR },
  slotLocked: { backgroundColor: '#FBF7F3', borderStyle: 'dashed' },
  activetag: {
    position: 'absolute', top: 8, left: 8, width: 20, height: 20, borderRadius: 10, zIndex: 2,
    backgroundColor: colors.pink, alignItems: 'center', justifyContent: 'center', ...hardShadow(3, 0.12),
  },
  badge: { position: 'absolute', top: 8, right: 8, zIndex: 2 },
  sname: { fontFamily: fonts.display, fontSize: 12.5, color: colors.ink, marginTop: 8, textAlign: 'center' },
  lockbox: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#F1ECF6', alignItems: 'center', justifyContent: 'center' },
  hintbtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 7 },
  hintbtnTxt: { fontFamily: fonts.heading, fontSize: 10, color: colors.purpleDark },

  // Settings
  setrow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 15 },
  setrowBorder: { borderBottomWidth: 2, borderBottomColor: colors.line },
  setIc: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', ...hardShadow(3, 0.12) },
  setTitle: { fontFamily: fonts.heading, fontSize: 14.5, color: colors.ink },
  setSub: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, marginTop: 1 },

  logout: { fontFamily: fonts.heading, fontSize: 14, color: colors.muted },
  verline: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, textAlign: 'center', marginTop: 6 },
});
