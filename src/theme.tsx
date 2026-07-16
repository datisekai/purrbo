// Purrbo — design tokens (port từ design system prototype)
export const colors = {
  pink: '#FF4D8D', pinkDark: '#D8306F',
  purple: '#8B5CF6', purpleDark: '#6B3FD6',
  yellow: '#FFC93C', yellowDark: '#E0A61C',
  mint: '#34D399', mintDark: '#16A97A',
  sky: '#38BDF8', skyDark: '#1893D1',
  coral: '#FF7A59', coralDark: '#E0532F',
  bg: '#FFFFFF', card: '#FFFFFF',
  ink: '#2E2A3F', muted: '#8A8398', line: '#EFE7DD',
  rCommon: '#9AA0B4', rRare: '#38BDF8', rSSR: '#FFB23E',
  danger: '#E24B4A', dangerDark: '#A32D2D',   // giữ ĐỎ cho hành động xoá/nguy hiểm
};

export type AppColors = typeof colors;

// MONOCHROME theo persona: mọi màu brand (hồng/tím/vàng/mint/sky/coral) đều quy
// về 1 tông của persona đang active → 1 màn chỉ còn tông đó + neutral.
// Rarity giữ phân biệt bằng 3 SẮC ĐỘ của chính tông đó. ĐỎ (danger) giữ nguyên.
export function makeColors(pal: { primary: string; primaryDark: string; surface: string; soft: string }): AppColors {
  return {
    ...colors,
    pink: pal.primary, pinkDark: pal.primaryDark,
    purple: pal.primary, purpleDark: pal.primaryDark,
    yellow: pal.primary, yellowDark: pal.primaryDark,
    mint: pal.primary, mintDark: pal.primaryDark,
    sky: pal.primary, skyDark: pal.primaryDark,
    coral: pal.primary, coralDark: pal.primaryDark,
    rCommon: colors.muted, rRare: pal.primary, rSSR: pal.primaryDark,
  };
}

export const radii = { sm: 12, md: 18, lg: 26, pill: 999 };

// Font family keys — khớp tên export của @expo-google-fonts/*
export const fonts = {
  display: 'Baloo2_800ExtraBold',
  heading: 'Baloo2_700Bold',
  semi: 'Baloo2_600SemiBold',
  body: 'BeVietnamPro_600SemiBold',
  bodyBold: 'BeVietnamPro_700Bold',
  bodyBlack: 'BeVietnamPro_800ExtraBold',
};

// Đổ bóng cứng 2D (xấp xỉ trên RN). iOS: shadowRadius 0; Android: elevation.
export const hardShadow = (y = 5, opacity = 0.14) => ({
  shadowColor: '#2E2A3F',
  shadowOffset: { width: 0, height: y },
  shadowOpacity: opacity,
  shadowRadius: 0,
  elevation: y,
});
