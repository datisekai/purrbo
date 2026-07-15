import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { colors, fonts, radii, hardShadow } from '../theme';
import { Icon } from '../components/Icon';
import { PersonaFace } from '../components/PersonaFace';
import { Api } from '../api';
import { Button, Card, ProgressBar, Bubble } from '../components/ui';

// Icon bổ sung (chưa có trong Icon.js) — inline tại chỗ, KHÔNG sửa Icon.js.
function LocalIcon({ name, size = 20, color = colors.ink, stroke = 2.4 }) {
  const box = { width: size, height: size, viewBox: '0 0 24 24' };
  const p = { fill: 'none', stroke: color, strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'snow':
      return (
        <Svg {...box}>
          <Path {...p} d="M12 2v20M4 6l16 12M20 6 4 18" />
          <Path {...p} d="M9 4l3 2 3-2M9 20l3-2 3 2M4.5 9l1.5.4.4-1.5M18 14.1l.4 1.5 1.5-.4M4.5 15l.4-1.5 1.5.4M19.5 9l-1.5-.4-.4 1.5" />
        </Svg>
      );
    case 'wave':
      return (
        <Svg {...box}>
          <Path {...p} d="M18 11V6a1.5 1.5 0 0 0-3 0m0 0V4.5a1.5 1.5 0 0 0-3 0V11m3-6.5V10m-3-3.5a1.5 1.5 0 0 0-3 0V13l-1.2-1.4a1.6 1.6 0 0 0-2.4 2.1L8 19a5 5 0 0 0 4 2h1a5 5 0 0 0 5-5v-5" />
        </Svg>
      );
    case 'handheart':
      return (
        <Svg {...box}>
          <Path {...p} d="M11 14h4a2 2 0 0 0 0-4h-3.5L9 8H4v8l3 1.5c1.5.8 3 1 4.5.8L18 17" />
          <Path {...p} d="M14.5 4.8c.7-.9 2.3-.9 3 0 .4.6.2 1.4-.3 2L15 9l-2.2-2.1c-.5-.6-.7-1.4-.3-2 .7-.9 2.3-.9 3 0z" />
        </Svg>
      );
    case 'shield':
      return (
        <Svg {...box}>
          <Path {...p} d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" />
          <Path {...p} d="M9 12l2 2 4-4" />
        </Svg>
      );
    default:
      return null;
  }
}

const SAD_LINE = '3 ngày rồi cưng hong ngó em... 🥺 Streak 40 ngày tụi mình xây cùng nhau, em vẫn để dành đó nha';
const BACK_LINE = 'Yayyy biết ngay cưng hong bỏ em màaa 😽 streak nối lại nha!';
const BYE_LINE = 'Hong sao đâu cưng, em luôn ở đây nếu cưng cần. Giữ gìn sức khoẻ nha 🫶';

export default function WinbackScreen({ navigation }) {
  // state: 'sad' (mặc định) | 'back' | 'bye'
  const [state, setState] = useState('sad');
  const glad = state === 'back';
  const [pVariant, setPVariant] = useState('mun');
  useEffect(() => {
    (async () => {
      try {
        const [stt, cat] = await Promise.all([Api.state(), Api.personas()]);
        const a = Array.isArray(cat) ? cat.find((x: any) => x.key === stt.persona_key) : null;
        if (a?.variant) setPVariant(a.variant);
      } catch {}
    })();
  }, []);

  const bubbleText = state === 'back' ? BACK_LINE : state === 'bye' ? BYE_LINE : SAD_LINE;
  const subLine =
    state === 'back'
      ? 'bạn đồng hành · cà khịa yêu · đang lại vui'
      : state === 'bye'
      ? 'bạn đồng hành · chào tạm biệt · vẫn thương cưng'
      : 'bạn đồng hành · đang dỗi nhẹ · nhớ cưng';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 34 }} showsVerticalScrollIndicator={false}>
        {/* Thanh header modal */}
        <View style={s.grabRow}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={s.closeBtn}>
            <Icon name="back" size={18} color={colors.muted} />
          </Pressable>
          <Text style={s.grabTitle}>Giận dỗi & Win-back</Text>
          <View style={{ width: 34 }} />
        </View>

        {/* ===== Vùng persona: dỗi (dimmed) ↔ vui (bừng sáng) ===== */}
        <View style={[s.sulk, glad ? s.sulkGlad : s.sulkSad]}>
          <View style={s.moodTag}>
            <Icon name={glad ? 'heartfill' : 'heart'} size={13} color={glad ? colors.purpleDark : '#6E6A82'} />
            <Text style={[s.moodTxt, { color: glad ? colors.purpleDark : '#6E6A82' }]}>
              {glad ? 'Mood: mừng rớt nước mắt' : state === 'bye' ? 'Mood: bình yên' : 'Mood: tủi thân xíu'}
            </Text>
          </View>

          <View style={{ opacity: glad ? 1 : 0.55, marginBottom: 10 }}>
            <PersonaFace variant={pVariant} ring={glad ? 'ssr' : undefined} size={94} />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={s.pName}>Mèo Mun</Text>
            <View style={[s.rar, !glad && s.rarGray]}>
              <Icon name="star" size={9} color="#fff" />
              <Text style={s.rarTxt}>SSR</Text>
            </View>
          </View>
          <Text style={s.pSub}>{subLine}</Text>

          <Bubble text={bubbleText} style={{ marginTop: 14, alignSelf: 'stretch' }} />
        </View>

        {/* ===== Card: mối quan hệ đang nguội ===== */}
        <Card style={[{ marginBottom: 16 }, !glad && { opacity: 0.94 }]}>
          <View style={s.relHead}>
            <Text style={s.relTitle}>Mối quan hệ</Text>
            <View style={[s.state, glad ? s.stateWarm : s.stateFrozen]}>
              {glad ? (
                <Icon name="flamefill" size={12} color={colors.pinkDark} />
              ) : (
                <LocalIcon name="snow" size={12} color="#7C86A0" />
              )}
              <Text style={[s.stateTxt, { color: glad ? colors.pinkDark : '#7C86A0' }]}>
                {glad ? 'Ấm lại rồi nè' : 'Đóng băng — đợi cưng quay lại'}
              </Text>
            </View>
          </View>

          {/* Streak đóng băng */}
          <View style={s.streakRow}>
            <View style={[s.fic, { backgroundColor: glad ? '#FFF0E6' : '#EEF1F6' }]}>
              {glad ? (
                <Icon name="flamefill" size={26} color={colors.coralDark} />
              ) : (
                <Icon name="flame" size={26} color="#9AA2B4" />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                <Text style={s.streakNum}>40 ngày</Text>
                {glad && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Icon name="sparkles" size={13} color={colors.mintDark} />
                    <Text style={s.streakTag}>nối lại</Text>
                  </View>
                )}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 }}>
                {glad ? (
                  <Icon name="heartfill" size={12} color={colors.muted} />
                ) : (
                  <LocalIcon name="snow" size={12} color={colors.muted} />
                )}
                <Text style={s.streakHint}>
                  {glad ? 'streak sống lại, tính tiếp từ hôm nay' : 'streak được giữ đông lạnh, chưa mất'}
                </Text>
              </View>
            </View>
          </View>

          {/* Thanh độ thân thiết (dimmed khi nguội) */}
          <View style={{ marginTop: 4 }}>
            <View style={s.affLbl}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <Icon name="heart" size={13} color={colors.ink} />
                <Text style={s.affTxt}>Độ thân thiết</Text>
              </View>
              <Text style={s.affR}>{glad ? '320/500 · đang ấm dần' : '320/500 · tạm ngưng'}</Text>
            </View>
            <ProgressBar
              pct={64}
              from={glad ? colors.pink : '#C4CAD8'}
              to={glad ? colors.purple : '#C4CAD8'}
            />
          </View>
        </Card>

        {/* ===== Lựa chọn / kết quả ===== */}
        {state === 'sad' && (
          <View style={{ gap: 11 }}>
            <Button
              label="Em quay lại nè, xin lỗi Mèo Mun 💗"
              tone="pink"
              onPress={() => setState('back')}
              icon={<Icon name="heartfill" size={17} color="#fff" />}
            />
            <Button
              label="Tạm biệt tử tế"
              tone="soft"
              onPress={() => setState('bye')}
              icon={<LocalIcon name="wave" size={17} color="#807892" />}
            />
          </View>
        )}

        {state === 'back' && (
          <View style={{ gap: 12 }}>
            <View style={s.resultCard}>
              <View style={s.resultIc}>
                <Icon name="sparkles" size={20} color={colors.mintDark} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.resultTitle}>Tụi mình lại bên nhau rồi!</Text>
                <Text style={s.resultBody}>Streak nối lại, độ thân thiết đang ấm dần lên nha.</Text>
              </View>
            </View>
            <Button label="Đóng" tone="pink" onPress={() => navigation.goBack()} />
          </View>
        )}

        {state === 'bye' && (
          <View style={{ gap: 12 }}>
            <View style={s.resultCard}>
              <View style={s.resultIc}>
                <LocalIcon name="handheart" size={20} color={colors.mintDark} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.resultTitle}>Tạm biệt tử tế</Text>
                <Text style={s.resultBody}>Hong sao đâu cưng, em luôn ở đây nếu cưng cần. Giữ gìn sức khoẻ nha 🫶</Text>
              </View>
            </View>
            <Pressable onPress={() => setState('sad')} style={s.backLine} hitSlop={8}>
              <Icon name="back" size={15} color={colors.pink} />
              <Text style={s.backLineTxt}>Quay lại</Text>
            </Pressable>
            <Button label="Đóng" tone="soft" onPress={() => navigation.goBack()} />
          </View>
        )}

        {/* ===== Caption: thiết kế ấm áp, không thao túng ===== */}
        <View style={s.intent}>
          <LocalIcon name="shield" size={15} color={colors.mintDark} stroke={2.2} />
          <Text style={s.intentTxt}>Thiết kế ấm áp, không thao túng — luôn có lối rời đi tử tế.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  grabRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  closeBtn: {
    width: 34, height: 34, borderRadius: radii.pill, backgroundColor: '#F1ECF6',
    alignItems: 'center', justifyContent: 'center',
  },
  grabTitle: { fontFamily: fonts.display, fontSize: 16, color: colors.ink },

  sulk: {
    borderRadius: 28, padding: 20, paddingTop: 24, marginBottom: 16, alignItems: 'center',
    borderWidth: 2, borderColor: '#fff', ...hardShadow(5, 0.14),
  },
  sulkSad: { backgroundColor: '#E7E3F0' },
  sulkGlad: { backgroundColor: '#F6ECFB' },
  moodTag: {
    alignSelf: 'flex-end', flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#fff', borderRadius: radii.pill, paddingVertical: 5, paddingHorizontal: 10,
    marginBottom: 4, ...hardShadow(3, 0.12),
  },
  moodTxt: { fontFamily: fonts.heading, fontSize: 12 },
  pName: { fontFamily: fonts.display, fontSize: 19, color: colors.ink },
  rar: {
    flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: colors.pink,
    borderRadius: radii.pill, paddingVertical: 2, paddingHorizontal: 8,
  },
  rarGray: { backgroundColor: '#B7B0C6' },
  rarTxt: { fontFamily: fonts.heading, fontSize: 10, color: '#fff' },
  pSub: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 2 },

  relHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 13 },
  relTitle: { fontFamily: fonts.display, fontSize: 16, color: colors.ink },
  state: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: radii.pill, borderWidth: 2, paddingVertical: 5, paddingHorizontal: 10 },
  stateFrozen: { backgroundColor: '#EEF1F6', borderColor: '#DCE2EC' },
  stateWarm: { backgroundColor: '#FFEAF2', borderColor: '#FFCCDF' },
  stateTxt: { fontFamily: fonts.heading, fontSize: 11 },

  streakRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  fic: { width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center', ...hardShadow(3, 0.12) },
  streakNum: { fontFamily: fonts.display, fontSize: 20, color: colors.ink },
  streakTag: { fontFamily: fonts.heading, fontSize: 12, color: colors.mintDark },
  streakHint: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },

  affLbl: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 },
  affTxt: { fontFamily: fonts.heading, fontSize: 12, color: colors.ink },
  affR: { fontFamily: fonts.heading, fontSize: 12, color: colors.muted },

  resultCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 11, backgroundColor: '#EAF7F1',
    borderWidth: 2, borderColor: '#fff', borderRadius: 20, padding: 15, ...hardShadow(3, 0.12),
  },
  resultIc: {
    width: 38, height: 38, borderRadius: 12, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center', ...hardShadow(3, 0.12),
  },
  resultTitle: { fontFamily: fonts.display, fontSize: 15, color: colors.ink, marginBottom: 3 },
  resultBody: { fontFamily: fonts.body, fontSize: 13, color: colors.ink, lineHeight: 20 },

  backLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 2 },
  backLineTxt: { fontFamily: fonts.heading, fontSize: 13, color: colors.pink },

  intent: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: 20, paddingTop: 16, borderTopWidth: 2, borderTopColor: colors.line, borderStyle: 'dashed',
  },
  intentTxt: { flex: 1, fontFamily: fonts.heading, fontSize: 12, color: colors.muted, lineHeight: 18 },
});
