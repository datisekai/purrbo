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
};

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
