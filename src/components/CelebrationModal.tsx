import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, Pressable, Animated, Easing, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, fonts, radii, hardShadow } from '../theme';
import { PersonaFace } from './PersonaFace';
import { Button } from './ui';

const { width: SCRW } = Dimensions.get('window');
const CONFETTI_COLORS = [colors.pink, colors.purple, colors.yellow, colors.mint, colors.sky, colors.coral];

// Một mảnh confetti rơi + xoay (deterministic theo index, không cần Math.random).
function Confetti({ i }: { i: number }) {
  const fall = useRef(new Animated.Value(0)).current;
  const x = ((i * 53) % 100) / 100 * (SCRW - 24) + 12;
  const delay = (i % 6) * 120;
  const size = 7 + (i % 3) * 3;
  const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
  const round = i % 2 === 0;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(fall, { toValue: 1, duration: 2200 + (i % 4) * 300, easing: Easing.linear, useNativeDriver: true }),
      ])
    ).start();
  }, [fall]);

  const translateY = fall.interpolate({ inputRange: [0, 1], outputRange: [-40, 560] });
  const rotate = fall.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${(i % 2 ? 1 : -1) * 540}deg`] });
  const opacity = fall.interpolate({ inputRange: [0, 0.85, 1], outputRange: [1, 1, 0] });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute', top: 0, left: x, width: size, height: size,
        borderRadius: round ? size / 2 : 2, backgroundColor: color,
        opacity, transform: [{ translateY }, { rotate }],
      }}
    />
  );
}

function Flame({ size = 30, color = '#fff' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 2c2 4 5 5 5 9a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3 1-6 1-8z" fill={color} />
    </Svg>
  );
}

type Celebration = { type: 'level' | 'streak'; value: number; persona?: any; items?: Record<string, string> } | null;

export function CelebrationModal({ data, onClose }: { data: Celebration; onClose: () => void }) {
  const pop = useRef(new Animated.Value(0)).current;
  const visible = !!data;

  useEffect(() => {
    if (visible) {
      pop.setValue(0);
      Animated.spring(pop, { toValue: 1, useNativeDriver: true, friction: 5, tension: 120 }).start();
    }
  }, [visible, pop]);

  if (!data) return null;

  const isLevel = data.type === 'level';
  const title = isLevel ? `Lên Lv.${data.value}!` : `Streak ${data.value} ngày!`;
  const sub = isLevel
    ? `${data.persona?.name || 'Bạn đồng hành'} thương cưng thêm một nấc rồi đó 💗`
    : `Giữ lửa ${data.value} ngày liền — đỉnh của chóp, cưng của em 🔥`;
  const scale = pop.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] });

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={s.backdrop}>
        {Array.from({ length: 16 }).map((_, i) => <Confetti key={i} i={i} />)}
        <Animated.View style={[s.card, { opacity: pop, transform: [{ scale }] }]}>
          <View style={[s.crown, { backgroundColor: isLevel ? colors.pink : colors.coral }]}>
            {isLevel
              ? <Text style={s.crownTxt}>Lv.{data.value}</Text>
              : <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}><Flame size={20} /><Text style={s.crownTxt}>{data.value}</Text></View>}
          </View>
          <PersonaFace variant={data.persona?.variant || 'mun'} ring="ssr" size={92} items={data.items} />
          <Text style={s.title}>{title}</Text>
          <Text style={s.sub}>{sub}</Text>
          <Button label="Tuyệt! 🎉" tone="pink" onPress={onClose} style={{ marginTop: 16, paddingHorizontal: 30 }} />
        </Animated.View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(46,42,63,0.55)', alignItems: 'center', justifyContent: 'center', padding: 28 },
  card: {
    alignItems: 'center', backgroundColor: '#fff', borderRadius: 30, paddingTop: 26, paddingBottom: 22, paddingHorizontal: 24,
    borderWidth: 3, borderColor: '#fff', maxWidth: 340, width: '100%', ...hardShadow(8, 0.22),
  },
  crown: {
    position: 'absolute', top: -18, alignSelf: 'center', borderRadius: radii.pill,
    paddingVertical: 6, paddingHorizontal: 16, borderWidth: 3, borderColor: '#fff', ...hardShadow(4, 0.18),
  },
  crownTxt: { fontFamily: fonts.display, fontSize: 16, color: '#fff' },
  title: { fontFamily: fonts.display, fontSize: 26, color: colors.ink, marginTop: 12 },
  sub: { fontFamily: fonts.body, fontSize: 14, color: colors.muted, textAlign: 'center', marginTop: 6, lineHeight: 21 },
});
