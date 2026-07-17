import React from 'react';
import { View, Text, ScrollView, Pressable, Alert, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Path, Circle } from 'react-native-svg';
import { colors, fonts, radii, hardShadow, type AppColors } from '../theme';
import { useC, usePal, useTheme } from '../themeContext';
import { Icon } from '../components/Icon';
import { PersonaFace, PersonaChibi } from '../components/PersonaFace';
import { Button, Card, ProgressBar } from '../components/ui';
import { Api } from '../api';
import { playSuccess } from '../sound';

// Icon thiếu trong Icon.js → vẽ inline tại đây (không sửa Icon.js).
function LocalIcon({ name, size = 20, color = colors.ink, stroke = 2.4 }) {
  const box = { width: size, height: size, viewBox: '0 0 24 24' };
  const p = { fill: 'none', stroke: color, strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'chat':
      return <Svg {...box}><Path {...p} d="M21 11.5a8.4 8.4 0 0 1-9 8.5 9.3 9.3 0 0 1-4-1L3 21l1-4a8.5 8.5 0 0 1-1-4.5A8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5z" /></Svg>;
    case 'shirt':
      return <Svg {...box}><Path {...p} d="M8 3l4 3 4-3 4 3-2.5 3H18v11H6V9H4.5L2 6z" /></Svg>;
    case 'camera':
      return <Svg {...box}><Path {...p} d="M4 8h3l1.5-2h7L17 8h3v11H4z" /><Circle {...p} cx="12" cy="13" r="3.2" /></Svg>;
    case 'medal':
      return <Svg {...box}><Circle {...p} cx="12" cy="14" r="5.5" /><Path {...p} d="M8.5 9 6 3M15.5 9 18 3" /><Path {...p} d="M12 12.5v3M10.8 13.8h2.4" /></Svg>;
    default:
      return null;
  }
}

function AnyIcon({ ic, local, size, color }) {
  return local ? <LocalIcon name={ic} size={size} color={color} /> : <Icon name={ic} size={size} color={color} />;
}

// Nhãn các chặng thân thiết — chặng HIỆN TẠI tính theo level (không hardcode).
const STAGE_LABELS = [
  { key: 'quen', label: 'Mới quen' },
  { key: 'than', label: 'Thân' },
  { key: 'yeu', label: 'Bạn đồng hành' },
  { key: 'triky', label: 'Tri kỷ' },
];

// Câu chuyện theo từng persona (fallback nếu backend chưa trả intro dài).
const STORY = {
  mun: 'Mèo Mun vốn là chú mèo hoang lạnh nhất khu phố, chẳng thèm để ai lại gần. Cho tới khi gặp cưng — nó giả bộ gắt gỏng nhưng đêm nào cũng đợi cưng "khoe" mới chịu ngủ. Câu cửa miệng "hông lo cho cưng đâu nha" — miệng thì cà khịa mà tim thì mềm nhũn 🖤',
  cam: 'Mochi mềm như kẹo bông nhưng năng nổ hệt mẹ bỉm sữa — cả ngày cứ "Ăn chưa đó cưng??" hỏi dồn không nghỉ, lo cưng ăn chưa uống nước chưa, rồi thả thính cưng đỏ mặt cho vui 🍊',
  ly: 'Lỳ bad-boy lạnh tanh, "...thôi kệ" là câu cửa miệng. Không chủ động, không nhắc nhiều, kiểu bất cần đúng nghĩa — nhưng hễ cưng biến mất vài bữa là y như rằng có tin nhắn "ơ, mất tích đâu rồi". Ai chịu nổi cái vẻ lạnh đó rồi cũng nghiện 😏',
  sep: 'Sếp tổng tài quen ra lệnh, lịch của cưng anh Duyệt hết. Nghiêm khắc mà chiều ngầm — khó gần nhưng ai nếm rồi cũng ghiền cái kiểu chăm-mà-ngầu này 🖤',
  bong: 'Bông thỏ nũng nịu, kéo dài chữ "iii~" cả ngày. Cưng làm ngoan là Bông thương, cưng lười là Bông "huhu méc á" liền. Dính cưng như sam 🥺',
  xu: 'Bé Xu năng lượng vô cực, "ĐI ĐI ĐI" là câu cửa miệng lúc nào cũng có, rủ rê cưng quẩy mọi thứ cho vui. Ở cạnh Xu là hết buồn, chỉ sợ cưng theo không kịp thôi 🔥',
  bo: 'Bơ chill hết nấc, ít nói mà ấm. "Từ từ thôi" là câu cửa miệng — không thúc ép, chỉ lặng lẽ pha trà đợi cưng. Ở cạnh là thấy nhẹ cả người 🍵',
  sin: 'Sìn shiba trung thành tuyệt đối, "Waff!" là tiếng chào quen thuộc mỗi lần thấy cưng. Cưng về là sủa vang cả xóm, đi đâu cũng quấn chân — nuôi Sìn là được thương lố cả ngày 🐶',
};

export default function PersonaScreen({ navigation, route }) {
  // Tông màu của persona đang active — dùng cho MỌI nhấn trên màn.
  const c = useC();
  const pal = usePal();
  const { setVariant } = useTheme();
  const s = React.useMemo(() => mkStyles(c, pal), [c, pal]);
  // Thân thiết THẬT (dời khỏi Home → sống ở đây).
  const [st, setSt] = React.useState<any>(null);
  const [stats, setStats] = React.useState<any>(null);
  const [refreshing, setRefreshing] = React.useState(false);
  const load = React.useCallback(async () => {
    const [s, t] = await Promise.allSettled([Api.state(), Api.stats()]);
    if (s.status === 'fulfilled') setSt(s.value);
    if (t.status === 'fulfilled') setStats(t.value);
  }, []);
  useFocusEffect(React.useCallback(() => { load(); }, [load]));
  const onRefresh = React.useCallback(async () => { setRefreshing(true); await load(); setRefreshing(false); }, [load]);
  const max = 500;
  const aff = st?.affinity_points ?? 0;
  const lvl = st?.affinity_level ?? 1;
  // Chỉ số THẬT (thay số hardcode). Ngày bên nhau = số ngày chăm, việc cùng làm = tổng việc xong.
  const statCards = [
    { ic: 'calendar', local: false, bg: pal.soft, col: c.pinkDark, n: String(stats?.active_days ?? 0), lbl: 'Ngày bên nhau' },
    { ic: 'heart', local: false, bg: pal.soft, col: c.purpleDark, n: String(aff), lbl: 'Điểm thân thiết' },
    { ic: 'check', local: false, bg: pal.soft, col: c.mintDark, n: String(stats?.total_done ?? 0), lbl: 'Việc cùng làm' },
  ];
  const p = route?.params?.persona || {};
  const variant = p.variant || 'mun';
  const name = p.name || 'Mèo Mun';
  const rarity = p.rarity || 'SSR';
  const tag = p.tag || 'cà khịa yêu · gắt gỏng dễ thương';
  const bio = p.intro || 'Boss mèo mun lạnh lùng ngoài gắt trong thương, chuyên cằn nhằn để cưng chăm bản thân cho ngoan 🐾';
  const story = p.intro && p.intro.length > 60 ? p.intro : (STORY[variant] || STORY.mun);
  const [active, setActive] = React.useState(!!route?.params?.active);

  // Chặng thân thiết hiện tại tính theo level (không hardcode 'Thân').
  const curStage = lvl <= 1 ? 0 : lvl <= 3 ? 1 : lvl <= 5 ? 2 : 3;
  // Kỷ niệm TỪ SỐ THẬT (không bịa ngày/sự kiện).
  const memories: any[] = [
    { ic: 'heartfill', local: false, bg: pal.soft, col: c.pinkDark, title: `Thân thiết Lv.${lvl}`, date: `${aff}/${max} điểm thân thiết` },
  ];
  if (stats?.best_streak) memories.push({ ic: 'flamefill', local: false, bg: pal.soft, col: c.coralDark, title: `Streak dài nhất ${stats.best_streak} ngày`, date: 'kỷ lục cùng nhau 🔥' });
  if (stats?.total_done) memories.push({ ic: 'check', local: false, bg: pal.soft, col: c.mintDark, title: `Đã cùng làm ${stats.total_done} việc`, date: 'và còn tiếp tục 💪' });
  if (stats?.active_days) memories.push({ ic: 'calendar', local: false, bg: pal.soft, col: c.purpleDark, title: `${stats.active_days} ngày bên nhau`, date: 'cảm ơn cưng đã ở lại 🐾' });
  const moodLabel = st?.mood || 'bình thường';

  const [saving, setSaving] = React.useState(false);
  const useThis = async () => {
    if (active || !p.key || saving) return;
    setSaving(true);
    try {
      await Api.setPersona(p.key);
      playSuccess();
      setActive(true);
      setVariant(variant);   // đổi tông cả app NGAY theo persona vừa chọn
      Alert.alert('Đã đổi!', `Từ giờ ${name} sẽ đồng hành cùng cưng 💗`);
    } catch (e: any) {
      Alert.alert('Chưa đổi được', String(e?.message ?? e).includes('403') ? 'Cưng chưa sở hữu bạn này — mở túi mù để gặp nha!' : 'Thử lại sau nha.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ padding: 18, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.pink} colors={[c.pink]} />}
      >
        {/* Header */}
        <View style={s.top}>
          <Pressable onPress={() => navigation.goBack()} style={s.iconbtn}>
            <Icon name="back" size={20} color={colors.ink} />
          </Pressable>
          <Text style={s.htitle}>Hồ sơ bạn đồng hành</Text>
          <View style={[s.iconbtn, s.iconbtnLove]}>
            <Icon name="heartfill" size={18} color={c.pinkDark} />
          </View>
        </View>

        {/* Hero */}
        <View style={s.hero}>
          <View style={s.moodtag}>
            <Icon name="flame" size={13} color={c.purpleDark} />
            <Text style={{ fontFamily: fonts.heading, fontSize: 12, color: c.purpleDark }}>Mood: {moodLabel}</Text>
          </View>

          <View style={{ alignItems: 'center' }}>
            <PersonaChibi variant={variant} size={128} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 }}>
              <Text style={{ fontFamily: fonts.display, fontSize: 24, color: colors.ink }}>{name}</Text>
              <View style={s.ssr}>
                <Icon name="star" size={10} color="#fff" />
                <Text style={{ fontFamily: fonts.heading, fontSize: 11, color: '#fff' }}>{rarity}</Text>
              </View>
            </View>
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: c.purpleDark, marginTop: 4 }}>{tag}</Text>
            <Text style={s.bio}>{bio}</Text>
          </View>
        </View>

        {/* Cung bậc quan hệ */}
        <View style={s.stitle}>
          <View style={s.stitleLeft}>
            <Icon name="heart" size={16} color={colors.ink} />
            <Text style={s.stitleTxt}>Cung bậc quan hệ</Text>
          </View>
          <Text style={s.stitleSub}>chương hiện tại</Text>
        </View>
        <Card style={{ marginBottom: 20 }}>
          <View style={s.stepper}>
            <View style={s.track} />
            <View style={s.trackfill} />
            {STAGE_LABELS.map((stg, i) => {
              const state = i < curStage ? 'done' : i === curStage ? 'cur' : 'todo';
              return (
              <View style={s.step} key={stg.key}>
                <View style={[s.dot, state === 'done' && s.dotDone, state === 'cur' && s.dotCur]}>
                  {state === 'done' ? (
                    <Icon name="check" size={16} color={c.pinkDark} />
                  ) : state === 'cur' ? (
                    <Icon name="heartfill" size={15} color="#fff" />
                  ) : (
                    <Icon name="star" size={13} color={colors.muted} />
                  )}
                </View>
                <Text style={[s.stepLabel, state === 'cur' && { color: c.pinkDark }]}>{stg.label}</Text>
              </View>
              );
            })}
          </View>

          <View style={s.progline}>
            <Text style={{ fontFamily: fonts.heading, fontSize: 12, color: c.pinkDark }}>Thân thiết Lv.{lvl}</Text>
            <Text style={{ fontFamily: fonts.heading, fontSize: 12, color: colors.muted }}>{aff} / {max} → Bạn đồng hành</Text>
          </View>
          <ProgressBar pct={(aff / max) * 100} />
        </Card>

        {/* Chuyện của Mèo Mun */}
        <View style={s.stitle}>
          <View style={s.stitleLeft}>
            <Icon name="sparkles" size={16} color={colors.ink} />
            <Text style={s.stitleTxt}>Chuyện của {name}</Text>
          </View>
        </View>
        <Card style={s.story}>
          <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.ink, lineHeight: 22 }}>
            {story}
          </Text>
        </Card>

        {/* Kỷ niệm cùng nhau */}
        <View style={s.stitle}>
          <View style={s.stitleLeft}>
            <Icon name="calendar" size={16} color={colors.ink} />
            <Text style={s.stitleTxt}>Kỷ niệm cùng nhau</Text>
          </View>
          <Text style={s.stitleSub}>{memories.length} cột mốc</Text>
        </View>
        <Card style={{ marginBottom: 20 }}>
          {memories.map((m, i) => (
            <View style={[s.mem, i === memories.length - 1 && { paddingBottom: 0 }]} key={i}>
              <View style={s.rail}>
                <View style={[s.mdot, { backgroundColor: m.bg }]}>
                  <AnyIcon ic={m.ic} local={m.local} size={18} color={m.col} />
                </View>
                {i < memories.length - 1 && <View style={s.mline} />}
              </View>
              <View style={{ flex: 1, paddingTop: 3 }}>
                <Text style={{ fontFamily: fonts.heading, fontSize: 14, color: colors.ink, lineHeight: 18 }}>{m.title}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  <Icon name="clock" size={12} color={colors.muted} />
                  <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.muted, flex: 1 }}>{m.date}</Text>
                </View>
              </View>
            </View>
          ))}
        </Card>

        {/* Thống kê */}
        <View style={s.stitle}>
          <View style={s.stitleLeft}>
            <Icon name="star" size={16} color={colors.ink} />
            <Text style={s.stitleTxt}>Thống kê</Text>
          </View>
        </View>
        <View style={s.stats3}>
          {statCards.map((st, i) => (
            <View style={s.stile} key={i}>
              <View style={[s.sic, { backgroundColor: st.bg }]}>
                <AnyIcon ic={st.ic} local={st.local} size={20} color={st.col} />
              </View>
              <Text style={{ fontFamily: fonts.display, fontSize: 22, color: colors.ink }}>{st.n}</Text>
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 11, color: colors.muted, marginTop: 4 }}>{st.lbl}</Text>
            </View>
          ))}
        </View>

        {/* Actions */}
        <View style={s.actions}>
          <Button
            label="Nhắn tin"
            color={c.pink}
            colorDark={c.pinkDark}
            onPress={() => navigation.navigate('Chat', { persona: { key: p.key, name, variant, rarity, tag, level: 1 } })}
            icon={<LocalIcon name="chat" size={17} color="#fff" />}
            style={{ flex: 1 }}
          />
          <Button
            label={active ? 'Đang dùng' : saving ? 'Đang đổi…' : 'Dùng bạn này'}
            tone={active ? 'soft' : undefined}
            color={active ? undefined : c.mint}
            colorDark={active ? undefined : c.mintDark}
            disabled={saving}
            onPress={useThis}
            icon={<Icon name={active ? 'check' : 'heart'} size={17} color={active ? '#807892' : '#fff'} />}
            style={{ flex: 1 }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const mkStyles = (c: AppColors, pal: any) => StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  htitle: { fontFamily: fonts.display, fontSize: 18, color: colors.ink },
  iconbtn: {
    width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff', borderWidth: 2, borderColor: colors.line, ...hardShadow(3, 0.12),
  },
  iconbtnLove: { backgroundColor: pal.soft, borderColor: pal.surface },

  hero: {
    backgroundColor: pal.surface, borderRadius: 28, padding: 20, marginBottom: 20,
    borderWidth: 2, borderColor: '#fff', ...hardShadow(5, 0.14),
  },
  moodtag: {
    position: 'absolute', top: 14, right: 14, zIndex: 2,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#fff', borderRadius: radii.pill, paddingVertical: 5, paddingHorizontal: 10, ...hardShadow(3, 0.12),
  },
  ssr: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: c.pink, borderRadius: radii.pill, paddingVertical: 3, paddingHorizontal: 9 },
  bio: { fontFamily: fonts.body, fontSize: 13, color: colors.ink, marginTop: 8, opacity: 0.82, lineHeight: 20, textAlign: 'center', paddingHorizontal: 6 },

  stitle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, marginHorizontal: 4 },
  stitleLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stitleTxt: { fontFamily: fonts.display, fontSize: 17, color: colors.ink },
  stitleSub: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.muted },

  stepper: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 },
  track: { position: 'absolute', top: 16, left: '14%', right: '14%', height: 4, backgroundColor: colors.line, borderRadius: radii.pill },
  trackfill: { position: 'absolute', top: 16, left: '14%', width: '24%', height: 4, backgroundColor: c.pink, borderRadius: radii.pill },
  step: { flex: 1, alignItems: 'center', gap: 6 },
  dot: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderWidth: 3, borderColor: colors.line },
  dotDone: { backgroundColor: pal.soft, borderColor: c.pink },
  dotCur: { backgroundColor: c.pink, borderColor: '#fff', ...hardShadow(3, 0.12) },
  stepLabel: { fontFamily: fonts.heading, fontSize: 11, color: colors.muted, textAlign: 'center' },

  progline: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },

  story: { backgroundColor: pal.soft, borderColor: '#fff', marginBottom: 20 },

  mem: { flexDirection: 'row', gap: 14, paddingBottom: 16 },
  rail: { alignItems: 'center' },
  mdot: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', ...hardShadow(3, 0.12) },
  mline: { width: 3, flex: 1, backgroundColor: colors.line, borderRadius: radii.pill, marginTop: 4 },

  stats3: { flexDirection: 'row', gap: 10, marginBottom: 22 },
  stile: { flex: 1, backgroundColor: '#fff', borderWidth: 2, borderColor: colors.line, borderRadius: 20, paddingVertical: 14, paddingHorizontal: 8, alignItems: 'center', ...hardShadow(5, 0.14) },
  sic: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginBottom: 8, ...hardShadow(3, 0.12) },

  actions: { flexDirection: 'row', gap: 10 },
});
