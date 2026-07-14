import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Circle, Ellipse, G, Rect } from 'react-native-svg';
import { hardShadow } from '../theme';

// Cấu hình từng persona: màu + kiểu tai + phụ kiện. Thêm persona mới = thêm 1 dòng.
// ear: cat | bear | bunny | fox | dog · glasses/antenna: phụ kiện riêng.
const VARIANTS = {
  mun:   { c: '#6B6480', ear: 'cat' },                       // mèo mun (tsundere)
  cam:   { c: '#FF9E4D', ear: 'cat' },                       // Mochi — mèo cam
  ly:    { c: '#E8743B', ear: 'fox' },                       // Lỳ — cáo bad-boy
  sep:   { c: '#8B7BB0', ear: 'cat', glasses: true },        // Sếp — tổng tài đeo kính
  bong:  { c: '#F4A6C0', ear: 'bunny' },                     // Bông — thỏ hồng
  xu:    { c: '#34D399', ear: 'cat', antenna: true },        // Xu — mèo xanh hype
  bo:    { c: '#7FB77E', ear: 'bear' },                      // Bơ — gấu xanh chill
  sin:   { c: '#E8B04B', ear: 'dog' },                       // Sìn — shiba
  // alias tương thích dữ liệu cũ
  gau:   { c: '#C98A5E', ear: 'bear' },
  tong:  { c: '#8B5CF6', ear: 'cat', glasses: true },
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

// Mặt persona (SVG) — dữ liệu hoá theo VARIANTS. items = {hat,glasses,neck} (cosmetic).
export function PersonaFace({ variant = 'mun', size = 54, ring, items }) {
  const v = VARIANTS[variant] || { c: '#FFC93C', ear: 'cat' };
  const C = v.c;
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
        <Ears ear={v.ear} c={C} />
        {v.antenna && (
          <G>
            <Path d="M32 6 v8" stroke={C} strokeWidth="3" strokeLinecap="round" />
            <Circle cx="32" cy="5" r="3" fill="#FF4D8D" />
          </G>
        )}
        <Circle cx="32" cy="34" r="22" fill={C} stroke="#2E2A3F" strokeWidth="3" />
        {v.glasses ? (
          <G>
            <Circle cx="25" cy="33" r="5.5" fill="none" stroke="#2E2A3F" strokeWidth="2.5" />
            <Circle cx="39" cy="33" r="5.5" fill="none" stroke="#2E2A3F" strokeWidth="2.5" />
            <Path d="M30.5 33h3" stroke="#2E2A3F" strokeWidth="2.5" />
            <Circle cx="25" cy="33" r="2.2" fill="#2E2A3F" />
            <Circle cx="39" cy="33" r="2.2" fill="#2E2A3F" />
          </G>
        ) : (
          <G>
            <Circle cx="25" cy="33" r="3.4" fill="#2E2A3F" />
            <Circle cx="39" cy="33" r="3.4" fill="#2E2A3F" />
            <Circle cx="26" cy="32" r="1" fill="#fff" />
            <Circle cx="40" cy="32" r="1" fill="#fff" />
          </G>
        )}
        <Circle cx="20" cy="41" r="3.2" fill="#FF7AA8" opacity="0.65" />
        <Circle cx="44" cy="41" r="3.2" fill="#FF7AA8" opacity="0.65" />
        <Path d="M27 42 Q32 47 37 42" stroke="#2E2A3F" strokeWidth="2.6" fill="none" strokeLinecap="round" />
        {items?.neck && <Accessory k={items.neck} />}
        {items?.hat && <Accessory k={items.hat} />}
        {items?.glasses && <Accessory k={items.glasses} />}
      </Svg>
    </View>
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
