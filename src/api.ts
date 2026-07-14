// API client cho app Purrbo (giống client/src/api.ts của McUp).
// API_BASE lấy từ EXPO_PUBLIC_API_URL (đặt trong .env) — dev trỏ IP LAN máy chạy backend.
import AsyncStorage from '@react-native-async-storage/async-storage';

// DEV (Expo Go): lấy IP LAN từ .env, mặc định IP máy đang chạy backend.
// PROD (build TestFlight/APK): eas.json ép EXPO_PUBLIC_API_URL = domain https.
// Chốt an toàn: bản prod chỉ chấp nhận https:// (sai thì về domain thật).
const _env = process.env.EXPO_PUBLIC_API_URL;
export const API_BASE = __DEV__
  ? (_env ?? 'http://192.168.1.215:8000')
  : (_env && _env.startsWith('https://') ? _env : 'https://purrbo.fun');

const TOKEN_KEY = 'purrbo.token';
let _token: string | null = null;

export async function loadToken(): Promise<string | null> {
  _token = await AsyncStorage.getItem(TOKEN_KEY);
  return _token;
}
export async function setToken(t: string | null): Promise<void> {
  _token = t;
  if (t) await AsyncStorage.setItem(TOKEN_KEY, t);
  else await AsyncStorage.removeItem(TOKEN_KEY);
}
export function getToken(): string | null {
  return _token;
}

// AD-10: token hỏng/hết hạn (401) → gọi handler tập trung (AuthProvider set = logout)
let _onUnauthorized: (() => void) | null = null;
export function setOnUnauthorized(fn: (() => void) | null): void {
  _onUnauthorized = fn;
}

async function req(path: string, opts: { method?: string; body?: any } = {}): Promise<any> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (_token) headers.Authorization = `Bearer ${_token}`;
  const res = await fetch(API_BASE + '/v1' + path, {  // AD-12: mọi API dưới /v1
    method: opts.method ?? 'GET',
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  if (res.status === 401) {
    await setToken(null);
    _onUnauthorized?.();               // AD-10: về màn nhập tên thay vì im lặng
    throw new Error('401 unauthorized');
  }
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`${res.status} ${txt}`);
  }
  const ct = res.headers.get('content-type') ?? '';
  return ct.includes('json') ? res.json() : res.text();
}

export const Api = {
  devLogin: (name = 'Finn') => req('/auth/dev', { method: 'POST', body: { name } }),
  googleLogin: (id_token: string) => req('/auth/google', { method: 'POST', body: { id_token } }),
  me: () => req('/auth/me'),
  personas: () => req('/personas'),
  state: () => req('/state'),
  collection: () => req('/me/personas'),
  setPersona: (key: string) => req('/state/persona', { method: 'PUT', body: { key } }),
  onboardingPick: (key: string) => req('/onboarding', { method: 'POST', body: { key } }),
  habits: () => req('/habits'),
  createHabit: (h: { name: string; icon?: string; time?: string; hint?: string; repeat?: string }) => req('/habits', { method: 'POST', body: h }),
  updateHabit: (id: number, h: { name: string; icon?: string; time?: string; hint?: string; repeat?: string }) => req(`/habits/${id}`, { method: 'PUT', body: h }),
  deleteHabit: (id: number) => req(`/habits/${id}`, { method: 'DELETE' }),
  khoe: (id: number) => req(`/habits/${id}/khoe`, { method: 'POST' }),
  gachaOpen: (bag: 'thuong' | 'caocap' = 'thuong') => req(`/gacha/open?bag=${bag}`, { method: 'POST' }),
  gachaOpen10: (bag: 'thuong' | 'caocap' = 'thuong') => req(`/gacha/open10?bag=${bag}`, { method: 'POST' }) as Promise<{ results: { persona: any; is_new: boolean }[]; gems: number }>,
  // AD-14: nạp đá quý — verify receipt ở server rồi mới cộng gems (client không tự cộng)
  billingVerify: (receipt: string, gems: number) =>
    req('/billing/verify', { method: 'POST', body: { receipt, gems } }) as Promise<{ ok: boolean; gems?: number }>,
  updateSettings: (s: { intimacy?: number; lay?: number; freq?: number }) => req('/settings', { method: 'PUT', body: s }),
  registerPush: (token: string) => req('/push/register', { method: 'POST', body: { token } }),
  config: () => req('/config') as Promise<any>,   // cấu hình động (gói/tỉ lệ/copy) — quản lý ở web admin
  profile: () => req('/profile'),
  updateProfile: (body: { name?: string; timezone?: string }) => req('/profile', { method: 'PUT', body }),
  nlpParse: (text: string) => req('/nlp/parse', { method: 'POST', body: { text } }),
  chatHistory: () => req('/chat'),
  sendChat: (text: string) => req('/chat', { method: 'POST', body: { text } }),
  // AD-13: event lịch (app tự OAuth, truyền access_token qua gtoken). provider=google|lark
  calendarEvents: (gtoken: string, provider: 'google' | 'lark' = 'google') =>
    req('/calendar/events?provider=' + provider + '&gtoken=' + encodeURIComponent(gtoken)) as Promise<
      { title: string; start: string; location: string }[]
    >,
  // Giữ chân: nhiệm vụ hàng ngày + mời bạn (referral)
  missions: () => req('/missions') as Promise<any>,
  claimMission: (key: string) => req(`/missions/${key}/claim`, { method: 'POST' }) as Promise<any>,
  referral: () => req('/referral') as Promise<any>,
  redeemReferral: (code: string) => req('/referral/redeem', { method: 'POST', body: { code } }) as Promise<any>,
  // Trang bị / phụ kiện (cosmetic đổi ngoại hình)
  items: () => req('/items') as Promise<any[]>,
  equippedItems: () => req('/items/equipped') as Promise<Record<string, string>>,
  buyItem: (key: string) => req(`/items/${key}/buy`, { method: 'POST' }) as Promise<any>,
  equipItem: (slot: string, key: string) => req('/items/equip', { method: 'PUT', body: { slot, key } }) as Promise<any>,
};
