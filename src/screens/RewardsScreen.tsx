import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Share, RefreshControl, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import { colors, fonts, radii, hardShadow } from '../theme';
import { Icon } from '../components/Icon';
import { Button, ProgressBar, SkeletonRow, Skeleton } from '../components/ui';
import { Api } from '../api';
import { playSuccess, playTap } from '../sound';

function Gem({ size = 16, color = colors.yellowDark, stroke = 2.4 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M6 3h12l3 6-9 12L3 9z" fill="none" stroke={color} strokeWidth={stroke} strokeLinejoin="round" strokeLinecap="round" />
      <Path d="M3 9h18M9 3 6 9l6 12M15 3l3 6-6 12" fill="none" stroke={color} strokeWidth={stroke} strokeLinejoin="round" strokeLinecap="round" />
    </Svg>
  );
}

export default function RewardsScreen({ navigation }) {
  const [missions, setMissions] = useState<any[]>([]);
  const [claimable, setClaimable] = useState(0);
  const [balance, setBalance] = useState<number | null>(null);
  const [ref, setRef] = useState<any>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const m = await Api.missions();
      setMissions(m.missions || []);
      setClaimable(m.claimable_gems || 0);
    } catch {}
    try { const st = await Api.state(); if (typeof st?.gems === 'number') setBalance(st.gems); } catch {}
    try { setRef(await Api.referral()); } catch {}
    setLoading(false);
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => { setRefreshing(true); await load(); setRefreshing(false); }, [load]);

  const claim = async (m: any) => {
    if (busy || m.claimed || !m.done) return;
    setBusy(m.key);
    try {
      const r = await Api.claimMission(m.key);
      playSuccess();
      if (typeof r.gems === 'number') setBalance(r.gems);
      await load();
    } catch (e: any) {
      Alert.alert('Chưa nhận được', String(e?.message ?? e));
    } finally { setBusy(null); }
  };

  const share = async () => {
    if (!ref?.code) return;
    playTap();
    try {
      await Share.share({
        message: `Vào Purrbo nuôi thói quen cùng mình nè 🐾 Nhập mã ${ref.code} khi mở app để cả hai nhận đá quý!`,
      });
    } catch {}
  };

  const redeem = async () => {
    const c = code.trim().toUpperCase();
    if (!c || busy) return;
    setBusy('redeem');
    try {
      const r = await Api.redeemReferral(c);
      playSuccess();
      if (typeof r.gems === 'number') setBalance(r.gems);
      setCode('');
      await load();
      Alert.alert('Nhập mã thành công 💎', `Cưng nhận ${r.reward} đá quý rồi nha!`);
    } catch (e: any) {
      Alert.alert('Mã không dùng được', String(e?.message ?? e).replace(/^\d+\s*/, ''));
    } finally { setBusy(null); }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40 }} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.pink} colors={[colors.pink]} />}>
        {/* Header */}
        <View style={s.hdr}>
          <Pressable onPress={() => navigation?.goBack?.()} style={s.back}>
            <Icon name="back" size={20} color={colors.ink} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={s.hTitle}>Nhiệm vụ & thưởng</Text>
            <Text style={s.hSub}>ghé mỗi ngày, gom đá quý đều tay 💎</Text>
          </View>
          <View style={s.balChip}>
            <Gem size={15} color={colors.yellowDark} />
            <Text style={s.balTxt}>{balance == null ? '—' : balance.toLocaleString('en-US')}</Text>
          </View>
        </View>

        {/* Daily missions */}
        <View style={s.stitle}>
          <Text style={s.stitleTxt}>Nhiệm vụ hôm nay</Text>
          {claimable > 0 && (
            <View style={s.hot}>
              <Gem size={12} color="#fff" />
              <Text style={s.hotTxt}>{claimable} chờ nhận</Text>
            </View>
          )}
        </View>

        {loading && missions.length === 0 && [0, 1, 2].map((i) => <SkeletonRow key={'sk' + i} />)}

        {missions.map((m) => (
          <View key={m.key} style={s.mission}>
            <View style={[s.mIc, m.claimed && { backgroundColor: '#EAF7F1' }]}>
              <Icon name={m.icon === 'gift' ? 'gift' : m.icon === 'heart' ? 'heart' : 'sparkles'} size={22} color={m.claimed ? colors.mintDark : colors.purpleDark} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={s.mTitle}>{m.title}</Text>
                <View style={s.reward}><Gem size={11} color={colors.yellowDark} /><Text style={s.rewardTxt}>+{m.reward}</Text></View>
              </View>
              <Text style={s.mDesc}>{m.desc}</Text>
              <View style={{ marginTop: 7 }}>
                <ProgressBar pct={(m.progress / m.goal) * 100} />
                <Text style={s.mProg}>{Math.min(m.progress, m.goal)}/{m.goal}</Text>
              </View>
            </View>
            {m.claimed ? (
              <View style={s.doneTag}><Icon name="check" size={14} color={colors.mintDark} /></View>
            ) : (
              <Pressable
                onPress={() => claim(m)}
                disabled={!m.done || busy === m.key}
                style={[s.claimBtn, !m.done && s.claimBtnOff]}
              >
                {busy === m.key ? <ActivityIndicator color="#fff" /> : <Text style={[s.claimTxt, !m.done && { color: colors.muted }]}>{m.done ? 'Nhận' : '...'}</Text>}
              </Pressable>
            )}
          </View>
        ))}

        {/* Referral */}
        <View style={[s.stitle, { marginTop: 22 }]}>
          <Text style={s.stitleTxt}>Mời bạn — nhận đá quý</Text>
        </View>

        <View style={s.refCard}>
          <Text style={s.refLead}>
            Rủ bạn vào Purrbo: bạn nhập mã của cưng → <Text style={{ color: colors.pinkDark }}>cưng +{ref?.reward_owner ?? 0}</Text>, bạn ấy <Text style={{ color: colors.pinkDark }}>+{ref?.reward_new ?? 0}</Text> 💗
          </Text>

          <View style={s.codeRow}>
            <View style={s.codeBox}>
              <Text style={s.codeLabel}>Mã của cưng</Text>
              <Text style={s.code}>{ref?.code || '••••••'}</Text>
            </View>
            <Button label="Chia sẻ" tone="pink" onPress={share} icon={<Icon name="heart" size={15} color="#fff" />} style={{ paddingHorizontal: 18 }} />
          </View>

          <View style={s.refStat}>
            <Icon name="user" size={13} color={colors.purpleDark} />
            <Text style={s.refStatTxt}>Đã mời {ref?.referred_count ?? 0} bạn</Text>
          </View>
        </View>

        {/* Redeem a code */}
        {!ref?.already_redeemed && (
          <View style={s.redeemCard}>
            <Text style={s.redeemLabel}>Có mã của bạn bè? Nhập vào nhận {ref?.reward_new ?? 0} đá quý</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput
                value={code}
                onChangeText={setCode}
                placeholder="VD: 673BF8"
                placeholderTextColor={colors.muted}
                autoCapitalize="characters"
                maxLength={8}
                style={s.redeemInput}
              />
              <Button label={busy === 'redeem' ? '...' : 'Nhập'} tone="purple" onPress={redeem} disabled={!code.trim() || busy === 'redeem'} style={{ paddingHorizontal: 18 }} />
            </View>
          </View>
        )}
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
  balChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#FFF6DE',
    borderColor: '#FFE39C', borderWidth: 2, borderRadius: radii.pill, paddingVertical: 6, paddingHorizontal: 11,
  },
  balTxt: { fontFamily: fonts.heading, fontSize: 13, color: colors.yellowDark },

  stitle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, marginHorizontal: 4 },
  stitleTxt: { fontFamily: fonts.display, fontSize: 17, color: colors.ink },
  hot: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.pink, borderRadius: radii.pill, paddingVertical: 4, paddingHorizontal: 10 },
  hotTxt: { fontFamily: fonts.heading, fontSize: 11, color: '#fff' },

  mission: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff',
    borderWidth: 2, borderColor: colors.line, borderRadius: 20, padding: 13, marginBottom: 11, ...hardShadow(5, 0.14),
  },
  mIc: { width: 46, height: 46, borderRadius: 14, backgroundColor: '#EEE7FF', alignItems: 'center', justifyContent: 'center' },
  mTitle: { fontFamily: fonts.heading, fontSize: 15, color: colors.ink },
  reward: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#FFF6DE', borderRadius: radii.pill, paddingVertical: 2, paddingHorizontal: 7 },
  rewardTxt: { fontFamily: fonts.heading, fontSize: 11, color: colors.yellowDark },
  mDesc: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 1 },
  mProg: { fontFamily: fonts.bodyBold, fontSize: 10.5, color: colors.muted, marginTop: 3 },
  claimBtn: {
    backgroundColor: colors.mint, borderRadius: radii.pill, paddingVertical: 9, paddingHorizontal: 16,
    borderBottomWidth: 3, borderBottomColor: colors.mintDark, minWidth: 62, alignItems: 'center',
  },
  claimBtnOff: { backgroundColor: '#EFEAF6', borderBottomColor: '#DDD5EA' },
  claimTxt: { fontFamily: fonts.heading, fontSize: 13, color: '#fff' },
  doneTag: { width: 40, height: 40, borderRadius: 13, backgroundColor: '#EAF7F1', alignItems: 'center', justifyContent: 'center' },

  refCard: {
    backgroundColor: '#F6ECFB', borderRadius: 24, padding: 16, marginBottom: 14,
    borderWidth: 2, borderColor: '#fff', ...hardShadow(5, 0.14),
  },
  refLead: { fontFamily: fonts.body, fontSize: 13.5, color: colors.ink, lineHeight: 20, marginBottom: 14 },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  codeBox: { flex: 1, backgroundColor: '#fff', borderRadius: 14, paddingVertical: 10, paddingHorizontal: 14, borderWidth: 2, borderColor: '#EADFF5' },
  codeLabel: { fontFamily: fonts.bodyBold, fontSize: 10.5, color: colors.muted },
  code: { fontFamily: fonts.display, fontSize: 22, color: colors.purpleDark, letterSpacing: 3 },
  refStat: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 12 },
  refStatTxt: { fontFamily: fonts.heading, fontSize: 12, color: colors.purpleDark },

  redeemCard: { backgroundColor: '#fff', borderRadius: 20, padding: 16, borderWidth: 2, borderColor: colors.line, ...hardShadow(3, 0.12) },
  redeemLabel: { fontFamily: fonts.heading, fontSize: 13, color: colors.ink, marginBottom: 10 },
  redeemInput: {
    flex: 1, backgroundColor: colors.bg, borderWidth: 2, borderColor: colors.line, borderRadius: 14,
    paddingVertical: 11, paddingHorizontal: 14, fontFamily: fonts.heading, fontSize: 16, color: colors.ink, letterSpacing: 2,
  },
});
