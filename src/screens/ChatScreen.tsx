import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View, Text, ScrollView, Pressable, TextInput, KeyboardAvoidingView,
  Platform, Animated, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { colors, fonts, radii, hardShadow, type AppColors } from '../theme';
import { useC, usePal } from '../themeContext';
import { Icon } from '../components/Icon';
import { PersonaFace } from '../components/PersonaFace';
import { personaCopy } from '../personaCopy';
import { personaTheme } from '../personaTheme';
import { Api } from '../api';

// Icon còn thiếu trong Icon.js → SVG inline tại chỗ (không sửa Icon.js).
function Glyph({ name, size = 20, color = colors.ink, stroke = 2.4 }) {
  const box = { width: size, height: size, viewBox: '0 0 24 24' };
  const p = { fill: 'none', stroke: color, strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'info':
      return <Svg {...box}><Circle {...p} cx="12" cy="12" r="9" /><Path {...p} d="M12 11v5M12 7.5v.01" /></Svg>;
    case 'plus-circle':
      return <Svg {...box}><Circle {...p} cx="12" cy="12" r="9" /><Path {...p} d="M12 8v8M8 12h8" /></Svg>;
    case 'mic':
      return <Svg {...box}><Rect {...p} x="9" y="3" width="6" height="11" rx="3" /><Path {...p} d="M5 11a7 7 0 0 0 14 0M12 18v3" /></Svg>;
    case 'send':
      return <Svg {...box}><Path {...p} d="M21 3 10.5 13.5M21 3l-6.5 18-4-8-8-4z" /></Svg>;
    case 'brain':
      return <Svg {...box}><Path {...p} d="M9 4a2.5 2.5 0 0 0-2.5 2.5A2.5 2.5 0 0 0 5 9c0 1 .5 1.8 1.3 2.3M9 4a2 2 0 0 1 3 1.7V19a2 2 0 0 1-3.5 1.3M15 4a2.5 2.5 0 0 1 2.5 2.5A2.5 2.5 0 0 1 19 9c0 1-.5 1.8-1.3 2.3M15 4a2 2 0 0 0-3 1.7" /></Svg>;
    default:
      return null;
  }
}

// Cuộc trò chuyện seed (GenZ, Mèo Mun)
const SEED = [
  { id: 1, who: 'them', text: 'Ê cưng ơi, 3 tiếng rồi chưa uống giọt nước nào đó 👀 định làm khô mực hả?' },
  { id: 2, who: 'me', text: 'Đang bận mà em huhu 😩' },
  { id: 3, who: 'them', text: 'Bận cũng phải sống chứ cưng ơi 🙄 làm một ly liền, em canh đó nha 💧' },
  { id: 4, who: 'them', text: 'Với lại...', mem: 'hôm qua cưng cũng hứa rồi nằm đó thôi 👀' },
  { id: 5, who: 'me', text: 'Ok ok uống liền đây nè 🥲' },
  { id: 6, who: 'them', text: 'Ừ đó, ngoan xỉu 😍 cưng của em đảm ghê chưa, thương cái nết này nhất nhà 💗' },
  { id: 7, who: 'me', text: 'Thương em á' },
  { id: 8, who: 'them', text: 'Ơ kìa thính bay đầy trời 🫨 nhưng mà... em cũng thương cưng nhất quả đất luôn đó, biết chưa 😽' },
];

const REPLIES = [
  'Hí hí biết ngay cưng sẽ nghe lời em mà 😽 ngoan là được cưng nhất 💗',
  'Cà khịa xíu thôi chứ em thương cưng xỉu luôn á 🥹',
  'Ừ đó, giữ phong độ này nha, +5 thân thiết cho cưng chăm chỉ 💫',
  'Trời ơi nói nghe thương ghê 😳 tối nay em kể chuyện cho cưng ngủ nha?',
  'Được lời như cởi tấm lòng 🐾 mai nhớ uống đủ nước nữa đó, em canh!',
];

const CHIPS = [
  { label: 'Uống rồi nè 💧', reply: 'Đó mới ngoan chứ! Uống nước đều là da đẹp, cưng của em xinh nhất nhà 💗' },
  { label: 'Lười quá à', reply: 'Lười gì mà lười 🙄 dậy nhúc nhích chút coi, em không cho phép cưng làm khô mực đâu nha!' },
  { label: 'Thương em', reply: 'Ơ thính đâu ra lắm thế 🫠 nhưng mà em cũng thương cưng nhất quả đất luôn đó 😽' },
];

function HeaderBtn({ name, onPress }) {
  const c = useC();
  const pal = usePal();
  const s = useMemo(() => mkStyles(c, pal), [c, pal]);
  const [down, setDown] = useState(false);
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setDown(true)}
      onPressOut={() => setDown(false)}
      style={[s.iconBtn, { transform: [{ translateY: down ? 2 : 0 }] }]}
    >
      {name === 'back'
        ? <Icon name="back" size={21} color={colors.ink} />
        : <Glyph name={name} size={20} color={colors.ink} />}
    </Pressable>
  );
}

function TypingDots() {
  const anims = useRef([0, 1, 2].map(() => new Animated.Value(0.4))).current;
  useEffect(() => {
    const loops = anims.map((v, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 160),
          Animated.timing(v, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(v, { toValue: 0.4, duration: 500, useNativeDriver: true }),
          Animated.delay((2 - i) * 160),
        ])
      )
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [anims]);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 2 }}>
      {anims.map((v, i) => (
        <Animated.View key={i} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.muted, opacity: v }} />
      ))}
    </View>
  );
}

function QuickChip({ label, onPress }) {
  const c = useC();
  const pal = usePal();
  const s = useMemo(() => mkStyles(c, pal), [c, pal]);
  const [down, setDown] = useState(false);
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setDown(true)}
      onPressOut={() => setDown(false)}
      style={[s.chip, { transform: [{ translateY: down ? 2 : 0 }] }]}
    >
      <Text style={s.chipTxt}>{label}</Text>
    </Pressable>
  );
}

function SendBtn({ onPress }) {
  const c = useC();
  const pal = usePal();
  const s = useMemo(() => mkStyles(c, pal), [c, pal]);
  const [down, setDown] = useState(false);
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setDown(true)}
      onPressOut={() => setDown(false)}
      style={[s.send, {
        borderBottomWidth: down ? 1 : 4,
        transform: [{ translateY: down ? 3 : 0 }],
      }]}
    >
      <Glyph name="send" size={20} color="#fff" />
    </Pressable>
  );
}

export default function ChatScreen({ navigation, route }) {
  const c = useC();
  const pal = usePal();
  const s = useMemo(() => mkStyles(c, pal), [c, pal]);
  const [msgs, setMsgs] = useState<any[]>([]);
  const [text, setText] = useState('');
  const dnow = new Date();
  const dateLabel = `${String(dnow.getDate()).padStart(2, '0')}/${String(dnow.getMonth() + 1).padStart(2, '0')}`;
  const [typing, setTyping] = useState(false);
  // Persona đang nhắn — từ param (chọn ở hồ sơ) hoặc persona đang active.
  const [persona, setPersona] = useState(
    route?.params?.persona || { key: 'mun', name: 'Mun', variant: 'mun', level: 1 }
  );
  const listRef = useRef(null);
  const idRef = useRef(100);
  const replyIx = useRef(0);
  const timer = useRef(null);
  // Chỉ nạp lịch sử SAU khi biết chắc persona (tránh nạp 2 lần + nháy lời chào mun).
  const [ready, setReady] = useState(!!route?.params?.persona?.key);

  // Xác định persona: param → dùng luôn (và set active để backend trả đúng giọng);
  // không có param → lấy persona đang active từ backend.
  useEffect(() => {
    (async () => {
      const p = route?.params?.persona;
      if (p?.key) {
        setPersona(p);
        try { await Api.setPersona(p.key); } catch {}
        return;
      }
      try {
        const [st, cat] = await Promise.all([Api.state(), Api.personas()]);
        const active = Array.isArray(cat) ? cat.find((x) => x.key === st.persona_key) : null;
        if (active) setPersona({ ...active, level: st.affinity_level });
      } catch {}
      finally { setReady(true); }
    })();
  }, []);

  const scrollDown = () => {
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  };
  useEffect(() => { scrollDown(); }, [msgs, typing]);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  // Nạp lịch sử chat thật mỗi khi mở màn / ĐỔI persona. Trống → lời chào của persona.
  const greet = () => [{ id: 1, who: 'them', text: personaCopy(persona.variant).greet }];
  useEffect(() => {
    if (!ready) return;
    let alive = true;
    (async () => {
      try {
        const hist = await Api.chatHistory();
        if (!alive) return;
        if (Array.isArray(hist) && hist.length > 0) {
          const mapped = hist.map((h, i) => ({ id: i + 1, who: h.role === 'user' ? 'me' : 'them', text: h.text }));
          idRef.current = mapped.length + 100;
          setMsgs(mapped);
        } else {
          setMsgs(greet());
        }
        scrollDown();
      } catch {
        if (alive) setMsgs(greet());
      }
    })();
    return () => { alive = false; };
  }, [persona.key, ready]);

  const push = (who, t, extra = {}) => {
    idRef.current += 1;
    setMsgs((m) => [...m, { id: idRef.current, who, text: t, ...extra }]);
  };

  const personaReply = (customReply) => {
    setTyping(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setTyping(false);
      let r = customReply;
      if (!r) { r = REPLIES[replyIx.current % REPLIES.length]; replyIx.current += 1; }
      push('them', r);
    }, 1100);
  };

  const sendUser = async (t, customReply) => {
    const val = (t || '').trim();
    if (!val) return;
    push('me', val);
    if (customReply) { personaReply(customReply); return; }  // quick-reply chip → câu mẫu tức thì
    setTyping(true);                                         // tin gõ tay → hỏi backend (persona sinh thoại)
    try {
      const r = await Api.sendChat(val);
      setTyping(false);
      push('them', r.reply);
    } catch {
      setTyping(false);
      push('them', REPLIES[replyIx.current % REPLIES.length]);
      replyIx.current += 1;
    }
  };

  const onSend = () => { sendUser(text); setText(''); };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={[s.header, { backgroundColor: personaTheme(persona.variant).surface }]}>
          <HeaderBtn name="back" onPress={() => navigation?.goBack?.()} />
          <View style={s.who}>
            <PersonaFace variant={persona.variant} size={42} ring={persona.rarity === 'SSR' ? 'ssr' : undefined} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={s.whoName} numberOfLines={1}>{persona.name}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <View style={s.onlineDot} />
                <Text style={s.whoSub}>đang online · Lv.{persona.level ?? 1}</Text>
              </View>
            </View>
          </View>
          <HeaderBtn name="info" onPress={() => navigation?.navigate?.('PersonaDetail', { persona })} />
        </View>

        {/* Messages */}
        <ScrollView
          ref={listRef}
          style={{ flex: 1 }}
          contentContainerStyle={s.msgs}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollDown}
        >
          <View style={s.dayPill}>
            <Text style={s.dayPillTxt}>Hôm nay · {dateLabel}</Text>
          </View>

          {msgs.map((m) =>
            m.who === 'them' ? (
              <View key={m.id} style={[s.row, s.rowLeft]}>
                <PersonaFace variant={persona.variant} size={30} />
                <View style={s.bubbleThem}>
                  {!!m.mem && (
                    <View style={s.memTag}>
                      <Glyph name="brain" size={12} color={c.purpleDark} />
                      <Text style={s.memTxt}>Purrbo nhớ: {m.mem}</Text>
                    </View>
                  )}
                  <Text style={s.txtThem}>{m.text}</Text>
                </View>
              </View>
            ) : (
              <View key={m.id} style={[s.row, s.rowRight]}>
                <View style={s.bubbleMe}>
                  <Text style={s.txtMe}>{m.text}</Text>
                </View>
              </View>
            )
          )}

          {typing && (
            <View style={[s.row, s.rowLeft]}>
              <PersonaFace variant={persona.variant} size={30} />
              <View style={[s.bubbleThem, { paddingVertical: 13 }]}>
                <TypingDots />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Quick reply chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={s.chipsWrap}
          contentContainerStyle={s.chips}
        >
          {CHIPS.map((c, i) => (
            <QuickChip key={i} label={c.label} onPress={() => sendUser(c.label)} />
          ))}
        </ScrollView>

        {/* Input bar */}
        <View style={s.inbar}>
          <View style={[s.field, { paddingLeft: 14 }]}>
            <TextInput
              style={s.input}
              value={text}
              onChangeText={setText}
              onSubmitEditing={onSend}
              returnKeyType="send"
              blurOnSubmit={false}
              placeholder={`Nhắn cho ${persona.name}…`}
              placeholderTextColor={colors.muted}
            />
          </View>
          <SendBtn onPress={onSend} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const mkStyles = (c: AppColors, pal: any) => StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    backgroundColor: pal.soft, borderBottomWidth: 2, borderBottomColor: '#fff',
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 14, backgroundColor: '#fff',
    borderWidth: 2, borderColor: '#fff', alignItems: 'center', justifyContent: 'center',
    ...hardShadow(3, 0.12),
  },
  who: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 10 },
  whoName: { fontFamily: fonts.display, fontSize: 17, color: colors.ink },
  whoSub: { fontFamily: fonts.heading, fontSize: 12, color: c.purpleDark },
  onlineDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: c.mint,
    borderWidth: 2, borderColor: pal.surface,
  },

  msgs: { padding: 14, paddingBottom: 8, gap: 10 },
  dayPill: {
    alignSelf: 'center', backgroundColor: '#fff', borderRadius: radii.pill,
    paddingVertical: 4, paddingHorizontal: 12, marginBottom: 4, ...hardShadow(3, 0.12),
  },
  dayPillTxt: { fontFamily: fonts.heading, fontSize: 11, color: colors.muted },

  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, maxWidth: '100%' },
  rowLeft: { justifyContent: 'flex-start' },
  rowRight: { justifyContent: 'flex-end' },

  bubbleThem: {
    maxWidth: '78%', backgroundColor: '#fff', borderWidth: 2, borderColor: '#fff',
    borderRadius: 18, borderBottomLeftRadius: 6, paddingVertical: 11, paddingHorizontal: 14,
    ...hardShadow(3, 0.12),
  },
  txtThem: { fontFamily: fonts.body, fontSize: 14, color: colors.ink, lineHeight: 21 },
  bubbleMe: {
    maxWidth: '78%', backgroundColor: c.pink, borderWidth: 2, borderColor: c.pink,
    borderRadius: 18, borderBottomRightRadius: 6, paddingVertical: 11, paddingHorizontal: 14,
    borderBottomWidth: 2, borderBottomColor: c.pinkDark,
    ...hardShadow(3, 0.12),
  },
  txtMe: { fontFamily: fonts.body, fontSize: 14, color: '#fff', lineHeight: 21 },

  memTag: {
    flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start',
    backgroundColor: pal.soft, borderWidth: 1.5, borderColor: pal.surface,
    borderRadius: radii.pill, paddingVertical: 3, paddingHorizontal: 9, marginBottom: 7,
  },
  memTxt: { fontFamily: fonts.heading, fontSize: 10.5, color: c.purpleDark },

  chipsWrap: { flexGrow: 0, flexShrink: 0, backgroundColor: '#fff' },
  chips: { gap: 8, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center' },
  chip: {
    backgroundColor: '#fff', borderWidth: 2, borderColor: pal.surface,
    borderRadius: radii.pill, paddingVertical: 8, paddingHorizontal: 13, ...hardShadow(3, 0.12),
  },
  chipTxt: { fontFamily: fonts.heading, fontSize: 13, color: c.pinkDark },

  inbar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingTop: 8, paddingBottom: 12,
    backgroundColor: '#fff', borderTopWidth: 2, borderTopColor: colors.line,
  },
  field: {
    flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.bg, borderWidth: 2, borderColor: colors.line,
    borderRadius: radii.pill, paddingLeft: 12, paddingRight: 4, paddingVertical: 3,
  },
  mini: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  input: {
    flex: 1, minWidth: 0, fontFamily: fonts.body, fontSize: 14, color: colors.ink,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
  },
  send: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: c.pink,
    alignItems: 'center', justifyContent: 'center',
    borderBottomWidth: 4, borderBottomColor: c.pinkDark,
  },
});
