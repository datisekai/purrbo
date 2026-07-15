// "Theme theo persona" — tint dịu các SURFACE gắn với nhân vật (nền hero, header
// chat, note lịch) theo màu persona, GIỮ hồng/tím brand cho hành động & cấu trúc.
// Tránh re-theme toàn app (phân mảnh brand + chữ khó đọc trên vài màu).
export type PersonaTheme = { surface: string; soft: string };

const THEME: Record<string, PersonaTheme> = {
  mun:  { surface: '#ECEAF3', soft: '#F4F2F9' }, // xám-tím
  cam:  { surface: '#FFF0E1', soft: '#FFF7EE' }, // cam đào
  ly:   { surface: '#FBEADF', soft: '#FDF3EC' }, // cam đất
  sep:  { surface: '#EDE9F6', soft: '#F5F2FB' }, // tím
  bong: { surface: '#FDEBF2', soft: '#FEF3F7' }, // hồng
  xu:   { surface: '#E3F7EF', soft: '#EFFBF6' }, // xanh mint
  bo:   { surface: '#EBF4EA', soft: '#F3F9F2' }, // xanh lá dịu
  sin:  { surface: '#FBF1DD', soft: '#FDF8EC' }, // vàng ấm
};

// Trung tính: dùng khi persona CHƯA resolve (tránh nháy nhầm tint mun trước khi
// biết persona thật). Khi đã có variant → tint đúng nhân vật.
const NEUTRAL: PersonaTheme = { surface: '#F1EEF6', soft: '#F7F5FB' };

export function personaTheme(variant?: string): PersonaTheme {
  if (!variant) return NEUTRAL;
  return THEME[variant] || NEUTRAL;
}
