import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, Animated, Easing, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors, fonts, radii, hardShadow, type AppColors } from '../theme';
import { useC, usePal } from '../themeContext';
import { Icon } from '../components/Icon';
import { PersonaChibi } from '../components/PersonaFace';
import { AnimatedMascot } from '../components/AnimatedMascot';
import { CelebrationModal } from '../components/CelebrationModal';
import { Button, Chip, SkeletonRow } from '../components/ui';
import { Api } from '../api';
import { useAuth } from '../auth';
import { scheduleHabitReminders } from '../notifications';
import { personaHomeLine } from '../personaCopy';
import { pushWidget } from '../widget';
import { type PersonaPalette } from '../personaTheme';
import { playSuccess } from '../sound';

// Icon việc dùng CHUNG tông persona (hình icon đã đủ phân biệt) — bỏ cầu vồng
// mỗi icon một màu, để 1 màn chỉ còn tông của persona đang active.
const istyle = (pal: PersonaPalette) => ({ bg: pal.soft, col: pal.primaryDark });

// Dòng việc — component riêng để giữ animation "pop" khi tick Khoe không bị mất
// lúc list re-render (mỗi row tự quản lý Animated.Value của mình).
function HabitRow({ h, s, pal, onKhoe, navigation }: any) {
  const pop = useRef(new Animated.Value(1)).current;
  const wasDone = useRef(h.done);
  useEffect(() => {
    if (!wasDone.current && h.done) {
      pop.setValue(1.22);
      Animated.spring(pop, { toValue: 1, useNativeDriver: true, friction: 4, tension: 140 }).start();
    }
    wasDone.current = h.done;
  }, [h.done, pop]);
  const ic = istyle(pal);
  return (
    <View style={[s.habit, h.done && { opacity: 0.55 }]}>
      <Pressable onPress={() => navigation?.navigate?.('HabitEdit', { habit: h })} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
        <Animated.View style={[s.habitIc, { backgroundColor: ic.bg, transform: [{ scale: pop }] }]}>
          <Icon name={h.done ? 'check' : h.icon} size={24} color={ic.col} />
        </Animated.View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[{ fontFamily: fonts.heading, fontSize: 16, color: colors.ink }, h.done && { textDecorationLine: 'line-through' }]}>{h.name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Icon name={h.done ? 'check' : 'clock'} size={13} color={colors.muted} />
            <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.muted }}>{h.time} · {h.hint}</Text>
          </View>
        </View>
      </Pressable>
      {h.done ? (
        <Button label="Đã khoe" color={colors.muted} colorDark="#6E6875" onPress={() => {}} icon={<Icon name="check" size={15} color="#fff" />} style={{ paddingVertical: 9, paddingHorizontal: 14 }} />
      ) : (
        <Button label="Khoe" color={pal.primary} colorDark={pal.primaryDark} onPress={() => onKhoe(h)} icon={<Icon name="heart" size={15} color="#fff" />} style={{ paddingVertical: 9, paddingHorizontal: 14 }} />
      )}
    </View>
  );
}

export default function HomeScreen({ navigation }: any) {
  const { user } = useAuth();
  // Tông màu của persona đang active — dùng cho MỌI nhấn trên màn (bỏ cầu vồng).
  const c = useC();
  const pal = usePal();
  const s = useMemo(() => mkStyles(c, pal), [c, pal]);
  const [st, setSt] = useState<any>(null);
  const [persona, setPersona] = useState<any>(null);
  const [habits, setHabits] = useState<any[]>([]);
  const [line, setLine] = useState('');
  const [claimable, setClaimable] = useState(0);
  const [equipped, setEquipped] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [celebration, setCelebration] = useState<any>(null);
  // Nhân vật sống (nhún nhẹ) + thưởng cảm xúc khi Khoe (KHÔNG chỉ số thân thiết)
  const heroBob = useRef(new Animated.Value(0)).current;
  const floatY = useRef(new Animated.Value(0)).current;
  const [floatTxt, setFloatTxt] = useState('');
  const [heroExpr, setHeroExpr] = useState<'love' | 'happy'>('happy');

  // Nạp toàn bộ dữ liệu Home (dùng cho mount + kéo làm mới).
  const loadCore = useCallback(async () => {
    try {
      const [state, hs, cat] = await Promise.all([Api.state(), Api.habits(), Api.personas()]);
      setSt(state);
      setHabits(hs);
      const active = Array.isArray(cat) ? cat.find((p: any) => p.key === state.persona_key) : null;
      if (active) setPersona(active);
      scheduleHabitReminders(hs, active?.variant);   // AD-9: nhắc local theo giọng persona
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

  // Refresh mỗi lần vào Home: load FULL (gồm habits) để thêm/sửa/xoá việc ở màn
  // khác quay về là thấy ngay — không chỉ state/persona/nhiệm vụ.
  useFocusEffect(
    useCallback(() => {
      loadCore();
    }, [loadCore])
  );

  // Nhân vật "sống": nhún nhẹ liên tục.
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(heroBob, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(heroBob, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [heroBob]);

  // Thưởng LEAN: "+N 💗" bay lên + mèo nhảy đổi biểu cảm love.
  const rewardBurst = (gain: number) => {
    if (gain > 0) {
      setFloatTxt(`+${gain} 💗`);
      floatY.setValue(0);
      Animated.timing(floatY, { toValue: 1, duration: 1300, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
    }
    setHeroExpr('love');
    setTimeout(() => setHeroExpr('happy'), 1500);
  };

  const STREAK_MILESTONES = [3, 7, 14, 30, 50, 100];

  const khoe = async (h: any) => {
    if (h.done) return;
    playSuccess();
    const prevLevel = st?.affinity_level ?? 1;
    const prevStreak = st?.streak ?? 0;
    const prevAff = st?.affinity_points ?? 0;
    setHabits((hs) => hs.map((x) => (x.id === h.id ? { ...x, done: true } : x)));
    try {
      const r = await Api.khoe(h.id);
      setLine(r.line);
      setSt((s: any) => ({ ...(s || {}), affinity_points: r.affinity_points, affinity_level: r.affinity_level, streak: r.streak }));
      rewardBurst((r.affinity_points ?? prevAff) - prevAff);
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

  const streak = st?.streak ?? 0;

  // ── Việc SẮP TỚI: undone gần giờ hiện tại nhất (ưu tiên còn phía trước trong ngày) ──
  const parseHM = (t: string) => { const m = String(t || '').match(/(\d{1,2})[:h](\d{0,2})/); return m ? Number(m[1]) * 60 + Number(m[2] || 0) : null; };
  const nowD = new Date();
  const nowMin = nowD.getHours() * 60 + nowD.getMinutes();
  // Chỉ việc áp dụng HÔM NAY: once=đúng ngày, weekly=đúng thứ, daily/hours=luôn.
  const todayYmd = `${nowD.getFullYear()}-${String(nowD.getMonth() + 1).padStart(2, '0')}-${String(nowD.getDate()).padStart(2, '0')}`;
  const showsToday = (h: any) => {
    const rep = String(h.repeat || 'daily');
    if (rep.startsWith('once:')) return rep.slice(5) === todayYmd;
    if (rep.startsWith('weekly:')) return rep.split(':')[1].split(',').map(Number).includes((nowD.getDay() + 6) % 7);
    return true;
  };
  const todayHabits = habits.filter(showsToday);
  const doneCount = todayHabits.filter((h) => h.done).length;
  const undone = todayHabits.filter((h) => !h.done);
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

  // Câu nói persona ở bong bóng Home (data-driven) — tự chuyển sang câu "xong hết"
  // khi nextUp rỗng (personaHomeLine đã xử lý case 'all'/'empty').
  const widgetLine = line || personaHomeLine(persona?.variant, { done: doneCount, total: todayHabits.length, next: nextUp?.h?.name });

  // Đẩy dữ liệu sang Widget iOS mỗi khi tiến độ / persona / việc kế tiếp đổi.
  useEffect(() => {
    pushWidget({
      personaVariant: persona?.variant || 'mun',
      nextId: nextUp?.h?.id || 0,
      nextName: nextUp?.h?.name || '',
      nextTime: nextUp?.h?.time || '',
      done: doneCount,
      total: todayHabits.length,
      streak,
    });
  }, [persona?.variant, nextUp?.h?.id, nextUp?.h?.name, nextUp?.h?.time, doneCount, todayHabits.length, streak]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ padding: 18, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={pal.primary} colors={[pal.primary]} />}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <AnimatedMascot size={34} />
          <Text style={{ fontFamily: fonts.display, fontSize: 20, color: colors.ink }}>Purr<Text style={{ color: c.pink }}>bo</Text></Text>
        </View>
        <View style={s.top}>
          <View style={{ flex: 1 }}>
            <Text style={s.hi}>Chào {user?.name || 'bạn'}</Text>
            <Text style={s.sub}>Hôm nay {doneCount}/{todayHabits.length} việc · cùng em nhé</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {claimable > 0 && (
              <Pressable onPress={() => navigation?.navigate?.('Nhiệm vụ')}>
                <Chip>
                  <Icon name="gift" size={14} color={pal.primaryDark} />
                  <Text style={{ fontFamily: fonts.heading, fontSize: 13, color: pal.primaryDark }}>{claimable}</Text>
                </Chip>
              </Pressable>
            )}
            <Pressable onPress={() => navigation?.navigate?.('Leaderboard')}>
              <Chip>
                <Icon name="flamefill" size={14} color={pal.primaryDark} />
                <Text style={{ fontFamily: fonts.heading, fontSize: 13, color: pal.primaryDark }}>{streak}</Text>
              </Chip>
            </Pressable>
          </View>
        </View>

        {/* SPOTLIGHT — 1 khối duy nhất: persona + việc kế tiếp (thay 2 card lặp) */}
        <View style={[s.hero, { backgroundColor: pal.surface }]}>
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 2 }}>
            <Animated.View style={{ transform: [{ translateY: heroBob.interpolate({ inputRange: [0, 1], outputRange: [3, -7] }) }] }}>
              <PersonaChibi variant={persona?.variant || 'mun'} size={116} items={equipped} expr={heroExpr} />
            </Animated.View>
            <Animated.View
              pointerEvents="none"
              style={{ position: 'absolute', top: 18, opacity: floatY.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 1, 0] }), transform: [{ translateY: floatY.interpolate({ inputRange: [0, 1], outputRange: [0, -50] }) }] }}
            >
              <Text style={s.float}>{floatTxt}</Text>
            </Animated.View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <Text style={s.pName}>{persona?.name || 'Mèo Mun'}</Text>
            <View style={s.ssr}><Icon name="star" size={9} color="#fff" /><Text style={{ fontFamily: fonts.heading, fontSize: 10, color: '#fff' }}>{persona?.rarity || 'SSR'}</Text></View>
          </View>

          <View style={[s.bubble, { marginTop: 10, alignSelf: 'stretch' }]}><Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.ink, lineHeight: 21 }}>{widgetLine}</Text></View>

          {!loading && nextUp && (
            <View style={s.nextBlock}>
              <View style={s.nextTag}>
                <Icon name="clock" size={12} color={pal.primaryDark} />
                <Text style={[s.nextTagTxt, { color: pal.primaryDark }]}>SẮP TỚI · {nextLabel}</Text>
              </View>
              <Text style={s.nextName} numberOfLines={1}>{nextUp.h.name}</Text>
              <Button
                label="Khoe ngay 💗"
                color={pal.primary}
                colorDark={pal.primaryDark}
                onPress={() => khoe(nextUp.h)}
                icon={<Icon name="heart" size={16} color="#fff" />}
                style={{ marginTop: 10, alignSelf: 'stretch', paddingVertical: 13 }}
              />
            </View>
          )}
        </View>

        <View style={s.stitle}>
          <Text style={s.stitleTxt}>Cả ngày</Text>
          <Pressable onPress={() => navigation?.navigate?.('AddTask')} style={[s.addBtn, { backgroundColor: pal.primary, borderBottomColor: pal.primaryDark }]}>
            <Icon name="plus" size={14} color="#fff" />
            <Text style={s.addBtnTxt}>Thêm việc</Text>
          </Pressable>
        </View>

        {loading && habits.length === 0 && [0, 1, 2].map((i) => <SkeletonRow key={'sk' + i} />)}

        {!loading && todayHabits.length === 0 && (
          <View style={s.empty}>
            <AnimatedMascot size={72} />
            <Text style={s.emptyTitle}>Chưa có việc nào hôm nay</Text>
            <Text style={s.emptySub}>Thêm việc đầu tiên để bạn đồng hành bắt đầu nhắc cưng nha 🐾</Text>
            <Button label="Thêm việc đầu tiên" color={pal.primary} colorDark={pal.primaryDark} onPress={() => navigation?.navigate?.('AddTask')} icon={<Icon name="plus" size={16} color="#fff" />} style={{ marginTop: 14, paddingHorizontal: 20 }} />
          </View>
        )}

        {todayHabits.filter((h) => !(nextUp && h.id === nextUp.h.id)).sort((a, b) => (parseHM(a.time) ?? 9999) - (parseHM(b.time) ?? 9999)).map((h) => (
          <HabitRow key={h.id} h={h} s={s} pal={pal} onKhoe={khoe} navigation={navigation} />
        ))}
      </ScrollView>

      <CelebrationModal data={celebration} onClose={() => setCelebration(null)} />
    </SafeAreaView>
  );
}

const mkStyles = (c: AppColors, pal: any) => StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  hi: { fontFamily: fonts.display, fontSize: 22, color: colors.ink },
  sub: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
  hero: {
    backgroundColor: pal.surface, borderRadius: 28, padding: 18, marginBottom: 20,
    borderWidth: 2, borderColor: '#fff', alignItems: 'center', ...hardShadow(5, 0.14),
  },
  pName: { fontFamily: fonts.display, fontSize: 22, color: colors.ink },
  float: { fontFamily: fonts.display, fontSize: 22, color: c.pinkDark },
  ssr: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: c.pink, borderRadius: radii.pill, paddingVertical: 2, paddingHorizontal: 8 },
  bubble: { backgroundColor: '#fff', borderRadius: 18, borderBottomLeftRadius: 5, padding: 12, ...hardShadow(3, 0.12) },
  nextBlock: { alignSelf: 'stretch', marginTop: 14, alignItems: 'flex-start' },
  nextTag: {
    flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start',
    backgroundColor: '#fff', borderRadius: radii.pill, paddingVertical: 4, paddingHorizontal: 11,
  },
  nextTagTxt: { fontFamily: fonts.heading, fontSize: 11, letterSpacing: 0.5 },
  nextName: { fontFamily: fonts.display, fontSize: 20, color: colors.ink, marginTop: 8 },
  stitle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, marginHorizontal: 4 },
  stitleTxt: { fontFamily: fonts.display, fontSize: 17, color: colors.ink },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: radii.pill, paddingVertical: 6, paddingHorizontal: 12, borderBottomWidth: 3,
  },
  addBtnTxt: { fontFamily: fonts.heading, fontSize: 12, color: '#fff' },
  empty: {
    alignItems: 'center', backgroundColor: pal.soft, borderRadius: 24, padding: 24,
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
