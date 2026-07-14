import React, { useState, useEffect, useRef } from 'react';
import { Pressable, View, Text, Animated, StyleSheet } from 'react-native';
import { colors, radii, fonts, hardShadow } from '../theme';
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
export function Button({ label, onPress, tone = 'pink', icon = null, disabled, style }) {
  const [down, setDown] = useState(false);
  const handlePress = disabled ? undefined : (e: any) => { playTap(); onPress?.(e); };
  const map = {
    pink: [colors.pink, colors.pinkDark, '#fff'],
    purple: [colors.purple, colors.purpleDark, '#fff'],
    yellow: [colors.yellow, colors.yellowDark, colors.ink],
    mint: [colors.mint, colors.mintDark, '#fff'],
    soft: ['#F1ECF6', '#E1D8EC', '#807892'],
  };
  const [bg, foot, fg] = disabled ? ['#E7E2EE', '#D6CFE0', '#B7AFC6'] : map[tone];
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

export function Chip({ children, bg = '#FFEAF2', fg = colors.pinkDark, border = '#FFCCDF', style }) {
  return (
    <View style={[{
      flexDirection: 'row', alignItems: 'center', gap: 6,
      backgroundColor: bg, borderColor: border, borderWidth: 2,
      borderRadius: radii.pill, paddingVertical: 7, paddingHorizontal: 12, ...hardShadow(3, 0.12),
    }, style]}>
      {typeof children === 'string'
        ? <Text style={{ fontFamily: fonts.semi, fontSize: 13, color: fg }}>{children}</Text>
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

export function ProgressBar({ pct = 0, from = colors.pink, to = colors.purple }) {
  // Gradient tuyến tính đơn giản: dùng màu "to" làm nền thanh, "from" ở đầu (xấp xỉ).
  return (
    <View style={{ height: 14, backgroundColor: '#F0EAF6', borderRadius: radii.pill, borderWidth: 2, borderColor: colors.line, overflow: 'hidden' }}>
      <View style={{ width: `${Math.max(0, Math.min(100, pct))}%`, height: '100%', backgroundColor: from, borderRadius: radii.pill }} />
    </View>
  );
}

export function RarityBadge({ rar = 'Thường' }) {
  const bg = rar === 'SSR' ? colors.rSSR : rar === 'Hiếm' ? colors.rRare : colors.rCommon;
  return (
    <View style={{ backgroundColor: bg, borderRadius: radii.pill, paddingVertical: 3, paddingHorizontal: 10, ...hardShadow(3, 0.12) }}>
      <Text style={{ fontFamily: fonts.heading, fontSize: 11, color: '#fff', letterSpacing: 0.5 }}>{rar.toUpperCase()}</Text>
    </View>
  );
}
