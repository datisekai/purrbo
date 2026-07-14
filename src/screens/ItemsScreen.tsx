import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import { colors, fonts, radii, hardShadow } from '../theme';
import { Icon } from '../components/Icon';
import { PersonaFace, PersonaChibi } from '../components/PersonaFace';
import { RarityBadge } from '../components/ui';
import { Api } from '../api';
import { playSuccess, playTap } from '../sound';

function Gem({ size = 15, color = colors.yellowDark, stroke = 2.4 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M6 3h12l3 6-9 12L3 9z" fill="none" stroke={color} strokeWidth={stroke} strokeLinejoin="round" strokeLinecap="round" />
      <Path d="M3 9h18M9 3 6 9l6 12M15 3l3 6-6 12" fill="none" stroke={color} strokeWidth={stroke} strokeLinejoin="round" strokeLinecap="round" />
    </Svg>
  );
}

const SLOTS = [
  { key: 'hat', label: 'Mũ & nơ' },
  { key: 'glasses', label: 'Kính' },
  { key: 'neck', label: 'Cổ & trang sức' },
];

export default function ItemsScreen({ navigation }) {
  const [items, setItems] = useState<any[]>([]);
  const [equipped, setEquipped] = useState<Record<string, string>>({});
  const [balance, setBalance] = useState<number | null>(null);
  const [variant, setVariant] = useState('cam');
  const [personaName, setPersonaName] = useState('Mochi');
  const [busy, setBusy] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [its, st, cat] = await Promise.all([Api.items(), Api.state(), Api.personas()]);
      if (Array.isArray(its)) setItems(its);
      if (typeof st?.gems === 'number') setBalance(st.gems);
      const active = Array.isArray(cat) ? cat.find((p) => p.key === st.persona_key) : null;
      if (active) { setVariant(active.variant); setPersonaName(active.name); }
      const eq: Record<string, string> = {};
      (its || []).forEach((i) => { if (i.equipped) eq[i.slot] = i.key; });
      setEquipped(eq);
    } catch {}
    setLoading(false);
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const buy = async (it) => {
    if (busy) return;
    setBusy(it.key);
    try {
      const r = await Api.buyItem(it.key);
      playSuccess();
      if (typeof r.gems === 'number') setBalance(r.gems);
      setItems((xs) => xs.map((x) => (x.key === it.key ? { ...x, owned: true } : x)));
    } catch (e: any) {
      Alert.alert('Chưa mua được', String(e?.message ?? e).includes('402') ? 'Không đủ đá quý — nạp thêm nha 💎' : 'Thử lại sau.');
    } finally { setBusy(null); }
  };

  const toggleEquip = async (it) => {
    if (busy) return;
    playTap();
    const isOn = equipped[it.slot] === it.key;
    const nextKey = isOn ? '' : it.key;
    // optimistic
    setEquipped((e) => ({ ...e, [it.slot]: nextKey }));
    setItems((xs) => xs.map((x) => (x.slot === it.slot ? { ...x, equipped: x.key === nextKey } : x)));
    try {
      await Api.equipItem(it.slot, nextKey);
    } catch {
      load(); // revert bằng cách nạp lại
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
            <Text style={s.hTitle}>Trang bị & phụ kiện</Text>
            <Text style={s.hSub}>diện đồ cho {personaName} 💗</Text>
          </View>
          <View style={s.balChip}>
            <Gem size={15} color={colors.yellowDark} />
            <Text style={s.balTxt}>{balance == null ? '—' : balance.toLocaleString('en-US')}</Text>
          </View>
        </View>

        {/* Live preview */}
        <View style={s.preview}>
          <PersonaChibi variant={variant} size={140} items={equipped} />
          <Text style={s.previewName}>{personaName}</Text>
          <Text style={s.previewHint}>chạm "Mặc" bên dưới để thử đồ ngay</Text>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.purple} style={{ marginTop: 30 }} />
        ) : (
          SLOTS.map((slot) => {
            const list = items.filter((i) => i.slot === slot.key);
            if (!list.length) return null;
            return (
              <View key={slot.key}>
                <Text style={s.slotTitle}>{slot.label}</Text>
                <View style={s.grid}>
                  {list.map((it) => {
                    const isOn = equipped[it.slot] === it.key;
                    return (
                      <View key={it.key} style={[s.card, isOn && s.cardOn]}>
                        <View style={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}>
                          <RarityBadge rar={it.rarity} />
                        </View>
                        <PersonaFace variant={variant} size={62} items={{ [it.slot]: it.key }} />
                        <Text style={s.itName}>{it.name}</Text>
                        {it.owned ? (
                          <Pressable onPress={() => toggleEquip(it)} style={[s.btn, isOn ? s.btnOn : s.btnOwned]}>
                            <Icon name="check" size={13} color={isOn ? '#fff' : colors.mintDark} />
                            <Text style={[s.btnTxt, { color: isOn ? '#fff' : colors.mintDark }]}>{isOn ? 'Đang mặc' : 'Mặc'}</Text>
                          </Pressable>
                        ) : (
                          <Pressable onPress={() => buy(it)} disabled={busy === it.key} style={[s.btn, s.btnBuy]}>
                            {busy === it.key ? <ActivityIndicator color="#fff" /> : (<><Gem size={12} color="#fff" /><Text style={[s.btnTxt, { color: '#fff' }]}>{it.price}</Text></>)}
                          </Pressable>
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  hdr: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  back: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#fff', borderWidth: 2, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', ...hardShadow(3, 0.12) },
  hTitle: { fontFamily: fonts.display, fontSize: 20, color: colors.ink },
  hSub: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
  balChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#FFF6DE', borderColor: '#FFE39C', borderWidth: 2, borderRadius: radii.pill, paddingVertical: 6, paddingHorizontal: 11 },
  balTxt: { fontFamily: fonts.heading, fontSize: 13, color: colors.yellowDark },

  preview: { alignItems: 'center', backgroundColor: '#F6ECFB', borderRadius: 28, padding: 20, marginBottom: 20, borderWidth: 2, borderColor: '#fff', ...hardShadow(5, 0.14) },
  previewName: { fontFamily: fonts.display, fontSize: 20, color: colors.ink, marginTop: 10 },
  previewHint: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 2 },

  slotTitle: { fontFamily: fonts.display, fontSize: 16, color: colors.ink, marginBottom: 12, marginHorizontal: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 18 },
  card: { width: '47%', flexGrow: 1, alignItems: 'center', padding: 13, backgroundColor: '#fff', borderWidth: 2, borderColor: colors.line, borderRadius: 22, ...hardShadow(5, 0.14) },
  cardOn: { borderColor: colors.mint, backgroundColor: '#F2FBF7' },
  itName: { fontFamily: fonts.heading, fontSize: 14, color: colors.ink, marginTop: 8, marginBottom: 9 },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, alignSelf: 'stretch', borderRadius: radii.pill, paddingVertical: 9 },
  btnBuy: { backgroundColor: colors.purple, borderBottomWidth: 3, borderBottomColor: colors.purpleDark },
  btnOwned: { backgroundColor: '#EAF7F1', borderWidth: 2, borderColor: '#CFEDE0' },
  btnOn: { backgroundColor: colors.mint, borderBottomWidth: 3, borderBottomColor: colors.mintDark },
  btnTxt: { fontFamily: fonts.heading, fontSize: 13 },
});
