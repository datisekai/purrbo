import React, { useEffect, useRef } from 'react';
import { Pressable, Animated, Easing, View } from 'react-native';
import { PurrboMascot } from './PersonaFace';
import { playTap } from '../sound';

// Mèo cam Purrbo có hồn: thở nhè nhẹ + nhún lên xuống + thỉnh thoảng lắc tai.
// Chạm vào → nhảy tưng + tiếng "tap". Dùng RN Animated (không cần reanimated).
export function AnimatedMascot({ size = 120, onPress }: { size?: number; onPress?: () => void }) {
  const bob = useRef(new Animated.Value(0)).current;     // nhún dọc
  const breathe = useRef(new Animated.Value(0)).current; // phồng nhẹ (scale)
  const tilt = useRef(new Animated.Value(0)).current;    // lắc lư
  const hop = useRef(new Animated.Value(0)).current;     // nảy khi chạm

  useEffect(() => {
    const loopBob = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    const loopBreathe = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: 1900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 0, duration: 1900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    // Lắc lư: nghỉ một lúc rồi lắc qua lại vài nhịp
    const loopTilt = Animated.loop(
      Animated.sequence([
        Animated.delay(2200),
        Animated.timing(tilt, { toValue: 1, duration: 260, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(tilt, { toValue: -1, duration: 460, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(tilt, { toValue: 0, duration: 260, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    loopBob.start(); loopBreathe.start(); loopTilt.start();
    return () => { loopBob.stop(); loopBreathe.stop(); loopTilt.stop(); };
  }, [bob, breathe, tilt]);

  const doHop = () => {
    playTap();
    hop.setValue(0);
    Animated.sequence([
      Animated.spring(hop, { toValue: 1, useNativeDriver: true, friction: 4, tension: 140 }),
      Animated.spring(hop, { toValue: 0, useNativeDriver: true, friction: 5, tension: 120 }),
    ]).start();
    onPress?.();
  };

  const translateY = Animated.add(
    bob.interpolate({ inputRange: [0, 1], outputRange: [3, -7] }),
    hop.interpolate({ inputRange: [0, 1], outputRange: [0, -22] })
  );
  const scale = Animated.add(
    breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.045] }),
    hop.interpolate({ inputRange: [0, 1], outputRange: [0, 0.06] })
  );
  const rotate = tilt.interpolate({ inputRange: [-1, 1], outputRange: ['-7deg', '7deg'] });

  return (
    <Pressable onPress={doHop} hitSlop={12}>
      <Animated.View style={{ transform: [{ translateY }, { scale }, { rotate }] }}>
        <PurrboMascot size={size} />
      </Animated.View>
      {/* bóng đổ nhẹ dưới chân cho cảm giác nảy */}
      <Animated.View
        style={{
          alignSelf: 'center', marginTop: -6, height: 8, borderRadius: 8,
          backgroundColor: '#2E2A3F',
          width: size * 0.42,
          opacity: bob.interpolate({ inputRange: [0, 1], outputRange: [0.16, 0.09] }),
          transform: [{ scaleX: bob.interpolate({ inputRange: [0, 1], outputRange: [1, 0.82] }) }],
        }}
      />
    </Pressable>
  );
}
