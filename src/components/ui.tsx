import React, { useState, useEffect, useRef } from 'react';
import { Pressable, View, Text, Animated, StyleSheet } from 'react-native';
import { colors, radii, fonts, hardShadow } from '../theme';
import { useC, usePal } from '../themeContext';
import { playTap } from '../sound';

// Skeleton loading (nhấp nháy) — dùng khi chờ API.
export function Skeleton({ width = '100%', height = 16, radius = 10, style = null }: any) {
  const op = useRef(new Animated.Value(0.45)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(op, { toValue: 1, duration: 650, useNativeDriver: true }),
        Animated.timing(op, { toValue: 0.45, duration: 650, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [op]);
  return <Animated.View style={[{ width, height, borderRadius: radius, backgroundColor: '#EAE3F2', opacity: op }, style]} />;
}

// Hàng skeleton kiểu card (icon + 2 dòng) — cho danh sách chờ tải.
export function SkeletonRow() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderWidth: 2, borderColor: colors.line, borderRadius: 22, padding: 13, marginBottom: 12 }}>
      <Skeleton width={48} height={48} radius={15} />
      <View style={{ flex: 1, gap: 8 }}>
        <Skeleton width={'55%'} height={15} />
        <Skeleton width={'80%'} height={11} />
      </View>
      <Skeleton width={70} height={34} radius={999} />
    </View>
  );
}

// Nút bấm hiệu ứng "lún" kiểu Duolingo (dùng borderBottom làm chân 3D).
// color/colorDark: đè tone cố định bằng MÀU PERSONA (personaPalette) — để 1 màn
// chỉ dùng tông của persona đang active thay vì cầu vồng nhiều màu.
export function Button({ label, onPress, tone = 'pink', color, colorDark, icon = null, disabled, style }) {
  const c = useC();
  const [down, setDown] = useState(false);
  const handlePress = disabled ? undefined : (e: any) => { playTap(); onPress?.(e); };
  const map = {
    pink: [c.pink, c.pinkDark, '#fff'],
    purple: [c.purple, c.purpleDark, '#fff'],
    yellow: [c.yellow, c.yellowDark, '#fff'],
    mint: [c.mint, c.mintDark, '#fff'],
    soft: ['#F1ECF6', '#E1D8EC', '#807892'],
  };
  const [bg, foot, fg] = disabled
    ? ['#E7E2EE', '#D6CFE0', '#B7AFC6']
    : color
      ? [color, colorDark || color, '#fff']
      : map[tone];
  return (
    <Pressable
      onPress={handlePress}
      onPressIn={() => setDown(true)}
      onPressOut={() => setDown(false)}
      style={[{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: bg, borderRadius: radii.pill,
        paddingVertical: 12, paddingHorizontal: 22,
        borderBottomWidth: down ? 1 : 5, borderBottomColor: foot,
        transform: [{ translateY: down ? 3 : 0 }],
      }, style]}
    >
      {icon}
      {!!label && <Text style={{ fontFamily: fonts.heading, fontSize: 16, color: fg }}>{label}</Text>}
    </Pressable>
  );
}

export function Card({ children, style }) {
  return (
    <View style={[{
      backgroundColor: colors.card, borderWidth: 2, borderColor: colors.line,
      borderRadius: radii.lg, padding: 16, ...hardShadow(5, 0.14),
    }, style]}>{children}</View>
  );
}

// bg/fg/border vẫn nhận từ ngoài như cũ — bỏ trống thì lấy MẶC ĐỊNH theo persona.
export function Chip({ children, bg, fg, border, style }) {
  const c = useC();
  const pal = usePal();
  const _bg = bg ?? pal.soft;
  const _fg = fg ?? c.pinkDark;
  const _border = border ?? pal.surface;
  return (
    <View style={[{
      flexDirection: 'row', alignItems: 'center', gap: 6,
      backgroundColor: _bg, borderColor: _border, borderWidth: 2,
      borderRadius: radii.pill, paddingVertical: 7, paddingHorizontal: 12, ...hardShadow(3, 0.12),
    }, style]}>
      {typeof children === 'string'
        ? <Text style={{ fontFamily: fonts.semi, fontSize: 13, color: _fg }}>{children}</Text>
        : children}
    </View>
  );
}

export function Bubble({ text, style }) {
  return (
    <View style={[{
      backgroundColor: '#fff', borderColor: colors.line, borderWidth: 2,
      borderRadius: 20, borderBottomLeftRadius: 6, padding: 12, ...hardShadow(3, 0.12),
    }, style]}>
      <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.ink, lineHeight: 21 }}>{text}</Text>
    </View>
  );
}

export function ProgressBar({ pct = 0, from, to }: { pct?: number; from?: string; to?: string }) {
  // Gradient tuyến tính đơn giản: dùng màu "to" làm nền thanh, "from" ở đầu (xấp xỉ).
  const c = useC();
  const _from = from ?? c.pink;
  return (
    <View style={{ height: 14, backgroundColor: '#F0EAF6', borderRadius: radii.pill, borderWidth: 2, borderColor: colors.line, overflow: 'hidden' }}>
      <View style={{ width: `${Math.max(0, Math.min(100, pct))}%`, height: '100%', backgroundColor: _from, borderRadius: radii.pill }} />
    </View>
  );
}

export function RarityBadge({ rar = 'Thường' }) {
  const c = useC();
  const bg = rar === 'SSR' ? c.rSSR : rar === 'Hiếm' ? c.rRare : c.rCommon;
  return (
    <View style={{ backgroundColor: bg, borderRadius: radii.pill, paddingVertical: 3, paddingHorizontal: 10, ...hardShadow(3, 0.12) }}>
      <Text style={{ fontFamily: fonts.heading, fontSize: 11, color: '#fff', letterSpacing: 0.5 }}>{rar.toUpperCase()}</Text>
    </View>
  );
}
