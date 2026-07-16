// Theme ĐỘNG theo persona đang active — toàn app dùng 1 tông của persona.
// Dùng: const c = useC();  →  c.pink/c.purple/... đều là màu persona (monochrome).
// StyleSheet tĩnh không đổi được theo theme → màn nào cần thì tạo style theo c:
//   const s = useMemo(() => mkStyles(c), [c]);   (mkStyles = (c) => StyleSheet.create({...}))
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { makeColors, type AppColors } from './theme';
import { personaPalette, type PersonaPalette } from './personaTheme';
import { Api } from './api';
import { useAuth } from './auth';

// Icon app ngoài màn hình chính cũng đổi theo persona (native — cần rebuild để có
// hiệu lực; require mềm để không crash bản build chưa có module này).
let setAlternateAppIcon: ((name: string | null) => Promise<string | null>) | null = null;
try { setAlternateAppIcon = require('expo-alternate-app-icons').setAlternateAppIcon; } catch {}

// variant (lowercase, khớp DB) → tên icon PascalCase đã khai trong app.json plugin.
const ICON_NAME: Record<string, string> = {
  mun: 'Mun', cam: 'Cam', ly: 'Ly', sep: 'Sep', bong: 'Bong', xu: 'Xu', bo: 'Bo', sin: 'Sin',
};

type Ctx = {
  c: AppColors;
  pal: PersonaPalette;
  variant?: string;
  setVariant: (v?: string) => void;   // màn đổi persona gọi để app đổi tông + icon ngay
  refresh: () => Promise<void>;
};

const C = createContext<Ctx>({
  c: makeColors(personaPalette(undefined)),
  pal: personaPalette(undefined),
  variant: undefined,
  setVariant: () => {},
  refresh: async () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [variant, setVariantRaw] = useState<string | undefined>(undefined);
  const { token } = useAuth();
  const lastIcon = useRef<string | undefined>(undefined);

  // Bọc setter: đổi tông app NGAY + đổi icon OS (best-effort, không chặn UI nếu lỗi).
  const setVariant = useCallback((v?: string) => {
    setVariantRaw(v);
    if (!setAlternateAppIcon || v === lastIcon.current) return;
    lastIcon.current = v;
    const name = v ? ICON_NAME[v] || null : null;
    try {
      setAlternateAppIcon(name)?.catch?.(() => {});
    } catch {
      // native module chưa link (chưa rebuild) → im lặng bỏ qua, không chặn theme UI.
    }
  }, []);

  // Lấy persona active để biết tông. Chưa đăng nhập → lỗi im lặng, dùng NEUTRAL.
  const refresh = useCallback(async () => {
    try {
      const [st, cat] = await Promise.all([Api.state(), Api.personas()]);
      const a = Array.isArray(cat) ? cat.find((p: any) => p.key === st.persona_key) : null;
      if (a?.variant) setVariant(a.variant);
    } catch {}
  }, [setVariant]);

  // Refetch mỗi khi TOKEN đổi (đăng nhập/đăng xuất) — trước đây chỉ chạy 1 lần lúc
  // App mount (chưa đăng nhập → luôn fail → kẹt vĩnh viễn ở NEUTRAL dù đã có persona).
  useEffect(() => {
    if (token) refresh();
    else setVariant(undefined);   // đăng xuất → về trung tính (icon reset về mặc định)
  }, [token, refresh, setVariant]);

  const pal = useMemo(() => personaPalette(variant), [variant]);
  const c = useMemo(() => makeColors(pal), [pal]);
  const value = useMemo(() => ({ c, pal, variant, setVariant, refresh }), [c, pal, variant, setVariant, refresh]);

  return <C.Provider value={value}>{children}</C.Provider>;
}

export const useTheme = () => useContext(C);
export const useC = (): AppColors => useContext(C).c;
export const usePal = (): PersonaPalette => useContext(C).pal;
