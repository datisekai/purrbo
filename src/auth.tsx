import React, { createContext, useContext, useEffect, useState } from 'react';
import { Api, loadToken, setToken, setOnUnauthorized } from './api';

type User = { id: string; email: string; name: string; avatar: string } | null;

type AuthCtx = {
  ready: boolean;
  token: string | null;
  user: User;
  onboarded: boolean;
  loginDev: (name?: string) => Promise<void>;
  loginGoogle: (idToken: string) => Promise<void>;
  markOnboarded: () => void;
  updateUser: (patch: Partial<NonNullable<User>>) => void;
  logout: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>(null as any);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [token, setTok] = useState<string | null>(null);
  const [user, setUser] = useState<User>(null);
  const [onboarded, setOnboarded] = useState(false);

  // Lấy cờ onboarded từ backend (state của user)
  const refreshOnboarded = async () => {
    try {
      const st = await Api.state();
      setOnboarded(!!st.onboarded);
    } catch {
      setOnboarded(false);
    }
  };

  useEffect(() => {
    let settled = false;
    const finish = () => { if (!settled) { settled = true; setReady(true); } };
    // TRẦN CỨNG 3s: dù loadToken()/Api.me() có treo (native module lỗi, mạng
    // kẹt mà abort không cắt được...) thì tối đa 3s vẫn mở app — không treo trắng.
    const hard = setTimeout(finish, 3000);
    (async () => {
      try {
        const t = await loadToken();
        if (t) {
          try {
            const me = await Api.me();
            setTok(t);
            setUser(me);
            await refreshOnboarded();
          } catch {
            await setToken(null); // token hỏng/hết hạn/backend die → về màn nhập tên
          }
        }
      } catch {
        /* AsyncStorage lỗi → vẫn cho vào app */
      } finally {
        clearTimeout(hard);
        finish();   // LUÔN mở app, không để treo màn trắng
      }
    })();
    return () => clearTimeout(hard);
  }, []);

  useEffect(() => {
    setOnUnauthorized(() => {   // AD-10: 401 → về màn nhập tên
      setTok(null);
      setUser(null);
      setOnboarded(false);
    });
    return () => setOnUnauthorized(null);
  }, []);

  const apply = async (res: any) => {
    await setToken(res.token);
    setTok(res.token);
    setUser(res.user);
    await refreshOnboarded();
  };

  const loginDev = async (name?: string) => apply(await Api.devLogin(name));
  const loginGoogle = async (idToken: string) => apply(await Api.googleLogin(idToken));
  const markOnboarded = () => setOnboarded(true);
  const updateUser = (patch: Partial<NonNullable<User>>) =>
    setUser((u) => (u ? { ...u, ...patch } : u));
  const logout = async () => {
    await setToken(null);
    setTok(null);
    setUser(null);
    setOnboarded(false);
  };

  return (
    <Ctx.Provider value={{ ready, token, user, onboarded, loginDev, loginGoogle, markOnboarded, updateUser, logout }}>
      {children}
    </Ctx.Provider>
  );
}
