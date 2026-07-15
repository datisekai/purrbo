import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors, fonts, radii, hardShadow } from '../theme';
import { Icon } from '../components/Icon';
import { PersonaFace, PersonaChibi } from '../components/PersonaFace';
import { AnimatedMascot } from '../components/AnimatedMascot';
import { WidgetPreview } from '../components/WidgetPreview';
import { CelebrationModal } from '../components/CelebrationModal';
import { Button, Chip, ProgressBar, SkeletonRow } from '../components/ui';
import { Api } from '../api';
import { useAuth } from '../auth';
import { scheduleHabitReminders } from '../notifications';
import { personaCopy } from '../personaCopy';
import { playSuccess } from '../sound';

const NUDGE = 'Ơ 3 tiếng chưa uống giọt nào? Định làm khô mực cho em buồn hả 🙄💧';

const ICON_STYLE: Record<string, { bg: string; col: string }> = {
  droplet: { bg: '#E6F7FF', col: colors.skyDark },
  dumbbell: { bg: '#FFEAF2', col: colors.pinkDark },
  book: { bg: '#EEE7FF', col: colors.purpleDark },
};
const istyle = (ic: string) => ICON_STYLE[ic] ?? { bg: '#F1ECF6', col: colors.muted };

export default function HomeScreen({ navigation }: any) {
  const { user } = useAuth();
  const [st, setSt] = useState<any>(null);
  const [persona, setPersona] = useState<any>(null);
  const [habits, setHabits] = useState<any[]>([]);
  const [line, setLine] = useState('');
  const [claimable, setClaimable] = useState(0);
  const [equipped, setEquipped] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [celebration, setCelebration] = useState<any>(null);

  // Nạp toàn bộ dữ liệu Home (dùng cho mount + kéo làm mới).
  const loadCore = useCallback(async () => {
    try {
      const [state, hs, cat] = await Promise.all([Api.state(), Api.habits(), Api.personas()]);
      setSt(state);
      setHabits(hs);
      scheduleHabitReminders(hs);   // AD-9: đặt nhắc local theo giờ habit
      const active = Array.isArray(cat) ? cat.find((p: any) => p.key === state.persona_key) : null;
      if (active) setPersona(active);
    } catch {
      /* backend chưa chạy → giữ trạng thái mặc định */
    }
    // KHÔNG dùng home_nudge global (không theo persona) — để personaCopy điều khiển
    // câu thoại idle cho đúng chất persona đang active.
    try { const m = await Api.missions(); setClaimable(m?.claimable_gems || 0); } catch {}
    try { const e = await Api.equippedItems(); setEquipped(e || {}); } catch {}
  }, []);

  useEffect(() => {
    (async () => { await loadCore(); setLoading(false); })();
  }, [loadCore]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadCore();
    setRefreshing(false);
  }, [loadCore]);

  // Refresh mỗi lần vào Home: nhiệm vụ chờ nhận + persona ĐANG DÙNG (đổi ở nơi khác → phản ánh ngay).
  useFocusEffect(
    useCallback(() => {
      Api.missions().then((m) => setClaimable(m?.claimable_gems || 0)).catch(() => {});
      Api.equippedItems().then((e) => setEquipped(e || {})).catch(() => {});
      (async () => {
        try {
          const [state, cat] = await Promise.all([Api.state(), Api.personas()]);
          setSt(state);
          const active = Array.isArray(cat) ? cat.find((p: any) => p.key === state.persona_key) : null;
          if (active) setPersona(active);
        } catch {}
      })();
    }, [])
  );

  const STREAK_MILESTONES = [3, 7, 14, 30, 50, 100];

  const khoe = async (h: any) => {
    if (h.done) return;
    playSuccess();
    const prevLevel = st?.affinity_level ?? 1;
    const prevStreak = st?.streak ?? 0;
    setHabits((hs) => hs.map((x) => (x.id === h.id ? { ...x, done: true } : x)));
    try {
      const r = await Api.khoe(h.id);
      setLine(r.line);
      setSt((s: any) => ({ ...(s || {}), affinity_points: r.affinity_points, affinity_level: r.affinity_level, streak: r.streak }));
      // Ăn mừng: lên cấp thân thiết hoặc chạm mốc streak (chỉ khi tăng thật)
      if (r.affinity_level > prevLevel) {
        setCelebration({ type: 'level', value: r.affinity_level, persona, items: equipped });
      } else if (r.streak > prevStreak && STREAK_MILESTONES.includes(r.streak)) {
        setCelebration({ type: 'streak', value: r.streak, persona, items: equipped });
      }
    } catch {
      /* giữ optimistic */
    }
  };

  const aff = st?.affinity_points ?? 0;
  const lvl = st?.affinity_level ?? 1;
  const streak = st?.streak ?? 0;
  const doneCount = habits.filter((h) => h.done).length;

  // ── Việc SẮP TỚI: undone gần giờ hiện tại nhất (ưu tiên còn phía trước trong ngày) ──
  const parseHM = (t: string) => { const m = String(t || '').match(/(\d{1,2})[:h](\d{0,2})/); return m ? Number(m[1]) * 60 + Number(m[2] || 0) : null; };
  const nowD = new Date();
  const nowMin = nowD.getHours() * 60 + nowD.getMinutes();
  const undone = habits.filter((h) => !h.done);
  const timed = undone.map((h) => ({ h, t: parseHM(h.time) })).filter((x) => x.t != null) as { h: any; t: number }[];
  const future = timed.filter((x) => x.t >= nowMin).sort((a, b) => a.t - b.t);
  const nextUp = future[0] || timed.sort((a, b) => a.t - b.t)[0] || (undone[0] ? { h: undone[0], t: null } : null);
  const nextLabel = (() => {
    if (!nextUp || nextUp.t == null) return 'hôm nay';
    const diff = nextUp.t - nowMin;
    if (diff > 0 && diff <= 90) return `trong ${diff < 60 ? diff + ' phút' : Math.round(diff / 60 * 10) / 10 + ' tiếng'}`;
    if (diff <= 0) return `${nextUp.h.time} · tới giờ rồi`;
    return nextUp.h.time;
  })();
  const dateLabel = `Hôm nay · ${String(nowD.getDate()).padStart(2, '0')}/${String(nowD.getMonth() + 1).padStart(2, '0')}`;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ padding: 18, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.pink} colors={[colors.pink]} />}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <AnimatedMascot size={34} />
          <Text style={{ fontFamily: fonts.display, fontSize: 20, color: colors.ink }}>Purr<Text style={{ color: colors.pink }}>bo</Text></Text>
        </View>
        <View style={s.top}>
          <View style={{ flex: 1 }}>
            <Text style={s.hi}>Chào {user?.name || 'bạn'}</Text>
            <Text style={s.sub}>Hôm nay {doneCount}/{habits.length} việc · cùng em nhé</Text>
          </View>
          <Chip bg="#FFF0E6" fg={colors.coralDark} border="#FFD9C7" style={{ marginRight: 8 }}>
            <Icon name="flamefill" size={14} color={colors.coralDark} />
            <Text style={{ fontFamily: fonts.heading, fontSize: 13, color: colors.coralDark }}>{streak}</Text>
          </Chip>
          <Chip bg="#FFEAF2" fg={colors.pinkDark} border="#FFCCDF">
            <Icon name="heartfill" size={14} color={colors.pinkDark} />
            <Text style={{ fontFamily: fonts.heading, fontSize: 13, color: colors.pinkDark }}>Lv.{lvl}</Text>
          </Chip>
        </View>

        {/* Nhiệm vụ & thưởng — giữ chân, ghé mỗi ngày */}
        <Pressable style={s.quest} onPress={() => navigation?.navigate?.('Rewards')}>
          <View style={s.questIc}><Icon name="gift" size={22} color="#fff" /></View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={s.questTitle}>Nhiệm vụ hôm nay</Text>
            <Text style={s.questSub}>{claimable > 0 ? `Có ${claimable} đá quý đang chờ cưng nhận 💎` : 'Điểm danh & mời bạn nhận đá quý'}</Text>
          </View>
          {claimable > 0 && <View style={s.questDot}><Text style={s.questDotTxt}>{claimable}</Text></View>}
        </Pressable>

        <View style={s.hero}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <PersonaFace variant={persona?.variant || 'mun'} ring={(persona?.rarity || 'SSR') === 'SSR' ? 'ssr' : undefined} size={54} items={equipped} expr="love" />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontFamily: fonts.display, fontSize: 19, color: colors.ink }}>{persona?.name || 'Mèo Mun'}</Text>
                <View style={s.ssr}>
                  <Icon name="star" size={9} color="#fff" />
                  <Text style={{ fontFamily: fonts.heading, fontSize: 10, color: '#fff' }}>{persona?.rarity || 'SSR'}</Text>
                </View>
              </View>
              <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.muted }}>bạn đồng hành · {persona?.tag || 'cà khịa yêu'} · thân thiết Lv.{lvl}</Text>
            </View>
          </View>

          <View style={s.bubble}><Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.ink, lineHeight: 21 }}>{line || personaCopy(persona?.variant).home}</Text></View>

          <View style={{ marginTop: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <Icon name="heart" size={13} color={colors.ink} />
                <Text style={{ fontFamily: fonts.heading, fontSize: 12, color: colors.ink }}>Độ thân thiết</Text>
              </View>
              <Text style={{ fontFamily: fonts.heading, fontSize: 12, color: colors.ink }}>{aff}/500 → Lv.{lvl + 1}</Text>
            </View>
            <ProgressBar pct={(aff / 500) * 100} />
          </View>
        </View>

        {/* SẮP TỚI — spotlight: người đồng hành đang đợi cưng làm việc kế tiếp */}
        {!loading && nextUp && (
          <View style={s.next}>
            <View style={s.nextTag}>
              <Icon name="clock" size={12} color="#fff" />
              <Text style={s.nextTagTxt}>SẮP TỚI · {nextLabel}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <PersonaChibi variant={persona?.variant || 'mun'} size={92} items={equipped} expr="happy" />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={s.nextName} numberOfLines={1}>{nextUp.h.name}</Text>
                <Text style={s.nextNudge} numberOfLines={2}>{nextUp.h.hint || `${persona?.name || 'Em'} đang canh cưng đó 👀💗`}</Text>
              </View>
            </View>
            <Button
              label="Khoe ngay 💗"
              tone="mint"
              onPress={() => khoe(nextUp.h)}
              icon={<Icon name="heart" size={16} color="#fff" />}
              style={{ marginTop: 12, paddingVertical: 13 }}
            />
          </View>
        )}

        <View style={s.stitle}>
          <Text style={s.stitleTxt}>Cả ngày</Text>
          <Pressable onPress={() => navigation?.navigate?.('AddTask')} style={s.addBtn}>
            <Icon name="plus" size={14} color="#fff" />
            <Text style={s.addBtnTxt}>Thêm việc</Text>
          </Pressable>
        </View>

        {loading && habits.length === 0 && [0, 1, 2].map((i) => <SkeletonRow key={'sk' + i} />)}

        {!loading && habits.length === 0 && (
          <View style={s.empty}>
            <AnimatedMascot size={72} />
            <Text style={s.emptyTitle}>Chưa có việc nào hôm nay</Text>
            <Text style={s.emptySub}>Thêm việc đầu tiên để bạn đồng hành bắt đầu nhắc cưng nha 🐾</Text>
            <Button label="Thêm việc đầu tiên" tone="pink" onPress={() => navigation?.navigate?.('AddTask')} icon={<Icon name="plus" size={16} color="#fff" />} style={{ marginTop: 14, paddingHorizontal: 20 }} />
          </View>
        )}

        {habits.filter((h) => !(nextUp && h.id === nextUp.h.id)).map((h) => {
          const ic = istyle(h.icon);
          return (
            <View key={h.id} style={[s.habit, h.done && { opacity: 0.55 }]}>
              <Pressable onPress={() => navigation?.navigate?.('HabitEdit', { habit: h })} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                <View style={[s.habitIc, { backgroundColor: ic.bg }]}><Icon name={h.icon} size={24} color={ic.col} /></View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[{ fontFamily: fonts.heading, fontSize: 16, color: colors.ink }, h.done && { textDecorationLine: 'line-through' }]}>{h.name}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <Icon name={h.done ? 'check' : 'clock'} size={13} color={colors.muted} />
                    <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.muted }}>{h.time} · {h.hint}</Text>
                  </View>
                </View>
              </Pressable>
              {h.done ? (
                <Button label="Đã khoe" tone="mint" onPress={() => {}} icon={<Icon name="check" size={15} color={colors.mintDark} />} style={{ paddingVertical: 9, paddingHorizontal: 14 }} />
              ) : (
                <Button label="Khoe" tone="mint" onPress={() => khoe(h)} icon={<Icon name="heart" size={15} color="#fff" />} style={{ paddingVertical: 9, paddingHorizontal: 14 }} />
              )}
            </View>
          );
        })}

        {/* Widget màn hình chính — xem trước */}
        <View style={{ marginTop: 10 }}>
          <WidgetPreview habits={habits} dateLabel={dateLabel} />
        </View>
      </ScrollView>

      <CelebrationModal data={celebration} onClose={() => setCelebration(null)} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  quest: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20,
    backgroundColor: colors.purple, borderRadius: 20, padding: 13,
    borderWidth: 2, borderColor: '#fff', ...hardShadow(5, 0.16),
  },
  questIc: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#ffffff30', alignItems: 'center', justifyContent: 'center' },
  questTitle: { fontFamily: fonts.display, fontSize: 16, color: '#fff' },
  questSub: { fontFamily: fonts.body, fontSize: 12, color: '#fff', opacity: 0.92, marginTop: 1 },
  questDot: { minWidth: 26, height: 26, borderRadius: 13, backgroundColor: colors.yellow, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  questDotTxt: { fontFamily: fonts.display, fontSize: 13, color: colors.ink },
  hi: { fontFamily: fonts.display, fontSize: 22, color: colors.ink },
  sub: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
  hero: {
    backgroundColor: '#F6ECFB', borderRadius: 28, padding: 18, marginBottom: 20,
    borderWidth: 2, borderColor: '#fff', ...hardShadow(5, 0.14),
  },
  ssr: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: colors.pink, borderRadius: radii.pill, paddingVertical: 2, paddingHorizontal: 8 },
  bubble: { backgroundColor: '#fff', borderRadius: 18, borderBottomLeftRadius: 5, padding: 12, ...hardShadow(3, 0.12) },
  next: {
    backgroundColor: colors.pink, borderRadius: 26, padding: 16, marginBottom: 20,
    borderWidth: 3, borderColor: '#fff', ...hardShadow(7, 0.2),
  },
  nextTag: {
    flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start',
    backgroundColor: '#ffffff33', borderRadius: radii.pill, paddingVertical: 4, paddingHorizontal: 11, marginBottom: 12,
  },
  nextTagTxt: { fontFamily: fonts.heading, fontSize: 11, color: '#fff', letterSpacing: 0.5 },
  nextName: { fontFamily: fonts.display, fontSize: 21, color: '#fff' },
  nextNudge: { fontFamily: fonts.body, fontSize: 13, color: '#fff', opacity: 0.92, marginTop: 3, lineHeight: 19 },
  stitle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, marginHorizontal: 4 },
  stitleTxt: { fontFamily: fonts.display, fontSize: 17, color: colors.ink },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.pink,
    borderRadius: radii.pill, paddingVertical: 6, paddingHorizontal: 12,
    borderBottomWidth: 3, borderBottomColor: colors.pinkDark,
  },
  addBtnTxt: { fontFamily: fonts.heading, fontSize: 12, color: '#fff' },
  empty: {
    alignItems: 'center', backgroundColor: '#F6ECFB', borderRadius: 24, padding: 24,
    borderWidth: 2, borderColor: '#fff', ...hardShadow(5, 0.14),
  },
  emptyTitle: { fontFamily: fonts.display, fontSize: 17, color: colors.ink, marginTop: 10 },
  emptySub: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, textAlign: 'center', marginTop: 4, lineHeight: 19 },
  habit: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff',
    borderWidth: 2, borderColor: colors.line, borderRadius: 22, padding: 13, marginBottom: 12, ...hardShadow(5, 0.14),
  },
  habitIc: { width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center', ...hardShadow(3, 0.12) },
});
