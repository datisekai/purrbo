import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { colors, fonts, radii, hardShadow, type AppColors } from '../theme';
import { Icon } from '../components/Icon';
import { useC, usePal, useTheme } from '../themeContext';
import { PersonaFace, PurrboMascot } from '../components/PersonaFace';
import { Button, Bubble, RarityBadge } from '../components/ui';
import { Api } from '../api';
import { useAuth } from '../auth';

// Icon phụ cho quiz — không có trong Icon.js nên khai báo inline (KHÔNG sửa Icon.js).
function MiniIcon({ name, size = 22, color = colors.ink, stroke = 2.4 }) {
  const box = { width: size, height: size, viewBox: '0 0 24 24' };
  const p = { fill: 'none', stroke: color, strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'smile':
      return <Svg {...box}><Circle {...p} cx="12" cy="12" r="9" /><Path {...p} d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" /></Svg>;
    case 'zap':
      return <Svg {...box}><Path {...p} d="M13 2 3 14h9l-1 8 10-12h-9z" /></Svg>;
    case 'target':
      return <Svg {...box}><Circle {...p} cx="12" cy="12" r="8" /><Circle {...p} cx="12" cy="12" r="3" /></Svg>;
    case 'moon':
      return <Svg {...box}><Path {...p} d="M20 14A8 8 0 1 1 10 4a6 6 0 0 0 10 10z" /></Svg>;
    case 'party':
      return <Svg {...box}><Path {...p} d="M4 20l5-14 9 9zM14 6c1-2 3-2 4-1M18 3v3M21 8h-3" /></Svg>;
    default:
      return <Icon name={name} size={size} color={color} stroke={stroke} />;
  }
}

const PERSONA = {
  mun:  { name: 'Mun',   variant: 'mun',  rar: 'SSR',  tag: 'tsundere · cà khịa yêu', line: 'Ơ chào cưng 😼 Em là Mun. Nghe nói cưng hay quên uống nước lắm đúng hông? Yên tâm, có em cằn nhằn cho mà nhớ 💅' },
  cam:  { name: 'Mochi', variant: 'cam',  rar: 'SSR',  tag: 'soft · ngọt xỉu thả thính', line: 'Hí hí chào cưng 🍊 Em là Mochi nè. Từ nay em cưng cưng mỗi ngày, cưng chỉ việc ngoan là em thương xỉu 💗' },
  sep:  { name: 'Sếp',   variant: 'sep',  rar: 'Hiếm', tag: 'tổng tài · chủ động', line: 'Chào. Ta là Sếp 💼 Từ giờ lịch trình của cưng do ta quản. Sống kỷ luật vào, ta lo phần còn lại.' },
  xu:   { name: 'Xu',    variant: 'xu',   rar: 'Hiếm', tag: 'hype · năng lượng vô cực', line: 'YO chào cậu 👾 Xu đây! Chuẩn bị quẩy tung cái list việc luôn nha, đi đi đi khum có lười 🔥' },
};

const mkQuiz = (c: AppColors, pal: any) => [
  { q: 'Cậu muốn được nhắc theo kiểu nào?', opts: [
    { t: 'Dịu dàng, ngọt xỉu dỗ mình',    ic: 'heart',  bg: pal.soft, col: c.pinkDark,   p: 'cam' },
    { t: 'Cà khịa, chọc quê cho tự ái',   ic: 'smile',  bg: pal.soft, col: c.purpleDark, p: 'mun' },
    { t: 'Dứt khoát, ra lệnh luôn',        ic: 'target', bg: pal.soft, col: c.skyDark,    p: 'sep' },
    { t: 'Lầy lội, rủ rê cho vui',         ic: 'zap',    bg: pal.soft, col: c.mintDark,   p: 'xu' },
  ] },
  { q: 'Cuối tuần lý tưởng của cậu là?', opts: [
    { t: 'Cuộn chăn ở nhà, chill',        ic: 'moon',   bg: pal.soft, col: c.pinkDark,   p: 'cam' },
    { t: 'Đi chơi quẩy tưng bừng',         ic: 'party',  bg: pal.soft, col: c.mintDark,   p: 'xu' },
    { t: 'Lên kế hoạch, làm việc',         ic: 'target', bg: pal.soft, col: c.skyDark,    p: 'sep' },
  ] },
  { q: 'Lúc lười biếng, cậu cần ai đó...', opts: [
    { t: 'Ôm ấp dỗ dành mình',             ic: 'heart',  bg: pal.soft, col: c.pinkDark,   p: 'cam' },
    { t: 'Chọc quê cho mình đứng dậy',     ic: 'smile',  bg: pal.soft, col: c.purpleDark, p: 'mun' },
    { t: 'Hô hào rủ mình quẩy',            ic: 'zap',    bg: pal.soft, col: c.mintDark,   p: 'xu' },
  ] },
];

// Option quiz — có hiệu ứng lún như Button.
function QuizOption({ opt, onPress }) {
  const c = useC();
  const pal = usePal();
  const s = useMemo(() => mkStyles(c, pal), [c, pal]);
  const [down, setDown] = useState(false);
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setDown(true)}
      onPressOut={() => setDown(false)}
      style={[s.opt, down && { transform: [{ translateY: 3 }], ...hardShadow(2, 0.1) }]}
    >
      <View style={[s.optIc, { backgroundColor: opt.bg }]}>
        <MiniIcon name={opt.ic} size={22} color={opt.col} />
      </View>
      <Text style={s.optTxt}>{opt.t}</Text>
    </Pressable>
  );
}

export default function OnboardingScreen({ navigation }) {
  const c = useC();
  const pal = usePal();
  const s = useMemo(() => mkStyles(c, pal), [c, pal]);
  const QUIZ = useMemo(() => mkQuiz(c, pal), [c, pal]);
  const { markOnboarded } = useAuth();
  const { setVariant } = useTheme();
  const [step, setStep] = useState(0); // 0 welcome · 1-3 quiz · 4 túi mù · 5 reveal
  const [scores, setScores] = useState({});
  const [picked, setPicked] = useState(null);

  const answer = (p) => {
    setScores((sc) => ({ ...sc, [p]: (sc[p] || 0) + 1 }));
    setStep((st) => st + 1);
  };

  const openCapsule = () => {
    const winner = Object.keys(scores).sort((a, b) => scores[b] - scores[a])[0] || 'mun';
    setPicked(PERSONA[winner]);
    setStep(5);
  };

  const restart = () => {
    setScores({});
    setPicked(null);
    setStep(0);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: pal.soft }} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, padding: 22, paddingBottom: 34 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 0 · Welcome */}
        {step === 0 && (
          <View style={s.center}>
            <PurrboMascot size={120} />
            <Text style={s.wordmark}>Purr<Text style={{ color: c.pink }}>bo</Text></Text>
            <Text style={s.welcomeSub}>
              Chào cậu! Trước tiên, để Purrbo ghép cậu với một người đồng hành hợp gu nha 💘
            </Text>
            <View style={{ width: '100%', marginTop: 14 }}>
              <Button
                label="Bắt đầu thôi"
                color={c.pink} colorDark={c.pinkDark}
                onPress={() => setStep(1)}
                icon={<Icon name="sparkles" size={18} color="#fff" />}
              />
            </View>
          </View>
        )}

        {/* 1-3 · Quiz */}
        {step >= 1 && step <= 3 && (
          <View style={{ flex: 1 }}>
            <View style={s.dots}>
              {[1, 2, 3].map((i) => (
                <View key={i} style={[s.dot, i <= step && s.dotOn]} />
              ))}
            </View>
            <Text style={s.qhead}>{QUIZ[step - 1].q}</Text>
            {QUIZ[step - 1].opts.map((o, i) => (
              <QuizOption key={i} opt={o} onPress={() => answer(o.p)} />
            ))}
          </View>
        )}

        {/* 4 · Túi mù */}
        {step === 4 && (
          <View style={s.center}>
            <View style={s.hintChip}>
              <Icon name="sparkles" size={13} color={c.pinkDark} />
              <Text style={s.hintChipTxt}>Dựa trên tính cách của cậu</Text>
            </View>
            <Text style={s.capTitle}>Túi mù của cậu đây!</Text>
            <Text style={s.capSub}>Chạm để mở xem ai đang chờ cậu 👀</Text>
            <Pressable onPress={openCapsule} style={s.capsule}>
              <View style={s.capsuleBand} />
              <Icon name="gift" size={58} color="#fff" stroke={2.2} />
            </Pressable>
            <View style={{ width: '100%', marginTop: 18 }}>
              <Button
                label="Mở túi mù"
                color={c.pink} colorDark={c.pinkDark}
                onPress={openCapsule}
                icon={<Icon name="gift" size={18} color="#fff" />}
              />
            </View>
          </View>
        )}

        {/* 5 · Reveal */}
        {step === 5 && picked && (
          <View style={s.center}>
            <RarityBadge rar={picked.rar} />
            <View style={{ marginTop: 14, marginBottom: 4 }}>
              <PersonaFace variant={picked.variant} size={110} ring={picked.rar === 'SSR' ? 'ssr' : undefined} />
            </View>
            <Text style={s.rname}>{picked.name}</Text>
            <Text style={s.rtag}>{picked.tag}</Text>
            <Bubble text={picked.line} style={{ marginTop: 16, alignSelf: 'stretch' }} />
            <View style={{ width: '100%', marginTop: 18 }}>
              <Button
                label={`Bắt đầu cùng ${picked.name}`}
                color={c.pink} colorDark={c.pinkDark}
                onPress={async () => {
                  setVariant(picked.variant);  // đổi tông app NGAY — khỏi chờ Home load lại mới đúng màu
                  try {
                    await Api.onboardingPick(picked.variant);
                  } catch (e) {
                    // Nếu API lỗi vẫn cho vào app để không kẹt.
                  }
                  markOnboarded(); // → RootNav tự chuyển sang app (lần sau vào thẳng, không onboard lại)
                }}
                icon={<Icon name="heartfill" size={18} color="#fff" />}
              />
              <Pressable onPress={restart} style={s.redo}>
                <Icon name="refresh" size={15} color={colors.muted} />
                <Text style={s.redoTxt}>Làm lại quiz</Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const mkStyles = (c: AppColors, pal: any) => StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // welcome
  wordmark: { fontFamily: fonts.display, fontSize: 40, color: colors.ink, marginTop: 6 },
  welcomeSub: {
    fontFamily: fonts.body, fontSize: 15, color: colors.muted,
    textAlign: 'center', lineHeight: 23, maxWidth: 280, marginTop: 8,
  },

  // quiz
  dots: { flexDirection: 'row', gap: 6, justifyContent: 'center', marginBottom: 24, marginTop: 6 },
  dot: { width: 26, height: 7, borderRadius: radii.pill, backgroundColor: '#E4DCEC' },
  dotOn: { backgroundColor: c.pink },
  qhead: { fontFamily: fonts.display, fontSize: 22, color: colors.ink, lineHeight: 28, marginBottom: 18 },
  opt: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderWidth: 2, borderColor: colors.line, borderRadius: 20,
    padding: 15, marginBottom: 12, ...hardShadow(5, 0.14),
  },
  optIc: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center', ...hardShadow(3, 0.12) },
  optTxt: { flex: 1, fontFamily: fonts.bodyBold, fontSize: 15, color: colors.ink },

  // túi mù
  hintChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    // Nền màn đã là pal.soft → chip phải dùng TRẮNG mới nổi (soft-trên-soft là chìm).
    backgroundColor: '#fff', borderColor: pal.surface, borderWidth: 2,
    borderRadius: radii.pill, paddingVertical: 6, paddingHorizontal: 12, marginBottom: 14, ...hardShadow(3, 0.12),
  },
  hintChipTxt: { fontFamily: fonts.semi, fontSize: 13, color: c.pinkDark },
  capTitle: { fontFamily: fonts.display, fontSize: 24, color: colors.ink, marginBottom: 4 },
  capSub: { fontFamily: fonts.body, fontSize: 14, color: colors.muted, marginBottom: 8 },
  capsule: {
    width: 170, height: 170, borderRadius: 85, marginTop: 8,
    backgroundColor: c.pink, borderWidth: 5, borderColor: '#fff',
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    ...hardShadow(10, 0.16),
  },
  capsuleBand: {
    position: 'absolute', top: 74, left: 0, right: 0, height: 22,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },

  // reveal
  rname: { fontFamily: fonts.display, fontSize: 28, color: colors.ink, marginTop: 10 },
  rtag: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.muted, marginTop: 2 },
  redo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 14, paddingVertical: 8 },
  redoTxt: { fontFamily: fonts.heading, fontSize: 15, color: colors.muted },
});
