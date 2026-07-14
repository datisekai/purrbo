// AD-13: kết nối Google Calendar (read-only) từ app.
// App tự OAuth scope calendar.readonly → lưu access_token ở AsyncStorage →
// truyền cho backend theo từng request (backend không lưu token).
// Cần EXPO_PUBLIC_GOOGLE_CLIENT_ID; chưa có thì tính năng báo cần cấu hình.
import AsyncStorage from '@react-native-async-storage/async-storage';

export const GCAL_SCOPE = 'https://www.googleapis.com/auth/calendar.readonly';
export const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;

const GCAL_KEY = 'purrbo.gcal.token';

export async function getGcalToken(): Promise<string | null> {
  return AsyncStorage.getItem(GCAL_KEY);
}
export async function setGcalToken(t: string | null): Promise<void> {
  if (t) await AsyncStorage.setItem(GCAL_KEY, t);
  else await AsyncStorage.removeItem(GCAL_KEY);
}
export async function isGcalConnected(): Promise<boolean> {
  return !!(await getGcalToken());
}

// Lark (Feishu) — cùng cơ chế: lưu access_token, truyền cho backend.
export const LARK_APP_ID = process.env.EXPO_PUBLIC_LARK_APP_ID;
const LARK_KEY = 'purrbo.lark.token';

export async function getLarkToken(): Promise<string | null> {
  return AsyncStorage.getItem(LARK_KEY);
}
export async function setLarkToken(t: string | null): Promise<void> {
  if (t) await AsyncStorage.setItem(LARK_KEY, t);
  else await AsyncStorage.removeItem(LARK_KEY);
}
