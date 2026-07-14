import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing, StyleSheet } from 'react-native';
import { PurrboMascot } from './PersonaFace';

// Màn TẢI dùng chung: mèo cam thở + nhún + 3 chấm nảy. TỰ CHỨA — không import
// sound/native gì fragile, để dùng được cả khi app đang khởi động hoặc lỗi.
// Nền hồng-kem (KHÁC hẳn trắng #FFF) nên vừa đẹp vừa dễ nhận biết khi debug.
export function LoadingScreen({
  message = 'Đang tải…',
  sub,
}: {
  message?: string;
  sub?: string;
}) {
  const bob = useRef(new Animated.Value(0)).current;
  const breathe = useRef(new Animated.Value(0)).current;
  const d0 = useRef(new Animated.Value(0)).current;
  const d1 = useRef(new Animated.Value(0)).current;
  const d2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = (v: Animated.Value, dur: number, ease: any) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(v, { toValue: 1, duration: dur, easing: ease, useNativeDriver: true }),
          Animated.timing(v, { toValue: 0, duration: dur, easing: ease, useNativeDriver: true }),
        ])
      );
    const a = loop(bob, 1300, Easing.inOut(Easing.sin));
    const b = loop(breathe, 1900, Easing.inOut(Easing.quad));
    const pulse = (v: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(v, { toValue: 1, duration: 420, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(v, { toValue: 0, duration: 420, easing: Easing.in(Easing.quad), useNativeDriver: true }),
          Animated.delay(760 - delay),
        ])
      );
    const p0 = pulse(d0, 0);
    const p1 = pulse(d1, 180);
    const p2 = pulse(d2, 360);
    a.start(); b.start(); p0.start(); p1.start(); p2.start();
    return () => { a.stop(); b.stop(); p0.stop(); p1.stop(); p2.stop(); };
  }, [bob, breathe, d0, d1, d2]);

  const translateY = bob.interpolate({ inputRange: [0, 1], outputRange: [4, -10] });
  const scale = breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] });
  const shadowScale = bob.interpolate({ inputRange: [0, 1], outputRange: [1, 0.8] });
  const shadowOpacity = bob.interpolate({ inputRange: [0, 1], outputRange: [0.16, 0.08] });

  const dotStyle = (v: Animated.Value) => ({
    opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }),
    transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }) }],
  });

  return (
    <View style={s.wrap}>
      <Animated.View style={{ transform: [{ translateY }, { scale }] }}>
        <PurrboMascot size={130} />
      </Animated.View>
      <Animated.View style={[s.shadow, { opacity: shadowOpacity, transform: [{ scaleX: shadowScale }] }]} />
      <Text style={s.msg}>{message}</Text>
      {!!sub && <Text style={s.sub}>{sub}</Text>}
      <View style={s.dots}>
        <Animated.View style={[s.dot, dotStyle(d0)]} />
        <Animated.View style={[s.dot, dotStyle(d1)]} />
        <Animated.View style={[s.dot, dotStyle(d2)]} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#FFF0F4', alignItems: 'center', justifyContent: 'center', padding: 32 },
  shadow: { marginTop: 2, width: 70, height: 9, borderRadius: 9, backgroundColor: '#2E2A3F' },
  msg: { marginTop: 22, fontSize: 17, fontWeight: '800', color: '#2E2A3F' },
  sub: { marginTop: 6, fontSize: 13, color: '#8A8398', textAlign: 'center', lineHeight: 19 },
  dots: { flexDirection: 'row', gap: 8, marginTop: 16 },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#FF4D8D' },
});
