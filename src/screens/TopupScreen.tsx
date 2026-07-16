import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { colors, fonts, radii, hardShadow, type AppColors } from '../theme';
import { Icon } from '../components/Icon';
import { useC, usePal } from '../themeContext';
import { Api } from '../api';
import { playSuccess } from '../sound';

function Gem({ size = 20, color = colors.ink, stroke = 2.4 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M6 3h12l3 6-9 12L3 9z" fill="none" stroke={color} strokeWidth={stroke} strokeLinejoin="round" strokeLinecap="round" />
      <Path d="M3 9h18M9 3 6 9l6 12M15 3l3 6-6 12" fill="none" stroke={color} strokeWidth={stroke} strokeLinejoin="round" strokeLinecap="round" />
    </Svg>
  );
}

function Shield({ size = 16, color = colors.ink, stroke = 2.4 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" fill="none" stroke={color} strokeWidth={stroke} strokeLinejoin="round" strokeLinecap="round" />
    </Svg>
  );
}

// Gói nạp mặc định — có thể ghi đè động từ web admin (/v1/config → gem_packs).
const DEFAULT_PACKS = [
  { id: 'p1', gems: 100, bonus: 0, price: '20.000₫' },
  { id: 'p2', gems: 500, bonus: 50, price: '99.000₫' },
  { id: 'p3', gems: 1000, bonus: 200, price: '199.000₫', best: true },
  { id: 'p4', gems: 2000, bonus: 500, price: '399.000₫' },
];

export default function TopupScreen({ navigation }) {
  const c = useC();
  const pal = usePal();
  const s = useMemo(() => mkStyles(c, pal), [c, pal]);
  const TONES = useMemo(() => ([
    { tone: pal.soft, col: c.rCommon },
    { tone: pal.soft, col: c.skyDark },
    { tone: pal.soft, col: c.purpleDark },
    { tone: pal.soft, col: c.yellowDark },
  ]), [c, pal]);
  const [balance, setBalance] = useState<number | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [packs, setPacks] = useState<any[]>(DEFAULT_PACKS);

  useEffect(() => {
    (async () => {
      try {
        const st = await Api.state();
        if (st && typeof st.gems === 'number') setBalance(st.gems);
      } catch {}
      try {
        const cfg = await Api.config();
        if (Array.isArray(cfg?.gem_packs) && cfg.gem_packs.length) setPacks(cfg.gem_packs);
      } catch {}
    })();
  }, []);

  const buy = async (p: any) => {
    if (busy) return;
    setBusy(p.id);
    const total = p.gems + p.bonus;
    try {
      // Dev/mock: receipt bất kỳ coi như hợp lệ, server cộng gems (AD-14).
      const r = await Api.billingVerify(`purrbo-${p.id}-mock`, total);
      if (r?.ok) {
        playSuccess();
        if (typeof r.gems === 'number') setBalance(r.gems);
        Alert.alert('Nạp thành công 💎', `Cưng nhận ${total.toLocaleString('en-US')} đá quý rồi nha!`);
      } else {
        Alert.alert('Chưa nạp được', 'Giao dịch chưa xác thực. Thử lại nha.');
      }
    } catch (e: any) {
      Alert.alert('Chưa nạp được', String(e?.message ?? e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.hdr}>
          <Pressable onPress={() => navigation?.goBack?.()} style={s.back}>
            <Icon name="back" size={20} color={colors.ink} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={s.hTitle}>Nạp đá quý</Text>
            <Text style={s.hSub}>để mở túi mù & sưu tầm persona</Text>
          </View>
        </View>

        {/* Balance */}
        <View style={s.balCard}>
          <Text style={s.balLabel}>Đá quý hiện có</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <Gem size={26} color="#fff" />
            <Text style={s.balNum}>{balance == null ? '—' : balance.toLocaleString('en-US')}</Text>
          </View>
        </View>

        {/* Packs */}
        {packs.map((p, idx) => {
          const t = TONES[idx % TONES.length];
          return (
          <View key={p.id || idx} style={[s.pack, p.best && s.packBest]}>
            {p.best && (
              <View style={s.bestTag}>
                <Icon name="sparkles" size={11} color="#fff" />
                <Text style={s.bestTagTxt}>Lời nhất</Text>
              </View>
            )}
            <View style={[s.packIc, { backgroundColor: t.tone }]}>
              <Gem size={30} color={t.col} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <Text style={s.packGems}>{p.gems.toLocaleString('en-US')}</Text>
                {p.bonus > 0 && (
                  <View style={s.bonus}>
                    <Text style={s.bonusTxt}>+{p.bonus} tặng</Text>
                  </View>
                )}
              </View>
              <Text style={s.packSub}>đá quý</Text>
            </View>
            <Pressable style={[s.buyBtn, busy === p.id && { opacity: 0.6 }]} disabled={!!busy} onPress={() => buy(p)}>
              {busy === p.id ? <ActivityIndicator color="#fff" /> : <Text style={s.buyTxt}>{p.price}</Text>}
            </Pressable>
          </View>
          );
        })}

        {/* Ethic */}
        <View style={s.note}>
          <Shield size={16} color={c.mintDark} />
          <Text style={s.noteTxt}>
            Thanh toán qua App Store / Google Play. Purrbo xác thực hoá đơn ở máy chủ rồi mới cộng đá quý — an toàn, minh bạch.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const mkStyles = (c: AppColors, pal: any) => StyleSheet.create({
  hdr: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  back: {
    width: 42, height: 42, borderRadius: 14, backgroundColor: '#fff',
    borderWidth: 2, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', ...hardShadow(3, 0.12),
  },
  hTitle: { fontFamily: fonts.display, fontSize: 20, color: colors.ink },
  hSub: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },

  balCard: {
    backgroundColor: c.purple, borderRadius: 24, padding: 18, marginBottom: 20,
    borderWidth: 2, borderColor: '#fff', ...hardShadow(5, 0.16),
  },
  balLabel: { fontFamily: fonts.heading, fontSize: 12, color: '#fff', opacity: 0.9 },
  balNum: { fontFamily: fonts.display, fontSize: 30, color: '#fff' },

  pack: {
    flexDirection: 'row', alignItems: 'center', gap: 13, backgroundColor: '#fff',
    borderWidth: 2, borderColor: colors.line, borderRadius: 20, padding: 13, marginBottom: 12, ...hardShadow(5, 0.14),
  },
  packBest: { borderColor: pal.surface, backgroundColor: pal.soft },
  bestTag: {
    position: 'absolute', top: -10, right: 14, flexDirection: 'row', alignItems: 'center', gap: 4, zIndex: 2,
    backgroundColor: c.purple, borderRadius: radii.pill, paddingVertical: 3, paddingHorizontal: 9, ...hardShadow(3, 0.14),
  },
  bestTagTxt: { fontFamily: fonts.heading, fontSize: 10, color: '#fff' },
  packIc: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', ...hardShadow(3, 0.12) },
  packGems: { fontFamily: fonts.display, fontSize: 20, color: colors.ink },
  packSub: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
  bonus: { backgroundColor: pal.soft, borderColor: pal.surface, borderWidth: 1.5, borderRadius: radii.pill, paddingVertical: 2, paddingHorizontal: 8 },
  bonusTxt: { fontFamily: fonts.heading, fontSize: 10.5, color: c.mintDark },
  buyBtn: {
    backgroundColor: c.pink, borderRadius: radii.pill, paddingVertical: 10, paddingHorizontal: 16,
    borderBottomWidth: 4, borderBottomColor: c.pinkDark, minWidth: 96, alignItems: 'center',
  },
  buyTxt: { fontFamily: fonts.heading, fontSize: 14, color: '#fff' },

  note: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 9,
    backgroundColor: pal.soft, borderColor: pal.surface, borderWidth: 2,
    borderRadius: 18, padding: 13, marginTop: 6,
  },
  noteTxt: { flex: 1, fontFamily: fonts.body, fontSize: 11.5, color: c.mintDark, lineHeight: 17 },
});
