import React from 'react';
import { View, Text, ScrollView, Pressable, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { colors, fonts, radii, hardShadow } from '../theme';
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

const STAGES = [
  { key: 'quen', label: 'Mới quen', state: 'done' },
  { key: 'than', label: 'Thân', state: 'cur' },
  { key: 'yeu', label: 'Bạn đồng hành', state: 'todo' },
  { key: 'triky', label: 'Tri kỷ', state: 'todo' },
];

const MEMORIES = [
  { ic: 'heartfill', local: false, bg: '#FFEAF2', col: colors.pinkDark, title: 'Ngày đầu gặp nhau', date: '2/7 · lần đầu "mở hộp" trúng SSR' },
  { ic: 'flamefill', local: false, bg: '#FFF0E6', col: colors.coralDark, title: 'Streak 7 ngày đầu tiên', date: '9/7 · Mèo Mun bắt đầu tin cưng' },
  { ic: 'camera', local: true, bg: '#E6F7FF', col: colors.skyDark, title: 'Lần đầu cưng khoe ảnh uống nước', date: '10/7 · "ưng cái bụng ghê" 💧' },
  { ic: 'medal', local: true, bg: '#EEE7FF', col: colors.purpleDark, title: 'Đạt Lv.5 thân thiết', date: '12/7 · mở khóa chương Bạn đồng hành sắp tới' },
];

const STATS = [
  { ic: 'calendar', local: false, bg: '#FFEAF2', col: colors.pinkDark, n: '11', lbl: 'Ngày bên nhau' },
  { ic: 'chat', local: true, bg: '#EEE7FF', col: colors.purpleDark, n: '428', lbl: 'Tin nhắn' },
  { ic: 'check', local: false, bg: '#EAF7F1', col: colors.mintDark, n: '96', lbl: 'Việc cùng làm' },
];

// Câu chuyện theo từng persona (fallback nếu backend chưa trả intro dài).
const STORY = {
  mun: 'Mèo Mun vốn là chú mèo hoang lạnh nhất khu phố, chẳng thèm để ai lại gần. Cho tới khi gặp cưng — nó giả bộ gắt gỏng nhưng đêm nào cũng đợi cưng "khoe" mới chịu ngủ. Miệng thì cà khịa mà tim thì mềm nhũn 🖤',
  cam: 'Mochi mềm như kẹo bông, thương cưng lộ liễu không giấu nổi. Cả ngày chỉ lo cưng ăn chưa, uống nước chưa, rồi thả thính cưng đỏ mặt cho vui 🥰',
  ly: 'Lỳ bad-boy lạnh tanh, thính thủ số một, ngoài mặt "tuỳ em thôi" mà trong lòng để ý cưng từng li. Ai chịu nổi cái vẻ kiêu đó rồi cũng nghiện 😏',
  sep: 'Sếp tổng tài quen ra lệnh, lịch của cưng anh duyệt hết. Nghiêm khắc mà chiều ngầm — khó gần nhưng ai nếm rồi cũng ghiền cái kiểu chăm-mà-ngầu này 🖤',
  bong: 'Bông thỏ nũng nịu, kéo dài chữ "iii~" cả ngày. Cưng làm ngoan là Bông thương, cưng lười là Bông xịu mặt méc mẹ. Dính cưng như sam 🥺',
  xu: 'Bé Xu năng lượng vô cực, rủ rê cưng quẩy mọi thứ cho vui. Ở cạnh Xu là hết buồn, chỉ sợ cưng theo không kịp thôi 🔥',
  bo: 'Bơ chill hết nấc, ít nói mà ấm. Không thúc ép, chỉ lặng lẽ pha trà đợi cưng, làm gì cũng "từ từ thôi, không vội". Ở cạnh là thấy nhẹ cả người 🍵',
  sin: 'Sìn shiba trung thành tuyệt đối, vẫy đuôi mừng cưng muốn rụng. Cưng về là sủa vang cả xóm, đi đâu cũng quấn chân — nuôi Sìn là được thương lố cả ngày 🐶',
};

export default function PersonaScreen({ navigation, route }) {
  // Thân thiết THẬT (dời khỏi Home → sống ở đây).
  const [st, setSt] = React.useState<any>(null);
  React.useEffect(() => { Api.state().then(setSt).catch(() => {}); }, []);
  const max = 500;
  const aff = st?.affinity_points ?? 0;
  const lvl = st?.affinity_level ?? 1;
  const p = route?.params?.persona || {};
  const variant = p.variant || 'mun';
  const name = p.name || 'Mèo Mun';
  const rarity = p.rarity || 'SSR';
  const tag = p.tag || 'cà khịa yêu · gắt gỏng dễ thương';
  const bio = p.intro || 'Boss mèo mun lạnh lùng ngoài gắt trong thương, chuyên cằn nhằn để cưng chăm bản thân cho ngoan 🐾';
  const story = p.intro && p.intro.length > 60 ? p.intro : (STORY[variant] || STORY.mun);
  const [active, setActive] = React.useState(!!route?.params?.active);

  const [saving, setSaving] = React.useState(false);
  const useThis = async () => {
    if (active || !p.key || saving) return;
    setSaving(true);
    try {
      await Api.setPersona(p.key);
      playSuccess();
      setActive(true);
      Alert.alert('Đã đổi!', `Từ giờ ${name} sẽ đồng hành cùng cưng 💗`);
    } catch (e: any) {
      Alert.alert('Chưa đổi được', String(e?.message ?? e).includes('403') ? 'Cưng chưa sở hữu bạn này — mở túi mù để gặp nha!' : 'Thử lại sau nha.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.top}>
          <Pressable onPress={() => navigation.goBack()} style={s.iconbtn}>
            <Icon name="back" size={20} color={colors.ink} />
          </Pressable>
          <Text style={s.htitle}>Hồ sơ bạn đồng hành</Text>
          <View style={[s.iconbtn, s.iconbtnLove]}>
            <Icon name="heartfill" size={18} color={colors.pinkDark} />
          </View>
        </View>

        {/* Hero */}
        <View style={s.hero}>
          <View style={s.moodtag}>
            <Icon name="flame" size={13} color={colors.purpleDark} />
            <Text style={{ fontFamily: fonts.heading, fontSize: 12, color: colors.purpleDark }}>Mood: gắt</Text>
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
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: colors.purpleDark, marginTop: 4 }}>{tag}</Text>
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
            {STAGES.map((st) => (
              <View style={s.step} key={st.key}>
                <View style={[s.dot, st.state === 'done' && s.dotDone, st.state === 'cur' && s.dotCur]}>
                  {st.state === 'done' ? (
                    <Icon name="check" size={16} color={colors.pinkDark} />
                  ) : st.state === 'cur' ? (
                    <Icon name="heartfill" size={15} color="#fff" />
                  ) : (
                    <Icon name="star" size={13} color={colors.muted} />
                  )}
                </View>
                <Text style={[s.stepLabel, st.state === 'cur' && { color: colors.pinkDark }]}>{st.label}</Text>
              </View>
            ))}
          </View>

          <View style={s.progline}>
            <Text style={{ fontFamily: fonts.heading, fontSize: 12, color: colors.pinkDark }}>Thân thiết Lv.{lvl}</Text>
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
          <Text style={s.stitleSub}>4 cột mốc</Text>
        </View>
        <Card style={{ marginBottom: 20 }}>
          {MEMORIES.map((m, i) => (
            <View style={[s.mem, i === MEMORIES.length - 1 && { paddingBottom: 0 }]} key={i}>
              <View style={s.rail}>
                <View style={[s.mdot, { backgroundColor: m.bg }]}>
                  <AnyIcon ic={m.ic} local={m.local} size={18} color={m.col} />
                </View>
                {i < MEMORIES.length - 1 && <View style={s.mline} />}
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
          {STATS.map((st, i) => (
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
            tone="pink"
            onPress={() => navigation.navigate('Chat', { persona: { key: p.key, name, variant, rarity, tag, level: 1 } })}
            icon={<LocalIcon name="chat" size={17} color="#fff" />}
            style={{ flex: 1 }}
          />
          <Button
            label={active ? 'Đang dùng' : saving ? 'Đang đổi…' : 'Dùng bạn này'}
            tone={active ? 'soft' : 'mint'}
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

const s = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  htitle: { fontFamily: fonts.display, fontSize: 18, color: colors.ink },
  iconbtn: {
    width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff', borderWidth: 2, borderColor: colors.line, ...hardShadow(3, 0.12),
  },
  iconbtnLove: { backgroundColor: '#FFEAF2', borderColor: '#FFCCDF' },

  hero: {
    backgroundColor: '#F6ECFB', borderRadius: 28, padding: 20, marginBottom: 20,
    borderWidth: 2, borderColor: '#fff', ...hardShadow(5, 0.14),
  },
  moodtag: {
    position: 'absolute', top: 14, right: 14, zIndex: 2,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#fff', borderRadius: radii.pill, paddingVertical: 5, paddingHorizontal: 10, ...hardShadow(3, 0.12),
  },
  ssr: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: colors.pink, borderRadius: radii.pill, paddingVertical: 3, paddingHorizontal: 9 },
  bio: { fontFamily: fonts.body, fontSize: 13, color: colors.ink, marginTop: 8, opacity: 0.82, lineHeight: 20, textAlign: 'center', paddingHorizontal: 6 },

  stitle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, marginHorizontal: 4 },
  stitleLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stitleTxt: { fontFamily: fonts.display, fontSize: 17, color: colors.ink },
  stitleSub: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.muted },

  stepper: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 },
  track: { position: 'absolute', top: 16, left: '14%', right: '14%', height: 4, backgroundColor: colors.line, borderRadius: radii.pill },
  trackfill: { position: 'absolute', top: 16, left: '14%', width: '24%', height: 4, backgroundColor: colors.pink, borderRadius: radii.pill },
  step: { flex: 1, alignItems: 'center', gap: 6 },
  dot: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderWidth: 3, borderColor: colors.line },
  dotDone: { backgroundColor: '#FFEAF2', borderColor: colors.pink },
  dotCur: { backgroundColor: colors.pink, borderColor: '#fff', ...hardShadow(3, 0.12) },
  stepLabel: { fontFamily: fonts.heading, fontSize: 11, color: colors.muted, textAlign: 'center' },

  progline: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },

  story: { backgroundColor: '#FBF4FA', borderColor: '#fff', marginBottom: 20 },

  mem: { flexDirection: 'row', gap: 14, paddingBottom: 16 },
  rail: { alignItems: 'center' },
  mdot: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', ...hardShadow(3, 0.12) },
  mline: { width: 3, flex: 1, backgroundColor: colors.line, borderRadius: radii.pill, marginTop: 4 },

  stats3: { flexDirection: 'row', gap: 10, marginBottom: 22 },
  stile: { flex: 1, backgroundColor: '#fff', borderWidth: 2, borderColor: colors.line, borderRadius: 20, paddingVertical: 14, paddingHorizontal: 8, alignItems: 'center', ...hardShadow(5, 0.14) },
  sic: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginBottom: 8, ...hardShadow(3, 0.12) },

  actions: { flexDirection: 'row', gap: 10 },
});
