// Theme ĐỘNG theo persona đang active — toàn app dùng 1 tông của persona.
// Dùng: const c = useC();  →  c.pink/c.purple/... đều là màu persona (monochrome).
// StyleSheet tĩnh không đổi được theo theme → màn nào cần thì tạo style theo c:
//   const s = useMemo(() => mkStyles(c), [c]);   (mkStyles = (c) => StyleSheet.create({...}))
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { makeColors, type AppColors } from './theme';
import { personaPalette, type PersonaPalette } from './personaTheme';
import { Api } from './api';
import { useAuth } from './auth';

type Ctx = {
  c: AppColors;
  pal: PersonaPalette;
  variant?: string;
  setVariant: (v?: string) => void;   // màn đổi persona gọi để app đổi tông ngay
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
  const [variant, setVariant] = useState<string | undefined>(undefined);
  const { token } = useAuth();

  // Lấy persona active để biết tông. Chưa đăng nhập → lỗi im lặng, dùng NEUTRAL.
  const refresh = useCallback(async () => {
    try {
      const [st, cat] = await Promise.all([Api.state(), Api.personas()]);
      const a = Array.isArray(cat) ? cat.find((p: any) => p.key === st.persona_key) : null;
      if (a?.variant) setVariant(a.variant);
    } catch {}
  }, []);

  // Refetch mỗi khi TOKEN đổi (đăng nhập/đăng xuất) — trước đây chỉ chạy 1 lần lúc
  // App mount (chưa đăng nhập → luôn fail → kẹt vĩnh viễn ở NEUTRAL dù đã có persona).
  useEffect(() => {
    if (token) refresh();
    else setVariant(undefined);   // đăng xuất → về trung tính
  }, [token, refresh]);

  const pal = useMemo(() => personaPalette(variant), [variant]);
  const c = useMemo(() => makeColors(pal), [pal]);
  const value = useMemo(() => ({ c, pal, variant, setVariant, refresh }), [c, pal, variant, refresh]);

  return <C.Provider value={value}>{children}</C.Provider>;
}

export const useTheme = () => useContext(C);
export const useC = (): AppColors => useContext(C).c;
export const usePal = (): PersonaPalette => useContext(C).pal;
