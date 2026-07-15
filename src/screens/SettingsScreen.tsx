import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, Switch, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { colors, fonts, radii, hardShadow } from '../theme';
import { Api } from '../api';
import { useAuth } from '../auth';
import { ensureNotifPermission, sendTestNotification } from '../notifications';
import { getGcalToken, setGcalToken, GOOGLE_CLIENT_ID, getLarkToken, setLarkToken, LARK_APP_ID } from '../googleCalendar';
import { isSfxOn, isBgOn, setSfx, setBg } from '../sound';
import GcalConnectButton from './GcalConnectButton';
import { Icon } from '../components/Icon';
import { PersonaFace } from '../components/PersonaFace';
import { Card, Bubble } from '../components/ui';

const SW_KEY = 'purrbo.settings.switches';

// Icon phụ (không có trong Icon.js) — inline SVG, KHÔNG sửa Icon.js.
function MiniIcon({ name, size = 20, color = colors.ink, stroke = 2.4 }) {
  const box = { width: size, height: size, viewBox: '0 0 24 24' };
  const p = { fill: 'none', stroke: color, strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'chevron': return <Svg {...box}><Path {...p} d="M9 6l6 6-6 6" /></Svg>;
    case 'bell': return <Svg {...box}><Path {...p} d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><Path {...p} d="M13.7 21a2 2 0 0 1-3.4 0" /></Svg>;
    case 'globe': return <Svg {...box}><Circle {...p} cx="12" cy="12" r="9" /><Path {...p} d="M3 12h18M12 3c2.5 2.5 3.5 6 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-6-3.5-9s1-6.5 3.5-9z" /></Svg>;
    case 'moon': return <Svg {...box}><Path {...p} d="M20 14A8 8 0 0 1 10 4a7 7 0 1 0 10 10z" /></Svg>;
    case 'lock': return <Svg {...box}><Rect {...p} x="4.5" y="10" width="15" height="10" rx="2.5" /><Path {...p} d="M8 10V7a4 4 0 0 1 8 0v3" /></Svg>;
    case 'shield': return <Svg {...box}><Path {...p} d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" /></Svg>;
    case 'sliders': return <Svg {...box}><Path {...p} d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" /></Svg>;
    default: return null;
  }
}

// Bong bóng preview đổi theo "Độ lầy"
const LAY_MSG = {
  0: 'Uống ngụm nước nha cưng 💗',
  1: 'Uống nước đi cưng ơi 👀',
  2: 'Uống nước! Nhanh! 😤',
};
const LAY_MOOD = { 0: 'dịu dàng', 1: 'cà khịa', 2: 'gắt cháy' };

// Selector dạng pill (thay slider) — chọn = pill màu ink
function Segmented({ options, value, onChange }) {
  return (
    <View style={s.seg}>
      {options.map((opt, i) => {
        const on = value === i;
        return (
          <Pressable key={opt} onPress={() => onChange(i)} style={[s.segItem, on && s.segItemOn]}>
            <Text style={[s.segTxt, on && s.segTxtOn]}>{opt}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function ControlRow({ icon, mini, iconBg, iconCol, label, options, value, onChange, last }) {
  return (
    <View style={{ marginBottom: last ? 0 : 18 }}>
      <View style={s.ctrlHead}>
        <View style={[s.miniIc, { backgroundColor: iconBg }]}>
          {mini ? <MiniIcon name={icon} size={15} color={iconCol} /> : <Icon name={icon} size={15} color={iconCol} />}
        </View>
        <Text style={s.ctrlLabel}>{label}</Text>
      </View>
      <Segmented options={options} value={value} onChange={onChange} />
    </View>
  );
}

function SwitchRow({ icon, mini, iconBg, iconCol, title, sub, value, onValueChange, last }) {
  return (
    <View style={[s.row, last && { borderBottomWidth: 0, paddingBottom: 2 }]}>
      <View style={[s.rowIc, { backgroundColor: iconBg }]}>
        {mini ? <MiniIcon name={icon} size={20} color={iconCol} /> : <Icon name={icon} size={20} color={iconCol} />}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.rowTitle}>{title}</Text>
        <Text style={s.rowSub}>{sub}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#E4DCEE', true: colors.pink }}
        thumbColor="#fff"
        ios_backgroundColor="#E4DCEE"
      />
    </View>
  );
}

function NavRow({ icon, mini, iconBg, iconCol, title, sub, onPress, last }) {
  return (
    <Pressable onPress={onPress} style={[s.row, last && { borderBottomWidth: 0, paddingBottom: 2 }]}>
      <View style={[s.rowIc, { backgroundColor: iconBg }]}>
        {mini ? <MiniIcon name={icon} size={20} color={iconCol} /> : <Icon name={icon} size={20} color={iconCol} />}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.rowTitle}>{title}</Text>
        <Text style={s.rowSub}>{sub}</Text>
      </View>
      <MiniIcon name="chevron" size={20} color={colors.muted} />
    </Pressable>
  );
}

function SectionTitle({ icon, mini, bg, col, children }) {
  return (
    <View style={s.stitle}>
      <View style={[s.sic, { backgroundColor: bg }]}>
        {mini ? <MiniIcon name={icon} size={16} color={col} /> : <Icon name={icon} size={16} color={col} />}
      </View>
      <Text style={s.stitleTxt}>{children}</Text>
    </View>
  );
}

export default function SettingsScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [intimacy, setIntimacy] = useState(1); // nhẹ / vừa / đắm
  const [lay, setLay] = useState(1);           // dịu / vừa / gắt
  const [freq, setFreq] = useState(1);          // ít / vừa / nhiều

  const [thinh, setThinh] = useState(true);
  const [adult, setAdult] = useState(false);
  const [quiet, setQuiet] = useState(true);
  const [gcalOn, setGcalOn] = useState(false);
  const [sfx, setSfxState] = useState(isSfxOn());
  const [bgm, setBgmState] = useState(isBgOn());

  const [pVariant, setPVariant] = useState('mun');  // persona active cho preview
  const [pName, setPName] = useState('Bạn đồng hành');
  const onSfx = (v: boolean) => { setSfxState(v); setSfx(v); };
  const onBgm = (v: boolean) => { setBgmState(v); setBg(v); };

  // Khởi tạo 3 selector từ backend khi mở màn hình. Backend die → giữ state mặc định.
  useEffect(() => {
    (async () => {
      try {
        const st = await Api.state();
        if (typeof st?.intimacy === 'number') setIntimacy(st.intimacy);
        if (typeof st?.lay === 'number') setLay(st.lay);
        if (typeof st?.freq === 'number') setFreq(st.freq);
        try { const cat = await Api.personas(); const a = Array.isArray(cat) ? cat.find((x: any) => x.key === st.persona_key) : null; if (a?.variant) setPVariant(a.variant); if (a?.name) setPName(a.name); } catch {}
      } catch {
        // backend không kết nối được → giữ nguyên state cục bộ
      }
      // 3 switch: lưu cục bộ (AsyncStorage) cho khỏi mất khi mở lại
      try {
        const raw = await AsyncStorage.getItem(SW_KEY);
        if (raw) {
          const sw = JSON.parse(raw);
          if (typeof sw.thinh === 'boolean') setThinh(sw.thinh);
          if (typeof sw.adult === 'boolean') setAdult(sw.adult);
          if (typeof sw.quiet === 'boolean') setQuiet(sw.quiet);
        }
      } catch {}
    })();
  }, []);

  const [larkOn, setLarkOn] = useState(false);

  // Trạng thái kết nối lịch — cập nhật lại mỗi lần vào màn.
  useFocusEffect(
    useCallback(() => {
      getGcalToken().then((t) => setGcalOn(!!t));
      getLarkToken().then((t) => setLarkOn(!!t));
    }, [])
  );

  const larkAction = () => {
    if (larkOn) {
      Alert.alert('Ngắt Lark Calendar?', 'Purrbo sẽ ngừng hiện lịch từ Lark.', [
        { text: 'Thôi', style: 'cancel' },
        { text: 'Ngắt', style: 'destructive', onPress: async () => { await setLarkToken(null); setLarkOn(false); } },
      ]);
    } else if (LARK_APP_ID) {
      // OAuth Lark cần redirect qua server → mở sau khi có domain + Lark app.
      Alert.alert('Lark Calendar', 'Kết nối Lark cần đăng nhập qua trình duyệt (sắp bật khi có domain).');
    } else {
      Alert.alert('Lark Calendar', 'Cần cấu hình EXPO_PUBLIC_LARK_APP_ID để bật đồng bộ Lark.');
    }
  };

  const saveSwitch = (patch: Record<string, boolean>) => {
    (async () => {
      try {
        const next = { thinh, adult, quiet, ...patch };
        await AsyncStorage.setItem(SW_KEY, JSON.stringify(next));
      } catch {}
    })();
  };
  const onThinh = (v: boolean) => { setThinh(v); saveSwitch({ thinh: v }); };
  const onAdult = (v: boolean) => { setAdult(v); saveSwitch({ adult: v }); };
  const onQuiet = (v: boolean) => { setQuiet(v); saveSwitch({ quiet: v }); };

  const onNotif = async () => {
    const ok = await ensureNotifPermission();
    if (!ok) {
      Alert.alert('Chưa bật thông báo', 'Vào Cài đặt hệ thống → cho phép Purrbo gửi thông báo nha.');
      return;
    }
    Alert.alert('Thông báo đang bật 🔔', 'Gửi một thông báo thử sau 3 giây nhé?', [
      { text: 'Thôi', style: 'cancel' },
      { text: 'Gửi thử', onPress: () => sendTestNotification() },
    ]);
  };

  const disconnectGcal = () => {
    Alert.alert('Ngắt Google Calendar?', 'Purrbo sẽ ngừng hiện lịch từ Google.', [
      { text: 'Thôi', style: 'cancel' },
      {
        text: 'Ngắt',
        style: 'destructive',
        onPress: async () => { await setGcalToken(null); setGcalOn(false); },
      },
    ]);
  };

  const onLogout = () => {
    Alert.alert('Đăng xuất?', 'Cưng sẽ về màn nhập tên. Dữ liệu vẫn còn khi đăng nhập lại.', [
      { text: 'Ở lại', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: () => logout() },
    ]);
  };

  // Đổi selector: cập nhật state cục bộ ngay (preview phản ứng liền) + lưu backend field đã đổi.
  const changeIntimacy = (v: number) => {
    setIntimacy(v);
    (async () => { try { await Api.updateSettings({ intimacy: v }); } catch {} })();
  };
  const changeLay = (v: number) => {
    setLay(v);
    (async () => { try { await Api.updateSettings({ lay: v }); } catch {} })();
  };
  const changeFreq = (v: number) => {
    setFreq(v);
    (async () => { try { await Api.updateSettings({ freq: v }); } catch {} })();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.top}>
          <Pressable onPress={() => navigation.goBack()} style={s.back}>
            <Icon name="back" size={22} color={colors.ink} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={s.hi}>Cài đặt</Text>
            <Text style={s.sub}>chỉnh cách bạn đồng hành nhắn cho cưng</Text>
          </View>
        </View>

        {/* Live preview */}
        <View style={s.preview}>
          <View style={s.moodtag}>
            <Icon name="flame" size={12} color={colors.purpleDark} />
            <Text style={s.moodtagTxt}>Mood: {LAY_MOOD[lay]}</Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <PersonaFace variant={pVariant} ring="ssr" size={54} expr={lay === 0 ? 'love' : lay === 2 ? 'gat' : 'happy'} />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontFamily: fonts.display, fontSize: 19, color: colors.ink }}>{pName}</Text>
                <View style={s.ssr}>
                  <Icon name="star" size={9} color="#fff" />
                  <Text style={{ fontFamily: fonts.heading, fontSize: 10, color: '#fff' }}>SSR</Text>
                </View>
              </View>
              <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.muted }}>xem trước · giọng sẽ nói như vầy nè</Text>
            </View>
          </View>

          <Bubble text={LAY_MSG[lay]} />

          <View style={s.previewHint}>
            <Icon name="sparkles" size={13} color={colors.purpleDark} />
            <Text style={s.previewHintTxt}>Chọn "Độ lầy" bên dưới, em đổi giọng liền cho coi</Text>
          </View>
        </View>

        {/* Tính cách bạn đồng hành */}
        <SectionTitle icon="sliders" mini bg="#FFEAF2" col={colors.pinkDark}>Tính cách bạn đồng hành</SectionTitle>
        <Card style={{ marginBottom: 22 }}>
          <ControlRow icon="heart" iconBg="#FFEAF2" iconCol={colors.pinkDark}
            label="Độ thân mật" options={['nhẹ', 'vừa', 'đắm']} value={intimacy} onChange={changeIntimacy} />
          <ControlRow icon="flame" iconBg="#FFF0E6" iconCol={colors.coralDark}
            label="Độ lầy" options={['dịu', 'vừa', 'gắt']} value={lay} onChange={changeLay} />
          <ControlRow icon="bell" mini iconBg="#EEE7FF" iconCol={colors.purpleDark}
            label="Tần suất nhắc" options={['ít', 'vừa', 'nhiều']} value={freq} onChange={changeFreq} last />
        </Card>

        {/* Ranh giới */}
        <SectionTitle icon="shield" mini bg="#EEE7FF" col={colors.purpleDark}>Ranh giới</SectionTitle>
        <Card style={{ marginBottom: 22 }}>
          <SwitchRow icon="heart" iconBg="#FFEAF2" iconCol={colors.pinkDark}
            title="Cho phép thả thính" sub="để em buông lời ngọt xỉu"
            value={thinh} onValueChange={onThinh} />
          <SwitchRow icon="lock" mini iconBg="#FFF0E6" iconCol={colors.coralDark}
            title="Chế độ 18+" sub="chặn nếu cưng chưa đủ tuổi"
            value={adult} onValueChange={onAdult} />
          <SwitchRow icon="moon" mini iconBg="#EEE7FF" iconCol={colors.purpleDark}
            title="Yên tĩnh ban đêm" sub="22h–7h em im ru cho cưng ngủ"
            value={quiet} onValueChange={onQuiet} last />
        </Card>

        {/* Âm thanh */}
        <SectionTitle icon="bell" mini bg="#FFF7E0" col={colors.yellowDark}>Âm thanh</SectionTitle>
        <Card style={{ marginBottom: 22 }}>
          <SwitchRow icon="bell" mini iconBg="#FFF7E0" iconCol={colors.yellowDark}
            title="Nhạc nền" sub="giai điệu êm khi mở app"
            value={bgm} onValueChange={onBgm} />
          <SwitchRow icon="sparkles" iconBg="#EEE7FF" iconCol={colors.purpleDark}
            title="Hiệu ứng & rung" sub="tiếng khi chạm nút, khoe, mở túi"
            value={sfx} onValueChange={onSfx} last />
        </Card>

        {/* Đồng bộ lịch */}
        <SectionTitle icon="calendar" bg="#E6F7FF" col={colors.skyDark}>Đồng bộ lịch</SectionTitle>
        <Card style={{ marginBottom: 22 }}>
          <View style={[s.row, { borderBottomWidth: 0, paddingBottom: gcalOn ? 11 : 12 }]}>
            <View style={[s.rowIc, { backgroundColor: '#E6F7FF' }]}>
              <Icon name="calendar" size={20} color={colors.skyDark} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.rowTitle}>Google Calendar</Text>
              <Text style={s.rowSub}>{gcalOn ? 'đã kết nối · đang hiện lịch' : 'kéo lịch thật của cưng vào Purrbo'}</Text>
            </View>
            {gcalOn && (
              <View style={s.okPill}>
                <Icon name="check" size={12} color={colors.mintDark} />
                <Text style={s.okPillTxt}>bật</Text>
              </View>
            )}
          </View>
          {gcalOn ? (
            <Pressable onPress={disconnectGcal} style={s.disconnect}>
              <Text style={s.disconnectTxt}>Ngắt kết nối</Text>
            </Pressable>
          ) : GOOGLE_CLIENT_ID ? (
            <GcalConnectButton clientId={GOOGLE_CLIENT_ID} onConnected={() => setGcalOn(true)} />
          ) : (
            <View style={s.cfgNote}>
              <Icon name="info" size={14} color={colors.coralDark} />
              <Text style={s.cfgNoteTxt}>
                Cần cấu hình EXPO_PUBLIC_GOOGLE_CLIENT_ID để bật đồng bộ Google Calendar.
              </Text>
            </View>
          )}

          {/* Lark (Feishu) */}
          <View style={{ height: 2, backgroundColor: colors.line, marginVertical: 12 }} />
          <Pressable onPress={larkAction} style={[s.row, { borderBottomWidth: 0, paddingVertical: 4 }]}>
            <View style={[s.rowIc, { backgroundColor: '#EAF7F1' }]}>
              <Icon name="calendar" size={20} color={colors.mintDark} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.rowTitle}>Lark Calendar</Text>
              <Text style={s.rowSub}>{larkOn ? 'đã kết nối · đang hiện lịch' : 'đồng bộ lịch Lark / Feishu'}</Text>
            </View>
            {larkOn ? (
              <View style={s.okPill}>
                <Icon name="check" size={12} color={colors.mintDark} />
                <Text style={s.okPillTxt}>bật</Text>
              </View>
            ) : (
              <MiniIcon name="chevron" size={20} color={colors.muted} />
            )}
          </Pressable>
        </Card>

        {/* Khác */}
        <SectionTitle icon="sliders" mini bg="#E6F7FF" col={colors.skyDark}>Khác</SectionTitle>
        <Card style={{ marginBottom: 16 }}>
          <NavRow icon="bell" mini iconBg="#FFEAF2" iconCol={colors.pinkDark}
            title="Thông báo" sub="nhắc lịch đúng giờ" onPress={onNotif} />
          <NavRow icon="globe" mini iconBg="#EAF7F1" iconCol={colors.mintDark}
            title="Ngôn ngữ" sub="Tiếng Việt" onPress={() => Alert.alert('Ngôn ngữ', 'Hiện Purrbo chỉ có Tiếng Việt 🇻🇳 — thêm ngôn ngữ khác ở bản sau nha.')} />
          <NavRow icon="user" iconBg="#EEE7FF" iconCol={colors.purpleDark}
            title="Tài khoản" sub={user?.email || user?.name || 'Khách'} onPress={onLogout} last />
        </Card>

        <Pressable onPress={onLogout} style={{ alignSelf: 'center', padding: 8 }}>
          <Text style={s.logout}>Đăng xuất</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  back: {
    width: 42, height: 42, borderRadius: 14, backgroundColor: '#fff',
    borderWidth: 2, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', ...hardShadow(3, 0.12),
  },
  hi: { fontFamily: fonts.display, fontSize: 22, color: colors.ink },
  sub: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },

  preview: {
    backgroundColor: '#F6ECFB', borderRadius: 28, padding: 18, marginBottom: 22,
    borderWidth: 2, borderColor: '#fff', ...hardShadow(5, 0.14),
  },
  moodtag: {
    position: 'absolute', top: 14, right: 14, flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#fff', paddingVertical: 5, paddingHorizontal: 10, borderRadius: radii.pill, ...hardShadow(3, 0.12),
  },
  moodtagTxt: { fontFamily: fonts.heading, fontSize: 12, color: colors.purpleDark },
  ssr: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: colors.pink, borderRadius: radii.pill, paddingVertical: 2, paddingHorizontal: 8 },
  previewHint: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10 },
  previewHintTxt: { fontFamily: fonts.heading, fontSize: 11, color: colors.purpleDark },

  stitle: { flexDirection: 'row', alignItems: 'center', gap: 7, marginHorizontal: 4, marginBottom: 12 },
  sic: { width: 26, height: 26, borderRadius: 9, alignItems: 'center', justifyContent: 'center', ...hardShadow(3, 0.12) },
  stitleTxt: { fontFamily: fonts.display, fontSize: 17, color: colors.ink },

  ctrlHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 9 },
  miniIc: { width: 26, height: 26, borderRadius: 9, alignItems: 'center', justifyContent: 'center', ...hardShadow(3, 0.12) },
  ctrlLabel: { fontFamily: fonts.heading, fontSize: 14, color: colors.ink },

  seg: {
    flexDirection: 'row', gap: 6, backgroundColor: '#F0EAF6',
    borderRadius: radii.pill, padding: 4, borderWidth: 2, borderColor: colors.line,
  },
  segItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 9, borderRadius: radii.pill },
  segItemOn: { backgroundColor: colors.ink, ...hardShadow(3, 0.14) },
  segTxt: { fontFamily: fonts.heading, fontSize: 14, color: colors.muted },
  segTxtOn: { color: '#fff' },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11,
    borderBottomWidth: 2, borderBottomColor: colors.line,
  },
  rowIc: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center', ...hardShadow(3, 0.12) },
  rowTitle: { fontFamily: fonts.heading, fontSize: 14, color: colors.ink },
  rowSub: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },

  okPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#EAF7F1', borderColor: '#CFEDE0', borderWidth: 2,
    borderRadius: radii.pill, paddingVertical: 4, paddingHorizontal: 9,
  },
  okPillTxt: { fontFamily: fonts.heading, fontSize: 11, color: colors.mintDark },
  disconnect: { alignSelf: 'center', paddingVertical: 6, paddingHorizontal: 12, marginTop: 4 },
  disconnectTxt: { fontFamily: fonts.heading, fontSize: 13, color: colors.coralDark },
  cfgNote: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 4,
    backgroundColor: '#FFF6F1', borderColor: '#FFD9C7', borderWidth: 2, borderRadius: 14, padding: 11,
  },
  cfgNoteTxt: { flex: 1, fontFamily: fonts.body, fontSize: 12, color: colors.coralDark, lineHeight: 17 },
  logout: { fontFamily: fonts.heading, fontSize: 14, color: colors.muted },
});
