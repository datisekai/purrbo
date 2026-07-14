import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Path, Rect } from 'react-native-svg';
import { colors, fonts, radii, hardShadow } from '../theme';
import { Icon } from '../components/Icon';
import { PersonaFace } from '../components/PersonaFace';
import { Button, ProgressBar, RarityBadge, Skeleton } from '../components/ui';
import { Api } from '../api';
import { playTap } from '../sound';

function Lock({ size = 18, color = '#fff', stroke = 2.6 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x="4.5" y="10.5" width="15" height="10" rx="2.5" fill="none" stroke={color} strokeWidth={stroke} />
      <Path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" />
    </Svg>
  );
}

// Fallback khi backend chưa trả — vẫn có gì đó hấp dẫn để xem.
const FALLBACK = [
  { key: 'mun', name: 'Mun', variant: 'mun', rarity: 'SSR', owned: true, active: true },
  { key: 'cam', name: 'Mochi', variant: 'cam', rarity: 'SSR', owned: true, active: false },
  { key: 'ly', name: 'Lỳ', variant: 'ly', rarity: 'SSR', owned: false, active: false },
  { key: 'sep', name: 'Sếp', variant: 'sep', rarity: 'Hiếm', owned: false, active: false },
  { key: 'bong', name: 'Bông', variant: 'bong', rarity: 'Hiếm', owned: false, active: false },
  { key: 'xu', name: 'Xu', variant: 'xu', rarity: 'Hiếm', owned: false, active: false },
  { key: 'bo', name: 'Bơ', variant: 'bo', rarity: 'Thường', owned: false, active: false },
  { key: 'sin', name: 'Sìn', variant: 'sin', rarity: 'Thường', owned: false, active: false },
];

// Ô "sắp có" để tạo cảm giác sưu tầm còn dài → dụ mở túi.
const UPCOMING = 3;

const TIP = {
  SSR: 'cực hiếm · 1–3% mỗi túi',
  'Hiếm': 'khá hiếm · gặp là mừng',
  'Thường': 'dễ gặp · nuôi cho vui',
};

export default function CollectionScreen({ navigation }) {
  const [list, setList] = useState<any[]>(FALLBACK);
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const col = await Api.collection();
      if (Array.isArray(col) && col.length) setList(col);
    } catch {}
    setLoading(false);
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => { setRefreshing(true); await load(); setRefreshing(false); }, [load]);

  const ownedCount = list.filter((p) => p.owned).length;
  const total = list.length;

  // Chạm persona đã sở hữu → mở hồ sơ ĐÚNG nhân vật đó (không còn hard-code Mèo Mun).
  const open = (p: any) => {
    if (!p.owned) return;
    playTap();
    navigation?.navigate?.('PersonaDetail', {
      persona: { key: p.key, name: p.name, variant: p.variant, rarity: p.rarity, tag: p.tag, intro: p.intro },
      active: p.active,
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      {toast && (
        <View style={s.toast}>
          <Icon name="heartfill" size={15} color="#FF9BC1" />
          <Text style={s.toastTxt}>{toast}</Text>
        </View>
      )}
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40 }} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.pink} colors={[colors.pink]} />}>
        {/* Header */}
        <View style={s.hdr}>
          <Pressable onPress={() => navigation?.goBack?.()} style={s.back}>
            <Icon name="back" size={20} color={colors.ink} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={s.hTitle}>Thư viện persona</Text>
            <Text style={s.hSub}>sưu tầm cả bộ · mỗi em một cá tính</Text>
          </View>
        </View>

        {/* Progress */}
        <View style={s.prog}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Icon name="star" size={15} color={colors.purpleDark} />
              <Text style={s.progTitle}>Đã sưu tầm</Text>
            </View>
            <Text style={s.progNum}>{ownedCount}/{total + UPCOMING}</Text>
          </View>
          <ProgressBar pct={(ownedCount / (total + UPCOMING)) * 100} />
          <Text style={s.progHint}>Mở túi mù để gặp thêm {total - ownedCount + UPCOMING} bạn nữa 👀</Text>
        </View>

        {/* Grid */}
        <View style={s.grid}>
          {loading && [0, 1, 2, 3].map((i) => (
            <View key={'sk' + i} style={[s.card, { alignItems: 'center' }]}>
              <Skeleton width={66} height={66} radius={33} />
              <Skeleton width={'60%'} height={14} style={{ marginTop: 10 }} />
              <Skeleton width={'85%'} height={28} radius={999} style={{ marginTop: 12 }} />
            </View>
          ))}
          {!loading && list.map((p) => (
            <Pressable key={p.key} onPress={() => open(p)} style={[s.card, p.active && s.cardActive, !p.owned && s.cardLocked]}>
              <View style={{ position: 'absolute', top: 10, right: 10, zIndex: 2 }}>
                <RarityBadge rar={p.rarity} />
              </View>
              <View>
                <View style={!p.owned && { opacity: 0.28 }}>
                  <PersonaFace variant={p.variant} ring={p.rarity === 'SSR' ? 'ssr' : undefined} size={66} />
                </View>
                {!p.owned && (
                  <View style={s.lockOverlay}>
                    <Lock size={20} color={colors.muted} />
                  </View>
                )}
              </View>
              <Text style={[s.cName, !p.owned && { color: colors.muted }]}>{p.owned ? p.name : '???'}</Text>
              <Text style={s.cTip}>{TIP[p.rarity] || ''}</Text>
              {p.active ? (
                <View style={s.activeTag}>
                  <Icon name="check" size={12} color="#fff" />
                  <Text style={s.activeTxt}>Đang dùng</Text>
                </View>
              ) : p.owned ? (
                <View style={s.ownedTag}>
                  <Icon name="check" size={12} color={colors.mintDark} />
                  <Text style={s.ownedTxt}>Chạm để xem</Text>
                </View>
              ) : (
                <View style={s.lockTag}>
                  <Lock size={11} color={colors.coralDark} />
                  <Text style={s.lockTxt}>Mở túi để gặp</Text>
                </View>
              )}
            </Pressable>
          ))}

          {/* Ô sắp có (mystery) */}
          {!loading && Array.from({ length: UPCOMING }).map((_, i) => (
            <View key={'q' + i} style={[s.card, s.cardMystery]}>
              <View style={s.mysteryFace}>
                <Text style={s.mysteryQ}>?</Text>
              </View>
              <Text style={[s.cName, { color: colors.muted }]}>Sắp có</Text>
              <Text style={s.cTip}>persona mới đang tới</Text>
            </View>
          ))}
        </View>

        <Button
          label="Mở túi mù để sưu tầm"
          tone="purple"
          onPress={() => navigation?.navigate?.('Main', { screen: 'Shop' })}
          icon={<Icon name="gift" size={16} color="#fff" />}
          style={{ marginTop: 6, paddingVertical: 14 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  hdr: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  back: {
    width: 42, height: 42, borderRadius: 14, backgroundColor: '#fff',
    borderWidth: 2, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', ...hardShadow(3, 0.12),
  },
  hTitle: { fontFamily: fonts.display, fontSize: 20, color: colors.ink },
  hSub: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },

  prog: {
    backgroundColor: '#F6ECFB', borderRadius: 22, padding: 16, marginBottom: 20,
    borderWidth: 2, borderColor: '#fff', ...hardShadow(5, 0.14),
  },
  progTitle: { fontFamily: fonts.display, fontSize: 15, color: colors.ink },
  progNum: { fontFamily: fonts.display, fontSize: 15, color: colors.purpleDark },
  progHint: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 8 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 18 },
  card: {
    width: '47%', flexGrow: 1, alignItems: 'center', padding: 14,
    backgroundColor: '#fff', borderWidth: 2, borderColor: colors.line, borderRadius: 22, ...hardShadow(5, 0.14),
  },
  cardActive: { borderColor: colors.purple, backgroundColor: '#FBF8FF' },
  cardLocked: { backgroundColor: '#FAFAFC' },
  cardMystery: { borderStyle: 'dashed', borderColor: '#D9CFE6', backgroundColor: '#FFFDFB' },
  lockOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  cName: { fontFamily: fonts.display, fontSize: 15, color: colors.ink, marginTop: 9 },
  cTip: { fontFamily: fonts.body, fontSize: 10.5, color: colors.muted, marginBottom: 9, textAlign: 'center' },

  activeTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'stretch', justifyContent: 'center',
    backgroundColor: colors.purple, borderRadius: radii.pill, paddingVertical: 7,
  },
  activeTxt: { fontFamily: fonts.heading, fontSize: 12, color: '#fff' },
  ownedTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'stretch', justifyContent: 'center',
    backgroundColor: '#EAF7F1', borderColor: '#CFEDE0', borderWidth: 2, borderRadius: radii.pill, paddingVertical: 5,
  },
  ownedTxt: { fontFamily: fonts.heading, fontSize: 11.5, color: colors.mintDark },
  lockTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'stretch', justifyContent: 'center',
    backgroundColor: '#FFF0E6', borderColor: '#FFD9C7', borderWidth: 2, borderRadius: radii.pill, paddingVertical: 5,
  },
  lockTxt: { fontFamily: fonts.heading, fontSize: 11, color: colors.coralDark },

  mysteryFace: {
    width: 66, height: 66, borderRadius: 33, backgroundColor: '#F1ECF6',
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#E4DCEE', borderStyle: 'dashed',
  },
  mysteryQ: { fontFamily: fonts.display, fontSize: 30, color: colors.muted },

  toast: {
    position: 'absolute', top: 52, alignSelf: 'center', zIndex: 30,
    flexDirection: 'row', alignItems: 'center', gap: 8, maxWidth: 320,
    backgroundColor: colors.ink, borderRadius: radii.pill, paddingVertical: 11, paddingHorizontal: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 10,
  },
  toastTxt: { fontFamily: fonts.heading, fontSize: 14, color: '#fff', flexShrink: 1 },
});
