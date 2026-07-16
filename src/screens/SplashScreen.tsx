import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, Animated, Easing, StyleSheet } from 'react-native';
import { colors, fonts, hardShadow, type AppColors } from '../theme';
import { useC, usePal } from '../themeContext';
import { PurrboMascot } from '../components/PersonaFace';

// Màn này chạy TRƯỚC khi có persona → useC() trả tông NEUTRAL (đúng ý đồ).
export default function SplashScreen({ navigation }) {
  const c = useC();
  const pal = usePal();
  const s = useMemo(() => mkStyles(c, pal), [c, pal]);
  const bounce = useRef(new Animated.Value(0)).current;
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  // Mascot bounce nhẹ nhàng (loop)
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(bounce, {
          toValue: 0,
          duration: 1100,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [bounce]);

  // 3 chấm hồng nhún nhảy (lệch pha)
  useEffect(() => {
    const makeDot = (val, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, {
            toValue: 1,
            duration: 440,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(val, {
            toValue: 0,
            duration: 440,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.delay(660 - delay),
        ])
      );
    const anims = [makeDot(dot1, 0), makeDot(dot2, 160), makeDot(dot3, 320)];
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, [dot1, dot2, dot3]);

  // Chuyển sang Onboarding sau ~1.8s
  useEffect(() => {
    const t = setTimeout(() => navigation.replace('Onboarding'), 1800);
    return () => clearTimeout(t);
  }, [navigation]);

  const mascotY = bounce.interpolate({ inputRange: [0, 1], outputRange: [0, -16] });
  const dotStyle = (val, bg) => ({
    backgroundColor: bg,
    transform: [
      { translateY: val.interpolate({ inputRange: [0, 1], outputRange: [0, -10] }) },
    ],
    opacity: val.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }),
  });

  return (
    <View style={s.root}>
      {/* Glow trang trí mềm */}
      <View style={s.glowPink} />
      <View style={s.glowPurple} />

      {/* Hero */}
      <View style={s.hero}>
        <Animated.View style={{ transform: [{ translateY: mascotY }], marginBottom: 22 }}>
          <PurrboMascot size={140} />
        </Animated.View>

        <Text style={s.wordmark}>
          Purr<Text style={{ color: c.pink }}>bo</Text>
        </Text>
        <Text style={s.tagline}>Người luôn ở bên, nhắc bạn sống tử tế mỗi ngày</Text>
      </View>

      {/* Loading */}
      <View style={s.loading}>
        <View style={s.dots}>
          {/* 3 chấm = 3 sắc độ của tông đang dùng */}
          <Animated.View style={[s.dot, dotStyle(dot1, c.pinkDark)]} />
          <Animated.View style={[s.dot, dotStyle(dot2, c.pink)]} />
          <Animated.View style={[s.dot, dotStyle(dot3, pal.surface)]} />
        </View>
        <Text style={s.loadtext}>Đang đánh thức người đồng hành của bạn...</Text>
      </View>
    </View>
  );
}

const mkStyles = (c: AppColors, pal: any) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: pal.soft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  glowPink: {
    position: 'absolute',
    top: -60,
    left: -50,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: c.pink,
    opacity: 0.4,
  },
  glowPurple: {
    position: 'absolute',
    bottom: 60,
    right: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: pal.surface,
    opacity: 0.35,
  },
  hero: { alignItems: 'center', zIndex: 2 },
  wordmark: {
    fontFamily: fonts.display,
    fontSize: 52,
    lineHeight: 58,
    color: colors.ink,
    marginBottom: 12,
  },
  tagline: {
    fontFamily: fonts.body,
    fontSize: 14.5,
    lineHeight: 22,
    color: colors.muted,
    textAlign: 'center',
    maxWidth: 250,
  },
  loading: {
    position: 'absolute',
    bottom: 56,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 14,
    zIndex: 2,
  },
  dots: { flexDirection: 'row', gap: 9 },
  dot: { width: 11, height: 11, borderRadius: 5.5, ...hardShadow(3, 0.12) },
  loadtext: {
    fontFamily: fonts.heading,
    fontSize: 12.5,
    color: colors.muted,
    letterSpacing: 0.2,
  },
});
