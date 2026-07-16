// Tạo 8 icon app (1024x1024 PNG) theo persona — tái tạo CHÍNH XÁC art trong
// src/components/PersonaFace.tsx (Ears/Eyes/Mouth/FaceSvg) dạng SVG thuần rồi
// rasterize bằng @resvg/resvg-js. Chạy 1 lần (dev tool), không phải code app.
//   node scripts/gen-persona-icons.js
const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

const D = '#2E2A3F';
const INNER = '#FFB9CE';
const CREAM = '#FDF3E9';

// Bảng màu persona = personaTheme.ts PALETTE (nền icon = primary UI, đồng bộ app).
const THEME = {
  mun:  { primary: '#6C63E0' },
  cam:  { primary: '#FF9E4D' },
  ly:   { primary: '#E8743B' },
  sep:  { primary: '#8B7BB0' },
  bong: { primary: '#EC6FA0' },
  xu:   { primary: '#22B584' },
  bo:   { primary: '#7FB77E' },
  sin:  { primary: '#D99A22' },
};

// VARIANTS = màu LÔNG nhân vật (từ PersonaFace.tsx) — giữ NGUYÊN, khác UI theme ở trên.
const VARIANTS = {
  mun:   { c: '#6B6480', ear: 'cat',   eye: 'tsun',    mouth: 'smug' },
  cam:   { c: '#FF9E4D', ear: 'cat',   eye: 'sparkle', mouth: 'smile', blush: true },
  ly:    { c: '#E8743B', ear: 'fox',   eye: 'sharp',   mouth: 'smirk' },
  sep:   { c: '#8B7BB0', ear: 'cat',   glasses: true,  mouth: 'flat' },
  bong:  { c: '#F4A6C0', ear: 'bunny', eye: 'big',     mouth: 'uwu',   blush: true },
  xu:    { c: '#34D399', ear: 'cat',   antenna: true,  eye: 'wide',    mouth: 'grin' },
  bo:    { c: '#7FB77E', ear: 'bear',  eye: 'sleepy',  mouth: 'smile' },
  sin:   { c: '#E8B04B', ear: 'dog',   eye: 'happy',   mouth: 'tongue' },
};

function lighten(hex, amt) {
  const h = hex.replace('#', '');
  const n = parseInt(h, 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const mix = (ch) => Math.round(ch + (255 - ch) * amt);
  const to2 = (v) => v.toString(16).padStart(2, '0');
  return `#${to2(mix(r))}${to2(mix(g))}${to2(mix(b))}`;
}

function ears(ear, c) {
  switch (ear) {
    case 'bear':
      return `<circle cx="20" cy="18" r="8" fill="${c}" stroke="${D}" stroke-width="2.5"/>
        <circle cx="44" cy="18" r="8" fill="${c}" stroke="${D}" stroke-width="2.5"/>
        <circle cx="20" cy="18.5" r="4" fill="${INNER}"/>
        <circle cx="44" cy="18.5" r="4" fill="${INNER}"/>`;
    case 'bunny':
      return `<ellipse cx="24" cy="12" rx="5" ry="13" fill="${c}" stroke="${D}" stroke-width="2.5"/>
        <ellipse cx="40" cy="12" rx="5" ry="13" fill="${c}" stroke="${D}" stroke-width="2.5"/>
        <ellipse cx="24" cy="13" rx="2.3" ry="9" fill="${INNER}"/>
        <ellipse cx="40" cy="13" rx="2.3" ry="9" fill="${INNER}"/>`;
    case 'fox':
      return `<path d="M15 22 L18 5 L31 17 Z" fill="${c}" stroke="${D}" stroke-width="2.5" stroke-linejoin="round"/>
        <path d="M49 22 L46 5 L33 17 Z" fill="${c}" stroke="${D}" stroke-width="2.5" stroke-linejoin="round"/>
        <path d="M19 19 L20.4 10 L27 16 Z" fill="${INNER}"/>
        <path d="M45 19 L43.6 10 L37 16 Z" fill="${INNER}"/>`;
    case 'dog':
      return `<path d="M16 16 q-6 4 -3 15 l9 -6 Z" fill="${c}" stroke="${D}" stroke-width="2.5" stroke-linejoin="round"/>
        <path d="M48 16 q6 4 3 15 l-9 -6 Z" fill="${c}" stroke="${D}" stroke-width="2.5" stroke-linejoin="round"/>
        <path d="M17.5 18.5 q-3.6 2.8 -1.8 10.5 l5.6 -3.7 Z" fill="${INNER}"/>
        <path d="M46.5 18.5 q3.6 2.8 1.8 10.5 l-5.6 -3.7 Z" fill="${INNER}"/>`;
    case 'cat':
    default:
      return `<path d="M18 20 L22 8 L30 18 Z" fill="${c}" stroke="${D}" stroke-width="2.5" stroke-linejoin="round"/>
        <path d="M46 20 L42 8 L34 18 Z" fill="${c}" stroke="${D}" stroke-width="2.5" stroke-linejoin="round"/>
        <path d="M21 18 L23 11.5 L28.2 17 Z" fill="${INNER}"/>
        <path d="M43 18 L41 11.5 L35.8 17 Z" fill="${INNER}"/>`;
  }
}

function eyeAt(cx, kind) {
  switch (kind) {
    case 'sparkle':
      return `<circle cx="${cx}" cy="33.3" r="4.7" fill="${D}"/><circle cx="${cx + 1.6}" cy="31" r="1.9" fill="#fff"/><circle cx="${cx - 1.4}" cy="34.6" r="1" fill="#fff"/>`;
    case 'big':
      return `<circle cx="${cx}" cy="33.2" r="5.5" fill="${D}"/><circle cx="${cx + 1.9}" cy="30.7" r="2.3" fill="#fff"/><circle cx="${cx - 1.6}" cy="35" r="1.1" fill="#fff"/>`;
    case 'wide':
      return `<circle cx="${cx}" cy="33" r="4.6" fill="#fff" stroke="${D}" stroke-width="2"/><circle cx="${cx}" cy="33.4" r="2.4" fill="${D}"/><circle cx="${cx + 1.1}" cy="31.9" r="1" fill="#fff"/>`;
    case 'tsun':
      return `<path d="M${cx - 4} 31.5 h8" stroke="${D}" stroke-width="2.6" stroke-linecap="round"/><circle cx="${cx}" cy="34" r="2.1" fill="${D}"/><circle cx="${cx + 0.8}" cy="33.2" r="0.7" fill="#fff"/>`;
    case 'sharp':
      return `<path d="M${cx - 4} 34.5 Q${cx} 31 ${cx + 4} 33.5" stroke="${D}" stroke-width="2.8" fill="none" stroke-linecap="round"/>`;
    case 'sleepy':
      return `<path d="M${cx - 3.5} 33.5 h7" stroke="${D}" stroke-width="2.6" stroke-linecap="round"/>`;
    case 'happy':
      return `<path d="M${cx - 3.6} 34 Q${cx} 30 ${cx + 3.6} 34" stroke="${D}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
    case 'round':
    default:
      return `<circle cx="${cx}" cy="33.4" r="4.7" fill="${D}"/><circle cx="${cx + 1.6}" cy="31.3" r="1.9" fill="#fff"/><circle cx="${cx - 1.5}" cy="34.8" r="0.9" fill="#fff"/>`;
  }
}
const eyes = (kind) => eyeAt(25, kind) + eyeAt(39, kind);

function mouth(kind) {
  switch (kind) {
    case 'smug':  return `<path d="M30 44 Q34 47 38 43" stroke="${D}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
    case 'smirk': return `<path d="M28 45 Q33 44 38 41" stroke="${D}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
    case 'flat':  return `<path d="M28 44 h8" stroke="${D}" stroke-width="2.4" stroke-linecap="round"/>`;
    case 'uwu':   return `<path d="M27 43 q2.5 2.6 5 0 q2.5 2.6 5 0" stroke="${D}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
    case 'grin':  return `<path d="M27 42 Q32 49 37 42 Z" fill="${D}"/><path d="M28.5 43.4 Q32 45.2 35.5 43.4" fill="#FF7AA8"/>`;
    case 'tongue':return `<path d="M28 42 Q32 47 36 42 Z" fill="${D}"/><path d="M30.5 44 q1.5 3 3 0 Z" fill="#FF7AA8"/>`;
    case 'smile':
    default:      return `<path d="M27 42 Q32 47 37 42" stroke="${D}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
  }
}

function faceSvg(variant) {
  const v = VARIANTS[variant];
  const C = v.c;
  const gid = `hgrad-${variant}`;
  const eyesOrGlasses = v.glasses
    ? `<circle cx="25" cy="33" r="5.5" fill="none" stroke="${D}" stroke-width="2.5"/>
       <circle cx="39" cy="33" r="5.5" fill="none" stroke="${D}" stroke-width="2.5"/>
       <path d="M30.5 33h3" stroke="${D}" stroke-width="2.5"/>
       <circle cx="25" cy="33" r="2.2" fill="${D}"/><circle cx="39" cy="33" r="2.2" fill="${D}"/>
       <circle cx="26" cy="32" r="0.8" fill="#fff" opacity="0.8"/><circle cx="40" cy="32" r="0.8" fill="#fff" opacity="0.8"/>`
    : eyes(v.eye || 'round');
  const antenna = v.antenna
    ? `<path d="M32 6 v8" stroke="${C}" stroke-width="3" stroke-linecap="round"/><circle cx="32" cy="5" r="3" fill="#FF4D8D"/><circle cx="31" cy="4" r="1" fill="#fff" opacity="0.85"/>`
    : '';
  const blushR = v.blush ? 5.2 : 4.4;
  const blushCoreR = v.blush ? 3.4 : 2.8;
  const blushOpO = v.blush ? 0.34 : 0.24;
  const blushOpI = v.blush ? 0.9 : 0.66;
  return `
    <defs>
      <radialGradient id="${gid}" cx="38%" cy="26%" r="78%">
        <stop offset="0" stop-color="${lighten(C, 0.42)}"/>
        <stop offset="0.55" stop-color="${lighten(C, 0.1)}"/>
        <stop offset="1" stop-color="${C}"/>
      </radialGradient>
    </defs>
    ${ears(v.ear, C)}
    ${antenna}
    <circle cx="32" cy="34" r="22" fill="url(#${gid})" stroke="${D}" stroke-width="3"/>
    <ellipse cx="24" cy="24" rx="8" ry="5.5" fill="#fff" opacity="0.28"/>
    ${eyesOrGlasses}
    <circle cx="19.5" cy="41.5" r="${blushR}" fill="#FF7AA8" opacity="${blushOpO}"/>
    <circle cx="44.5" cy="41.5" r="${blushR}" fill="#FF7AA8" opacity="${blushOpO}"/>
    <circle cx="19.5" cy="41.5" r="${blushCoreR}" fill="#FF7AA8" opacity="${blushOpI}"/>
    <circle cx="44.5" cy="41.5" r="${blushCoreR}" fill="#FF7AA8" opacity="${blushOpI}"/>
    ${mouth(v.mouth || 'smile')}
  `;
}

// Icon iOS 1024x1024: nền = màu UI persona (đồng bộ theme app) + vòng cream + mặt.
function iconSvg(variant) {
  const bg = THEME[variant].primary;
  const scale = 12.2;
  const off = 512 - 32 * scale;
  return `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
    <rect width="1024" height="1024" fill="${bg}"/>
    <circle cx="512" cy="512" r="380" fill="${CREAM}"/>
    <g transform="translate(${off} ${off}) scale(${scale})">
      ${faceSvg(variant)}
    </g>
  </svg>`;
}

// Foreground Android (nền TRONG SUỐT, thu nhỏ hơn để chừa safe-zone ~66% —
// launcher Android tự mask hình tròn/vuông bo và có thể crop viền ngoài).
function androidForegroundSvg(variant) {
  const scale = 9.4;
  const off = 512 - 32 * scale;
  return `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
    <circle cx="512" cy="512" r="330" fill="${CREAM}"/>
    <g transform="translate(${off} ${off}) scale(${scale})">
      ${faceSvg(variant)}
    </g>
  </svg>`;
}

const outDir = path.join(__dirname, '..', 'assets', 'persona-icons');
fs.mkdirSync(outDir, { recursive: true });

for (const variant of Object.keys(VARIANTS)) {
  const iosPng = new Resvg(iconSvg(variant), { fitTo: { mode: 'width', value: 1024 } }).render().asPng();
  fs.writeFileSync(path.join(outDir, `icon-${variant}.png`), iosPng);

  const androidPng = new Resvg(androidForegroundSvg(variant), { fitTo: { mode: 'width', value: 1024 } }).render().asPng();
  fs.writeFileSync(path.join(outDir, `icon-${variant}-android.png`), androidPng);

  console.log('wrote icon-%s.png + icon-%s-android.png', variant, variant);
}
