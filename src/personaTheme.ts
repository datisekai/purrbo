// Bảng màu theo PERSONA — mỗi persona một tông, để 1 màn KHÔNG bị loạn nhiều màu.
// primary = màu nhấn chính (nút/CTA/nhấn) · primaryDark = viền/nhấn đậm (chữ trắng đọc được)
// surface = nền tint dịu · soft = nền tint nhạt hơn.
export type PersonaPalette = { primary: string; primaryDark: string; surface: string; soft: string };
export type PersonaTheme = { surface: string; soft: string };  // giữ tương thích cũ

const PALETTE: Record<string, PersonaPalette> = {
  mun:  { primary: '#6B6480', primaryDark: '#4E4763', surface: '#ECEAF3', soft: '#F4F2F9' }, // tsundere xám-tím
  cam:  { primary: '#FF9E4D', primaryDark: '#E07A22', surface: '#FFF0E1', soft: '#FFF7EE' }, // cam đào
  ly:   { primary: '#E8743B', primaryDark: '#C0561F', surface: '#FBEADF', soft: '#FDF3EC' }, // cam đất
  sep:  { primary: '#8B7BB0', primaryDark: '#6A5B90', surface: '#EDE9F6', soft: '#F5F2FB' }, // tím tổng tài
  bong: { primary: '#EC6FA0', primaryDark: '#C84B7E', surface: '#FDEBF2', soft: '#FEF3F7' }, // hồng uwu
  xu:   { primary: '#22B584', primaryDark: '#158563', surface: '#E3F7EF', soft: '#EFFBF6' }, // mint hype
  bo:   { primary: '#7FB77E', primaryDark: '#5C9159', surface: '#EBF4EA', soft: '#F3F9F2' }, // xanh lá chill
  sin:  { primary: '#D99A22', primaryDark: '#B07A12', surface: '#FBF1DD', soft: '#FDF8EC' }, // vàng ấm shiba
};

const NEUTRAL: PersonaPalette = { primary: '#8B5CF6', primaryDark: '#6B3FD6', surface: '#F1EEF6', soft: '#F7F5FB' };

export function personaPalette(variant?: string): PersonaPalette {
  if (!variant) return NEUTRAL;
  return PALETTE[variant] || NEUTRAL;
}

// Tương thích code cũ (chỉ cần surface/soft).
export function personaTheme(variant?: string): PersonaTheme {
  const p = personaPalette(variant);
  return { surface: p.surface, soft: p.soft };
}
