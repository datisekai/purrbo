import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Circle, Ellipse, G, Rect } from 'react-native-svg';
import { hardShadow } from '../theme';

// Cấu hình từng persona: màu + tai + MẮT + MIỆNG (cá tính riêng) + phụ kiện.
// ear: cat|bear|bunny|fox|dog · eye: round|sparkle|tsun|sharp|big|sleepy|happy|wide
// mouth: smile|smug|smirk|flat|uwu|grin|tongue · blush: má hồng đậm
const VARIANTS = {
  mun:   { c: '#6B6480', ear: 'cat',   eye: 'tsun',    mouth: 'smug' },                 // tsundere
  cam:   { c: '#FF9E4D', ear: 'cat',   eye: 'sparkle', mouth: 'smile', blush: true },   // Mochi soft
  ly:    { c: '#E8743B', ear: 'fox',   eye: 'sharp',   mouth: 'smirk' },                // bad-boy
  sep:   { c: '#8B7BB0', ear: 'cat',   glasses: true,  mouth: 'flat' },                 // tổng tài
  bong:  { c: '#F4A6C0', ear: 'bunny', eye: 'big',     mouth: 'uwu',   blush: true },   // uwu
  xu:    { c: '#34D399', ear: 'cat',   antenna: true,  eye: 'wide',    mouth: 'grin' }, // hype
  bo:    { c: '#7FB77E', ear: 'bear',  eye: 'sleepy',  mouth: 'smile' },                // chill
  sin:   { c: '#E8B04B', ear: 'dog',   eye: 'happy',   mouth: 'tongue' },               // shiba
  // alias tương thích dữ liệu cũ
  gau:   { c: '#C98A5E', ear: 'bear',  eye: 'round',   mouth: 'smile' },
  tong:  { c: '#8B5CF6', ear: 'cat',   glasses: true,  mouth: 'flat' },
};

function Ears({ ear, c }) {
  switch (ear) {
    case 'bear':
      return <G><Circle cx="20" cy="18" r="8" fill={c} stroke="#2E2A3F" strokeWidth="2.5" /><Circle cx="44" cy="18" r="8" fill={c} stroke="#2E2A3F" strokeWidth="2.5" /></G>;
    case 'bunny':
      return <G><Ellipse cx="24" cy="12" rx="5" ry="13" fill={c} stroke="#2E2A3F" strokeWidth="2.5" /><Ellipse cx="40" cy="12" rx="5" ry="13" fill={c} stroke="#2E2A3F" strokeWidth="2.5" /></G>;
    case 'fox':
      return <G><Path d="M15 22 L18 5 L31 17 Z" fill={c} stroke="#2E2A3F" strokeWidth="2.5" strokeLinejoin="round" /><Path d="M49 22 L46 5 L33 17 Z" fill={c} stroke="#2E2A3F" strokeWidth="2.5" strokeLinejoin="round" /></G>;
    case 'dog':
      return <G><Path d="M16 16 q-6 4 -3 15 l9 -6 Z" fill={c} stroke="#2E2A3F" strokeWidth="2.5" strokeLinejoin="round" /><Path d="M48 16 q6 4 3 15 l-9 -6 Z" fill={c} stroke="#2E2A3F" strokeWidth="2.5" strokeLinejoin="round" /></G>;
    case 'cat':
    default:
      return <G><Path d="M18 20 L22 8 L30 18 Z" fill={c} stroke="#2E2A3F" strokeWidth="2.5" strokeLinejoin="round" /><Path d="M46 20 L42 8 L34 18 Z" fill={c} stroke="#2E2A3F" strokeWidth="2.5" strokeLinejoin="round" /></G>;
  }
}

const D = '#2E2A3F';
// Mắt theo kiểu (2 mắt tại x=25 & x=39, y≈33). Biểu cảm (expr) ghi đè kiểu gốc.
function Eyes({ kind = 'round' }) {
  const eye = (cx) => {
    switch (kind) {
      case 'sparkle':
        return <G key={cx}><Circle cx={cx} cy={33} r={3.8} fill={D} /><Circle cx={cx + 1.2} cy={31.4} r={1.3} fill="#fff" /><Circle cx={cx - 1} cy={34} r={0.7} fill="#fff" /></G>;
      case 'big':
        return <G key={cx}><Circle cx={cx} cy={33} r={4.6} fill={D} /><Circle cx={cx + 1.4} cy={31} r={1.8} fill="#fff" /><Circle cx={cx - 1.2} cy={34.4} r={0.9} fill="#fff" /></G>;
      case 'wide':
        return <G key={cx}><Circle cx={cx} cy={33} r={4.2} fill="#fff" stroke={D} strokeWidth={2} /><Circle cx={cx} cy={33} r={2} fill={D} /></G>;
      case 'tsun': // nửa mí — lườm dễ thương
        return <G key={cx}><Path d={`M${cx - 4} 31.5 h8`} stroke={D} strokeWidth={2.6} strokeLinecap="round" /><Circle cx={cx} cy={34} r={2} fill={D} /></G>;
      case 'sharp': // mắt hí sắc
        return <Path key={cx} d={`M${cx - 4} 34.5 Q${cx} 31 ${cx + 4} 33.5`} stroke={D} strokeWidth={2.8} fill="none" strokeLinecap="round" />;
      case 'sleepy':
        return <Path key={cx} d={`M${cx - 3.5} 33.5 h7`} stroke={D} strokeWidth={2.6} strokeLinecap="round" />;
      case 'happy': // ^ ^ cười tít
        return <Path key={cx} d={`M${cx - 3.6} 34 Q${cx} 30 ${cx + 3.6} 34`} stroke={D} strokeWidth={2.6} fill="none" strokeLinecap="round" />;
      case 'love': // mắt tim
        return <Path key={cx} d={`M${cx} ${34.5} q-3 -3.5 -0.2 -4.6 q1.2 -0.5 0.2 1 q1 -1.5 0.2 -1 q2.8 1.1 -0.2 4.6z`} fill="#FF4D8D" />;
      case 'angry':
        return <G key={cx}><Path d={`M${cx - 4} 30.5 L${cx + 3} 32.5`} stroke={D} strokeWidth={2.2} strokeLinecap="round" transform={cx > 32 ? `rotate(0)` : ''} /><Circle cx={cx} cy={34} r={2.2} fill={D} /></G>;
      case 'sad':
        return <G key={cx}><Circle cx={cx} cy={34} r={3.2} fill={D} /><Circle cx={cx + 0.8} cy={32.8} r={1} fill="#fff" /></G>;
      case 'round':
      default:
        return <G key={cx}><Circle cx={cx} cy={33} r={3.4} fill={D} /><Circle cx={cx + 1} cy={31.8} r={1} fill="#fff" /></G>;
    }
  };
  // mắt angry cần đối xứng (mắt phải nghịch chiều)
  if (kind === 'angry') {
    return <G><G><Path d="M21 30.5 L28 32.5" stroke={D} strokeWidth={2.2} strokeLinecap="round" /><Circle cx="25" cy="34" r="2.2" fill={D} /></G><G><Path d="M43 30.5 L36 32.5" stroke={D} strokeWidth={2.2} strokeLinecap="round" /><Circle cx="39" cy="34" r="2.2" fill={D} /></G></G>;
  }
  return <G>{eye(25)}{eye(39)}</G>;
}

// Miệng theo kiểu (vùng y≈42-47).
function Mouth({ kind = 'smile' }) {
  switch (kind) {
    case 'smug':  return <Path d="M30 44 Q34 47 38 43" stroke={D} strokeWidth={2.4} fill="none" strokeLinecap="round" />;
    case 'smirk': return <Path d="M28 45 Q33 44 38 41" stroke={D} strokeWidth={2.4} fill="none" strokeLinecap="round" />;
    case 'flat':  return <Path d="M28 44 h8" stroke={D} strokeWidth={2.4} strokeLinecap="round" />;
    case 'uwu':   return <Path d="M27 43 q2.5 2.6 5 0 q2.5 2.6 5 0" stroke={D} strokeWidth={2.2} fill="none" strokeLinecap="round" />;
    case 'grin':  return <G><Path d="M27 42 Q32 49 37 42 Z" fill={D} /><Path d="M28.5 43.4 Q32 45.2 35.5 43.4" fill="#FF7AA8" /></G>;
    case 'tongue':return <G><Path d="M28 42 Q32 47 36 42 Z" fill={D} /><Path d="M30.5 44 q1.5 3 3 0 Z" fill="#FF7AA8" /></G>;
    case 'frown': return <Path d="M27 46 Q32 42 37 46" stroke={D} strokeWidth={2.4} fill="none" strokeLinecap="round" />;
    case 'pout':  return <Path d="M30 45 q2 -2.4 4 0" stroke={D} strokeWidth={2.4} fill="none" strokeLinecap="round" />;
    case 'smile':
    default:      return <Path d="M27 42 Q32 47 37 42" stroke={D} strokeWidth={2.6} fill="none" strokeLinecap="round" />;
  }
}

// Ghi đè mắt+miệng theo biểu cảm (expr): love|happy|gat|sad. undefined = giữ cá tính gốc.
function exprOf(expr, base) {
  switch (expr) {
    case 'love': return { eye: 'love', mouth: 'grin', blush: true };
    case 'happy': return { eye: 'happy', mouth: 'grin' };
    case 'gat': return { eye: 'angry', mouth: 'pout' };
    case 'sad': return { eye: 'sad', mouth: 'frown' };
    default: return base;
  }
}

// Phụ kiện cosmetic vẽ trong viewBox 64x64 (mua ở cửa hàng trang bị).
function Accessory({ k }) {
  switch (k) {
    case 'hat_crown':
      return <G><Path d="M20 15 L24 6 L32 12 L40 6 L44 15 Z" fill="#FFC93C" stroke="#2E2A3F" strokeWidth="2" strokeLinejoin="round" /><Circle cx="24" cy="6" r="2" fill="#FF4D8D" /><Circle cx="40" cy="6" r="2" fill="#FF4D8D" /><Circle cx="32" cy="11" r="2" fill="#FF4D8D" /></G>;
    case 'hat_beanie':
      return <G><Path d="M13 20 Q32 -1 51 20 Z" fill="#8B5CF6" stroke="#2E2A3F" strokeWidth="2" strokeLinejoin="round" /><Path d="M13 20 h38" stroke="#2E2A3F" strokeWidth="2.5" strokeLinecap="round" /><Circle cx="32" cy="4" r="3.2" fill="#fff" stroke="#2E2A3F" strokeWidth="1.6" /></G>;
    case 'hat_bow':
      return <G><Path d="M32 11 L24 6 L24 16 Z" fill="#FF4D8D" stroke="#2E2A3F" strokeWidth="1.6" strokeLinejoin="round" /><Path d="M32 11 L40 6 L40 16 Z" fill="#FF4D8D" stroke="#2E2A3F" strokeWidth="1.6" strokeLinejoin="round" /><Circle cx="32" cy="11" r="2.6" fill="#D8306F" /></G>;
    case 'glasses_round':
      return <G><Circle cx="25" cy="33" r="6.6" fill="none" stroke="#2E2A3F" strokeWidth="2" /><Circle cx="39" cy="33" r="6.6" fill="none" stroke="#2E2A3F" strokeWidth="2" /><Path d="M31.6 33 h0.8" stroke="#2E2A3F" strokeWidth="2" /></G>;
    case 'glasses_cool':
      return <G><Path d="M17 30 h13 v5 q-6.5 3 -13 0 Z" fill="#2E2A3F" /><Path d="M34 30 h13 v5 q-6.5 3 -13 0 Z" fill="#2E2A3F" /><Path d="M30 31.5 h4" stroke="#2E2A3F" strokeWidth="2" /></G>;
    case 'neck_bowtie':
      return <G><Path d="M32 57 L26 53 L26 61 Z" fill="#FF4D8D" stroke="#2E2A3F" strokeWidth="1.6" strokeLinejoin="round" /><Path d="M32 57 L38 53 L38 61 Z" fill="#FF4D8D" stroke="#2E2A3F" strokeWidth="1.6" strokeLinejoin="round" /><Rect x="30.4" y="55" width="3.2" height="4" rx="1" fill="#D8306F" /></G>;
    case 'neck_scarf':
      return <G><Path d="M15 53 Q32 63 49 53 L49 59 Q32 69 15 59 Z" fill="#38BDF8" stroke="#2E2A3F" strokeWidth="1.6" strokeLinejoin="round" /></G>;
    case 'neck_chain':
      return <G><Path d="M20 51 Q32 62 44 51" fill="none" stroke="#FFC93C" strokeWidth="2.6" strokeLinecap="round" /><Circle cx="32" cy="60" r="2.8" fill="#FFC93C" stroke="#E0A61C" strokeWidth="1" /></G>;
    default:
      return null;
  }
}

// Nội dung vẽ MẶT (đầu) trong hệ toạ độ 64×64 — dùng chung cho avatar tròn & chibi.
function FaceSvg({ variant = 'mun', items, expr }) {
  const v = VARIANTS[variant] || { c: '#FFC93C', ear: 'cat' };
  const C = v.c;
  const em = exprOf(expr, { eye: v.eye || 'round', mouth: v.mouth || 'smile', blush: v.blush });
  return (
    <G>
      <Ears ear={v.ear} c={C} />
      {v.antenna && (
        <G>
          <Path d="M32 6 v8" stroke={C} strokeWidth="3" strokeLinecap="round" />
          <Circle cx="32" cy="5" r="3" fill="#FF4D8D" />
        </G>
      )}
      <Circle cx="32" cy="34" r="22" fill={C} stroke="#2E2A3F" strokeWidth="3" />
      {v.glasses && !expr ? (
        <G>
          <Circle cx="25" cy="33" r="5.5" fill="none" stroke="#2E2A3F" strokeWidth="2.5" />
          <Circle cx="39" cy="33" r="5.5" fill="none" stroke="#2E2A3F" strokeWidth="2.5" />
          <Path d="M30.5 33h3" stroke="#2E2A3F" strokeWidth="2.5" />
          <Circle cx="25" cy="33" r="2.2" fill="#2E2A3F" />
          <Circle cx="39" cy="33" r="2.2" fill="#2E2A3F" />
        </G>
      ) : (
        <Eyes kind={em.eye} />
      )}
      <Circle cx="20" cy="41" r={em.blush ? 3.9 : 3.2} fill="#FF7AA8" opacity={em.blush ? 0.9 : 0.6} />
      <Circle cx="44" cy="41" r={em.blush ? 3.9 : 3.2} fill="#FF7AA8" opacity={em.blush ? 0.9 : 0.6} />
      <Mouth kind={em.mouth} />
      {items?.neck && <Accessory k={items.neck} />}
      {items?.hat && <Accessory k={items.hat} />}
      {items?.glasses && <Accessory k={items.glasses} />}
    </G>
  );
}

// Avatar tròn (chỉ đầu). items = phụ kiện · expr = biểu cảm (love|happy|gat|sad).
export function PersonaFace({ variant = 'mun', size = 54, ring, items, expr }) {
  return (
    <View
      style={[
        {
          width: size, height: size, borderRadius: size / 2, backgroundColor: '#fff',
          alignItems: 'center', justifyContent: 'center',
        },
        ring === 'ssr'
          ? { borderWidth: 3, borderColor: '#FFB23E', ...hardShadow(3, 0.12) }
          : hardShadow(3, 0.12),
      ]}
    >
      <Svg width={size} height={size} viewBox="0 0 64 64">
        <FaceSvg variant={variant} items={items} expr={expr} />
      </Svg>
    </View>
  );
}

// Chibi TOÀN THÂN (đầu to + thân + tay + chân) — nền trong suốt, cho các màn lớn.
export function PersonaChibi({ variant = 'mun', size = 120, items, expr }) {
  const v = VARIANTS[variant] || { c: '#FFC93C', ear: 'cat' };
  const C = v.c;
  const w = size * 0.75;
  return (
    <Svg width={w} height={size} viewBox="0 0 64 92">
      {/* bóng đổ dưới chân */}
      <Ellipse cx="32" cy="89" rx="16" ry="3.2" fill="#2E2A3F" opacity="0.12" />
      {/* tay (sau thân) */}
      <Ellipse cx="14" cy="64" rx="5" ry="7.5" fill={C} stroke="#2E2A3F" strokeWidth="2.6" transform="rotate(18 14 64)" />
      <Ellipse cx="50" cy="64" rx="5" ry="7.5" fill={C} stroke="#2E2A3F" strokeWidth="2.6" transform="rotate(-18 50 64)" />
      {/* chân */}
      <Ellipse cx="25" cy="86" rx="6" ry="4.2" fill={C} stroke="#2E2A3F" strokeWidth="2.6" />
      <Ellipse cx="39" cy="86" rx="6" ry="4.2" fill={C} stroke="#2E2A3F" strokeWidth="2.6" />
      {/* thân */}
      <Path d="M17 60 Q17 50 32 50 Q47 50 47 60 L46 78 Q46 87 32 87 Q18 87 18 78 Z" fill={C} stroke="#2E2A3F" strokeWidth="3" strokeLinejoin="round" />
      {/* bụng sáng */}
      <Ellipse cx="32" cy="70" rx="9" ry="12" fill="#fff" opacity="0.22" />
      {/* đầu (đè lên thân) */}
      <FaceSvg variant={variant} items={items} expr={expr} />
    </Svg>
  );
}

// Mascot thương hiệu: MÈO CAM (ginger).
export function PurrboMascot({ size = 100 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path d="M22 34 L26 12 L44 26 Z" fill="#FF9E4D" stroke="#2E2A3F" strokeWidth="3.4" strokeLinejoin="round" />
      <Path d="M78 34 L74 12 L56 26 Z" fill="#FF9E4D" stroke="#2E2A3F" strokeWidth="3.4" strokeLinejoin="round" />
      <Path d="M28 30 L30 19 L38 27 Z" fill="#FFC9A0" />
      <Path d="M72 30 L70 19 L62 27 Z" fill="#FFC9A0" />
      <Ellipse cx="50" cy="56" rx="34" ry="31" fill="#FF9E4D" stroke="#2E2A3F" strokeWidth="3.6" />
      <Path d="M50 27 v10 M40 30 l3 9 M60 30 l-3 9" stroke="#E97D2A" strokeWidth="3.4" strokeLinecap="round" fill="none" />
      <Circle cx="38" cy="54" r="6" fill="#2E2A3F" />
      <Circle cx="62" cy="54" r="6" fill="#2E2A3F" />
      <Circle cx="40" cy="52" r="2" fill="#fff" />
      <Circle cx="64" cy="52" r="2" fill="#fff" />
      <Circle cx="26" cy="63" r="4.4" fill="#FF7AA8" opacity="0.65" />
      <Circle cx="74" cy="63" r="4.4" fill="#FF7AA8" opacity="0.65" />
      <Path d="M47 62 h6 l-3 3 z" fill="#FF7AA8" />
      <Path d="M50 65 v3 M50 68 q-5 4 -9 1 M50 68 q5 4 9 1" stroke="#2E2A3F" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <Path d="M18 56 h12 M18 62 h11 M82 56 h-12 M82 62 h-11" stroke="#2E2A3F" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.7" />
    </Svg>
  );
}
