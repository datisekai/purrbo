import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, StyleSheet, Animated, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { colors, fonts, radii, hardShadow } from '../theme';
import { Icon } from '../components/Icon';
import { PersonaFace } from '../components/PersonaFace';
import { Button, Card, Chip, RarityBadge, Skeleton } from '../components/ui';
import { Api } from '../api';
import { playOpen, playSuccess } from '../sound';

// Icon phụ (không có trong Icon.js) — vẽ inline tại đây, KHÔNG sửa Icon.js.
function MiniIcon({ name, size = 20, color = colors.ink, stroke = 2.4 }) {
  const box = { width: size, height: size, viewBox: '0 0 24 24' };
  const p = { fill: 'none', stroke: color, strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'gem':
      return <Svg {...box}><Path {...p} d="M6 3h12l3 6-9 12L3 9z" /><Path {...p} d="M3 9h18M9 3 6 9l6 12M15 3l3 6-6 12" /></Svg>;
    case 'crown':
      return <Svg {...box}><Path {...p} d="M3 8l4 4 5-7 5 7 4-4-2 11H5z" /></Svg>;
    case 'layers':
      return <Svg {...box}><Path {...p} d="M12 3 3 8l9 5 9-5z" /><Path {...p} d="M3 13l9 5 9-5M3 18l9 5 9-5" /></Svg>;
    case 'shield':
      return <Svg {...box}><Path {...p} d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6z" /></Svg>;
    case 'shuffle':
      return <Svg {...box}><Path {...p} d="M18 4h3v3M21 4l-7 7M18 20h3v-3M3 4l6 6M21 17l-6-6M3 20l5-5" /></Svg>;
    case 'lock':
      return <Svg {...box}><Rect {...p} x="4.5" y="10.5" width="15" height="10" rx="2.5" /><Path {...p} d="M8 10.5V7a4 4 0 0 1 8 0v3.5" /></Svg>;
    default:
      return null;
  }
}

// Chấm màu nhỏ cạnh dòng tỉ lệ trong card túi mù.
function Dot({ color }) {
  return <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: color, marginRight: 5 }} />;
}

// Pool gacha giả lập cho hiệu ứng "reveal" khi mở túi.
const POOL = [
  { variant: 'mun', name: 'Mun', rar: 'SSR' },
  { variant: 'cam', name: 'Mochi', rar: 'SSR' },
  { variant: 'xu', name: 'Xu', rar: 'Hiếm' },
  { variant: 'bo', name: 'Bơ', rar: 'Thường' },
];

const BAGS = [
  {
    id: 'thuong',
    ic: 'gift',
    icBg: '#EDEFF5',
    icCol: colors.rCommon,
    name: 'Túi mù Thường',
    sub: 'rẻ, mở nhiều cho vui',
    price: '40',
    tone: 'soft',
    odds: [
      { c: colors.pink, t: 'SSR 1%' },
      { c: colors.sky, t: 'Hiếm 14%' },
      { c: colors.rCommon, t: 'Thường 85%' },
    ],
  },
  {
    id: 'cao',
    ic: 'crown',
    icBg: '#FFE9B8',
    icCol: colors.pink,
    name: 'Túi mù Cao cấp',
    sub: 'tỉ lệ SSR cao hơn hẳn',
    price: '120',
    tone: 'pink',
    prem: true,
    odds: [
      { c: colors.pink, t: 'SSR 3%' },
      { c: colors.sky, t: 'Hiếm 22%' },
      { c: colors.rCommon, t: 'Thường 75%' },
    ],
  },
];

const SHOP = [
  { variant: 'mun', name: 'Mun', rar: 'SSR', owned: true },
  { variant: 'cam', name: 'Mochi', rar: 'SSR', price: '600' },
  { variant: 'sep', name: 'Sếp', rar: 'Hiếm', price: '420' },
  { variant: 'bo', name: 'Bơ', rar: 'Thường', price: '150' },
];

// Giá bán persona (backend không trả giá) — tra theo variant, mặc định theo rarity.
const PRICE_BY_VARIANT = { mun: '600', cam: '600', ly: '600', sep: '420', bong: '420', xu: '420', bo: '150', sin: '150' };

export default function ShopScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [balance, setBalance] = useState(0);
  const [shop, setShop] = useState(SHOP);
  const [reveal, setReveal] = useState(null);
  const anim = useRef(new Animated.Value(0)).current;
  const timer = useRef(null);

  // Số dư đá quý làm mới mỗi lần vào màn (đổi sau khi nạp ở màn Topup).
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        try {
          const st = await Api.state();
          if (alive && st && typeof st.gems === 'number') setBalance(st.gems);
        } catch {}
      })();
      return () => { alive = false; };
    }, [])
  );

  const [loadingShop, setLoadingShop] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [buyingKey, setBuyingKey] = useState<string | null>(null);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { const st = await Api.state(); if (typeof st?.gems === 'number') setBalance(st.gems); } catch {}
    try {
      const col = await Api.collection();
      if (Array.isArray(col)) setShop(col.map((c) => ({ key: c.key, variant: c.variant, name: c.name, rar: c.rarity, owned: c.owned, price: PRICE_BY_VARIANT[c.variant] ?? '420' })));
    } catch {}
    setRefreshing(false);
  }, []);

  // Bộ sưu tập persona + gói đặc biệt động (nạp 1 lần khi mount).
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const col = await Api.collection();
        if (alive && Array.isArray(col)) {
          setShop(
            col.map((c) => ({
              key: c.key,
              variant: c.variant,
              name: c.name,
              rar: c.rarity,
              owned: c.owned,
              price: PRICE_BY_VARIANT[c.variant] ?? '420',
            }))
          );
        }
      } catch {}
      if (alive) setLoadingShop(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const buyPersona = async (p) => {
    if (buyingKey || !p?.key) return;
    setBuyingKey(p.key);
    try {
      const res = await Api.buyPersona(p.key);
      playSuccess();
      if (typeof res?.gems === 'number') setBalance(res.gems);
      setShop((xs) => xs.map((x) => (x.key === p.key ? { ...x, owned: true } : x)));
      Alert.alert('Mua thành công 🎉', `${p.name} về nhà với cưng rồi! Vào Hồ sơ để chọn làm bạn đồng hành nha.`);
    } catch (e: any) {
      const msg = String(e?.message ?? e);
      Alert.alert(
        'Chưa mua được',
        msg.includes('402') ? 'Không đủ đá quý — nạp thêm nha 💎'
          : msg.includes('409') ? 'Cưng đã sở hữu bạn này rồi 😽'
          : 'Thử lại sau nha.'
      );
    } finally {
      setBuyingKey(null);
    }
  };

  const openBag = async (bag = 'thuong') => {
    playOpen();
    try {
      const res = await Api.gachaOpen(bag);
      const p = res.persona;
      const pick = { variant: p.variant, name: p.name, rar: p.rarity };
      playSuccess();
      setBalance(res.gems);
      setReveal(pick);
      anim.setValue(0);
      Animated.spring(anim, { toValue: 1, useNativeDriver: true, friction: 6, tension: 90 }).start();
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        Animated.timing(anim, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => setReveal(null));
      }, 2400);
    } catch (e) {
      Alert.alert('Hết đá quý', 'Không đủ đá quý để mở túi này nha');
    }
  };

  const openBag10 = async (bag = 'caocap') => {
    playOpen();
    try {
      const res = await Api.gachaOpen10(bag);
      playSuccess();
      setBalance(res.gems);
      navigation?.navigate?.('GachaResult', { results: res.results, gems: res.gems });
    } catch (e) {
      Alert.alert('Không đủ đá quý', 'Mở x10 cần nhiều đá quý hơn — nạp thêm nha 💎');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      {reveal && (
        <Animated.View
          pointerEvents="none"
          style={[
            s.reveal,
            { top: insets.top + 10 },
            {
              opacity: anim,
              transform: [
                { translateX: -118 },
                { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) },
                { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) },
              ],
            },
          ]}
        >
          <PersonaFace variant={reveal.variant} ring={reveal.rar === 'SSR' ? 'ssr' : undefined} size={52} />
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'wrap' }}>
              <Text style={{ fontFamily: fonts.display, fontSize: 15, color: colors.ink }}>Nhận {reveal.name}!</Text>
              <RarityBadge rar={reveal.rar} />
            </View>
            <Text style={{ fontFamily: fonts.body, fontSize: 11.5, color: colors.muted }}>đã thêm vào bộ sưu tập</Text>
          </View>
        </Animated.View>
      )}

      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40 }} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.pink} colors={[colors.pink]} />}>
        {/* Header */}
        <View style={s.top}>
          <View style={{ flex: 1 }}>
            <Text style={s.hi}>Shop</Text>
            <Text style={s.sub}>túi mù & persona · chơi vui, chơi minh bạch</Text>
          </View>
          <Pressable onPress={() => navigation?.navigate?.('Topup')}>
            <Chip bg="#FFF6DE" fg={colors.yellowDark} border="#FFE39C">
              <MiniIcon name="gem" size={15} color={colors.yellowDark} />
              <Text style={{ fontFamily: fonts.heading, fontSize: 14, color: colors.yellowDark }}>
                {balance.toLocaleString('en-US')}
              </Text>
            </Chip>
          </Pressable>
          <Pressable onPress={() => navigation?.navigate?.('Topup')} style={s.topupBtn}>
            <Icon name="plus" size={16} color="#fff" />
            <Text style={s.topupTxt}>Nạp</Text>
          </Pressable>
        </View>

        {/* Featured banner */}
        <LinearGradient
          colors={[colors.pink, colors.purple, colors.yellow]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.feat}
        >
          <View style={s.featTag}>
            <Icon name="sparkles" size={12} color="#fff" />
            <Text style={s.featTagTxt}>Sự kiện tuần này</Text>
          </View>
          <Text style={s.featTitle}>Túi mù Cao cấp</Text>
          <Text style={s.featSub}>Cơ hội gặp persona SSR giới hạn — mở là hồi hộp!</Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 }}>
            <Button
              label="Mở túi · 120"
              tone="soft"
              onPress={() => openBag('caocap')}
              icon={<Icon name="gift" size={16} color={colors.pinkDark} />}
              style={{ backgroundColor: '#fff', borderBottomColor: '#F1D9E4' }}
            />
            <Button
              label="Mở x10"
              tone="yellow"
              onPress={() => openBag10('caocap')}
              icon={<MiniIcon name="layers" size={15} color={colors.ink} />}
              style={{ paddingHorizontal: 16 }}
            />
          </View>

          <View style={s.odds}>
            <MiniIcon name="shield" size={15} color="#fff" />
            <Text style={s.oddsTxt}>Tỉ lệ minh bạch: SSR 3% · Hiếm 22% · Thường 75%</Text>
          </View>
        </LinearGradient>

        {/* Trang bị & phụ kiện — đổi ngoại hình */}
        <Pressable style={s.dressCard} onPress={() => navigation?.navigate?.('Items')}>
          <View style={s.dressIc}><Icon name="star" size={22} color="#fff" /></View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={s.dressTitle}>Trang bị & phụ kiện</Text>
            <Text style={s.dressSub}>mũ, kính, trang sức — diện đồ đổi ngoại hình cho bạn đồng hành</Text>
          </View>
          <Icon name="plus" size={18} color={colors.purpleDark} />
        </Pressable>

        {/* Chọn túi mù */}
        <View style={s.stitle}>
          <Text style={s.stitleTxt}>Chọn túi mù</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <MiniIcon name="gem" size={12} color={colors.muted} />
            <Text style={s.stitleHint}>trả bằng đá quý</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 22 }}>
          {BAGS.map((b) => (
            <Card
              key={b.id}
              style={[
                { flex: 1, padding: 14 },
                b.prem && { borderColor: '#FFE39C', backgroundColor: '#FFFBF0' },
              ]}
            >
              <View style={[s.bagIc, { backgroundColor: b.icBg }]}>
                <Icon name="gift" size={40} color={b.icCol} />
                {b.ic === 'crown' && (
                  <View style={{ position: 'absolute', top: 10, right: 12 }}>
                    <MiniIcon name="crown" size={22} color={colors.yellowDark} />
                  </View>
                )}
              </View>
              <Text style={s.bagName}>{b.name}</Text>
              <Text style={s.bagSub}>{b.sub}</Text>
              <View style={{ marginBottom: 11 }}>
                {b.odds.map((o) => (
                  <View key={o.t} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
                    <Dot color={o.c} />
                    <Text style={s.miniOdds}>{o.t}</Text>
                  </View>
                ))}
              </View>
              <View style={s.bagPrice}>
                <MiniIcon name="gem" size={14} color={colors.yellowDark} />
                <Text style={s.bagPriceTxt}>{b.price}</Text>
              </View>
              <Button
                label="Mở túi"
                tone={b.tone}
                onPress={() => openBag(b.id === 'cao' ? 'caocap' : 'thuong')}
                icon={<Icon name="gift" size={15} color={b.tone === 'pink' ? '#fff' : '#807892'} />}
                style={{ paddingVertical: 9, paddingHorizontal: 12 }}
              />
            </Card>
          ))}
        </View>

        {/* Persona đang bán */}
        <View style={s.stitle}>
          <Text style={s.stitleTxt}>Persona đang bán</Text>
          <Pressable onPress={() => navigation?.navigate?.('Collection')} style={s.seeAll}>
            <Text style={s.seeAllTxt}>Xem thư viện</Text>
            <Icon name="star" size={12} color={colors.purpleDark} />
          </Pressable>
        </View>

        <View style={s.grid}>
          {loadingShop && [0, 1, 2, 3].map((i) => (
            <Card key={'sk' + i} style={[s.pcard, { alignItems: 'center' }]}>
              <Skeleton width={64} height={64} radius={32} />
              <Skeleton width={'55%'} height={13} style={{ marginTop: 9 }} />
              <Skeleton width={'70%'} height={11} style={{ marginTop: 6 }} />
              <Skeleton width={'100%'} height={32} radius={999} style={{ marginTop: 10 }} />
            </Card>
          ))}
          {!loadingShop && shop.map((p) => (
            <Card
              key={p.name}
              style={[
                s.pcard,
                p.owned && { backgroundColor: '#F2FBF7', borderColor: '#CFEDE0' },
              ]}
            >
              <View style={{ position: 'absolute', top: 12, right: 12, zIndex: 2 }}>
                <RarityBadge rar={p.rar} />
              </View>
              <PersonaFace variant={p.variant} ring={p.rar === 'SSR' ? 'ssr' : undefined} size={64} />
              <Text style={s.pName}>{p.name}</Text>
              <Text style={s.pSub}>bạn đồng hành · {p.rar.toLowerCase()}</Text>
              {p.owned ? (
                <Button
                  label="Đã sở hữu"
                  tone="mint"
                  onPress={() => {}}
                  icon={<Icon name="check" size={15} color="#fff" />}
                  style={{ paddingVertical: 9, paddingHorizontal: 12, alignSelf: 'stretch' }}
                />
              ) : (
                <Button
                  label={buyingKey === p.key ? 'Đang mua…' : p.price}
                  tone="purple"
                  disabled={buyingKey === p.key}
                  onPress={() => buyPersona(p)}
                  icon={buyingKey === p.key ? null : <MiniIcon name="gem" size={14} color="#fff" />}
                  style={{ paddingVertical: 9, paddingHorizontal: 12, alignSelf: 'stretch' }}
                />
              )}
            </Card>
          ))}
        </View>


        {/* Ethic note — chơi vui, không móc túi */}
        <View style={s.ethic}>
          <MiniIcon name="shield" size={18} color={colors.mintDark} />
          <View style={{ flex: 1 }}>
            <Text style={s.ethicTitle}>Chơi vui, không móc túi</Text>
            <Text style={s.ethicTxt}>
              Purrbo luôn hiện tỉ lệ thật, không ép mua. Túi mù là gia vị — điều bạn nuôi được là một mối quan hệ có chiều sâu.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 18 },
  hi: { fontFamily: fonts.display, fontSize: 22, color: colors.ink },
  sub: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
  topupBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: colors.pink,
    borderRadius: radii.pill, paddingVertical: 7, paddingHorizontal: 12,
    borderBottomWidth: 3, borderBottomColor: colors.pinkDark,
  },
  topupTxt: { fontFamily: fonts.heading, fontSize: 13, color: '#fff' },
  seeAll: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#F1ECFB', borderRadius: radii.pill, paddingVertical: 5, paddingHorizontal: 11,
  },
  seeAllTxt: { fontFamily: fonts.heading, fontSize: 12, color: colors.purpleDark },
  dressCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 22,
    backgroundColor: '#EEE7FF', borderRadius: 20, padding: 14, borderWidth: 2, borderColor: '#fff', ...hardShadow(5, 0.14),
  },
  dressIc: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.purple, alignItems: 'center', justifyContent: 'center' },
  dressTitle: { fontFamily: fonts.display, fontSize: 16, color: colors.ink },
  dressSub: { fontFamily: fonts.body, fontSize: 11.5, color: colors.muted, marginTop: 1, lineHeight: 15 },

  feat: {
    borderRadius: 28, padding: 18, marginBottom: 22,
    borderWidth: 2, borderColor: '#fff', overflow: 'hidden', ...hardShadow(5, 0.14),
  },
  featTag: {
    alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#ffffff2e', borderColor: '#ffffff55', borderWidth: 1.5,
    borderRadius: radii.pill, paddingVertical: 4, paddingHorizontal: 10, marginBottom: 10,
  },
  featTagTxt: { fontFamily: fonts.heading, fontSize: 11, color: '#fff' },
  featTitle: { fontFamily: fonts.display, fontSize: 23, color: '#fff', marginBottom: 4 },
  featSub: { fontFamily: fonts.body, fontSize: 12.5, color: '#fff', opacity: 0.95, marginBottom: 14 },
  odds: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#ffffff26', borderColor: '#ffffff40', borderWidth: 1.5,
    borderRadius: 14, paddingVertical: 8, paddingHorizontal: 11, marginTop: 12,
  },
  oddsTxt: { flex: 1, fontFamily: fonts.body, fontSize: 11.5, color: '#fff', lineHeight: 17 },

  stitle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, marginHorizontal: 4 },
  stitleTxt: { fontFamily: fonts.display, fontSize: 17, color: colors.ink },
  stitleHint: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.muted },

  bagIc: { width: '100%', height: 88, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  bagName: { fontFamily: fonts.display, fontSize: 15, color: colors.ink },
  bagSub: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, marginTop: 2, marginBottom: 9, lineHeight: 16 },
  miniOdds: { fontFamily: fonts.body, fontSize: 11, color: colors.muted },
  bagPrice: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10 },
  bagPriceTxt: { fontFamily: fonts.display, fontSize: 15, color: colors.yellowDark },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 22 },
  pcard: { width: '47%', flexGrow: 1, alignItems: 'center', padding: 13 },
  pName: { fontFamily: fonts.display, fontSize: 15, color: colors.ink, marginTop: 9 },
  pSub: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, marginBottom: 10 },

  pkg: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff',
    borderWidth: 2, borderColor: colors.line, borderRadius: 22, padding: 13, marginBottom: 12, ...hardShadow(5, 0.14),
  },
  pkgIc: { width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center', ...hardShadow(3, 0.12) },
  pkgName: { fontFamily: fonts.heading, fontSize: 15, color: colors.ink, lineHeight: 19 },
  pkgSub: { fontFamily: fonts.body, fontSize: 11.5, color: colors.muted, lineHeight: 16, marginTop: 2 },
  pkgTag: {
    alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 7,
    backgroundColor: '#F1ECFB', borderRadius: radii.pill, paddingVertical: 3, paddingHorizontal: 9,
  },
  pkgTagTxt: { fontFamily: fonts.heading, fontSize: 10, color: colors.purpleDark },
  pkgPrice: { fontFamily: fonts.display, fontSize: 13, color: colors.yellowDark, marginTop: 8 },

  ethic: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 9,
    backgroundColor: '#EAF7F1', borderColor: '#CFEDE0', borderWidth: 2,
    borderRadius: 18, padding: 13, marginHorizontal: 4, marginTop: 2,
  },
  ethicTitle: { fontFamily: fonts.display, fontSize: 13, color: colors.mintDark },
  ethicTxt: { fontFamily: fonts.body, fontSize: 11.5, color: '#4E7767', lineHeight: 17, marginTop: 2 },

  reveal: {
    position: 'absolute', top: 12, left: '50%', zIndex: 50, width: 236,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderColor: '#fff', borderWidth: 2, borderRadius: 22,
    paddingVertical: 14, paddingHorizontal: 16, ...hardShadow(6, 0.22),
  },
});
