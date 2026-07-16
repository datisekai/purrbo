import React, { useEffect, useRef, useMemo } from 'react';
import { View, Text, ScrollView, Animated, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { colors, fonts, radii, hardShadow, type AppColors } from '../theme';
import { useC, usePal } from '../themeContext';
import { Icon } from '../components/Icon';
import { PersonaFace } from '../components/PersonaFace';
import { Button, RarityBadge } from '../components/ui';

function Gem({ size = 15, color }: { size?: number; color?: string }) {
  const c = useC();
  const col = color ?? c.yellowDark;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M6 3h12l3 6-9 12L3 9z" fill="none" stroke={col} strokeWidth={2.4} strokeLinejoin="round" strokeLinecap="round" />
      <Path d="M3 9h18M9 3 6 9l6 12M15 3l3 6-6 12" fill="none" stroke={col} strokeWidth={2.4} strokeLinejoin="round" strokeLinecap="round" />
    </Svg>
  );
}

const RANK = { SSR: 3, 'Hiếm': 2, 'Thường': 1 };

export default function GachaResultScreen({ navigation, route }) {
  const c = useC();
  const pal = usePal();
  const s = useMemo(() => mkStyles(c, pal), [c, pal]);
  const results = route?.params?.results || [];
  const gems = route?.params?.gems;
  // Sắp SSR/Hiếm lên trước cho "đã mắt"
  const sorted = [...results].sort((a, b) => (RANK[b?.persona?.rarity] || 0) - (RANK[a?.persona?.rarity] || 0));
  const newCount = results.filter((r) => r.is_new).length;
  const bestSSR = sorted.some((r) => r?.persona?.rarity === 'SSR');

  const anims = useRef(sorted.map(() => new Animated.Value(0))).current;
  useEffect(() => {
    Animated.stagger(
      90,
      anims.map((v) => Animated.spring(v, { toValue: 1, useNativeDriver: true, friction: 6, tension: 120 }))
    ).start();
  }, [anims]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 36 }} showsVerticalScrollIndicator={false}>
        <View style={s.head}>
          <View style={s.badge}>
            <Icon name="gift" size={16} color="#fff" />
            <Text style={s.badgeTxt}>Mở túi ×10</Text>
          </View>
          <Text style={s.title}>{bestSSR ? 'SSR luôn nè! 🎉' : 'Thành quả của cưng 🎁'}</Text>
          <Text style={s.sub}>
            {newCount > 0 ? `${newCount} persona MỚI` : 'không có persona mới lần này'}
            {typeof gems === 'number' ? ` · còn ${gems.toLocaleString('en-US')} đá quý` : ''}
          </Text>
        </View>

        <View style={s.grid}>
          {sorted.map((r, i) => {
            const p = r.persona || {};
            const ssr = p.rarity === 'SSR';
            const scale = anims[i].interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });
            return (
              <Animated.View key={i} style={[s.card, ssr && s.cardSSR, { opacity: anims[i], transform: [{ scale }] }]}>
                <View style={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}>
                  <RarityBadge rar={p.rarity || 'Thường'} />
                </View>
                {r.is_new && (
                  <View style={s.newTag}><Text style={s.newTxt}>MỚI</Text></View>
                )}
                <PersonaFace variant={p.variant || 'mun'} ring={ssr ? 'ssr' : undefined} size={62} />
                <Text style={s.name}>{p.name || '???'}</Text>
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>

      <View style={s.footer}>
        <View style={s.gemChip}><Gem size={15} color={c.yellowDark} /><Text style={s.gemTxt}>{typeof gems === 'number' ? gems.toLocaleString('en-US') : '—'}</Text></View>
        <Button label="Tuyệt!" tone="pink" onPress={() => navigation?.goBack?.()} style={{ flex: 1, paddingVertical: 14 }} icon={<Icon name="check" size={17} color="#fff" />} />
      </View>
    </SafeAreaView>
  );
}

const mkStyles = (c: AppColors, pal: any) => StyleSheet.create({
  head: { alignItems: 'center', marginBottom: 18 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: c.purple,
    borderRadius: radii.pill, paddingVertical: 5, paddingHorizontal: 13, marginBottom: 10,
  },
  badgeTxt: { fontFamily: fonts.heading, fontSize: 12, color: '#fff' },
  title: { fontFamily: fonts.display, fontSize: 24, color: colors.ink },
  sub: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: 4, textAlign: 'center' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  card: {
    width: '30%', flexGrow: 1, maxWidth: '31%', minWidth: 96, alignItems: 'center', paddingVertical: 14, paddingHorizontal: 6,
    backgroundColor: '#fff', borderWidth: 2, borderColor: colors.line, borderRadius: 20, ...hardShadow(4, 0.12),
  },
  cardSSR: { borderColor: pal.surface, backgroundColor: pal.soft },
  name: { fontFamily: fonts.display, fontSize: 14, color: colors.ink, marginTop: 8 },
  newTag: {
    position: 'absolute', top: 8, left: 8, zIndex: 2, backgroundColor: c.pink,
    borderRadius: radii.pill, paddingVertical: 2, paddingHorizontal: 7,
  },
  newTxt: { fontFamily: fonts.heading, fontSize: 9, color: '#fff', letterSpacing: 0.5 },

  footer: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, paddingBottom: 22,
    borderTopWidth: 2, borderTopColor: colors.line, backgroundColor: '#fff',
  },
  gemChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: pal.soft,
    borderColor: pal.surface, borderWidth: 2, borderRadius: radii.pill, paddingVertical: 9, paddingHorizontal: 13,
  },
  gemTxt: { fontFamily: fonts.heading, fontSize: 14, color: c.yellowDark },
});
