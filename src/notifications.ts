// AD-9: nhắc lịch bằng LOCAL notification (chạy cả offline; hoạt động trong Expo Go).
// Remote push (Expo Push) chỉ chạy trên DEV BUILD — Expo Go SDK 53+ đã bỏ hỗ trợ.
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Api } from './api';
import { navigate } from './navigation/ref';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Android BẮT BUỘC có channel, không thì banner/âm thanh bị nuốt.
export async function setupAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    await Notifications.setNotificationChannelAsync('purrbo-reminders', {
      name: 'Nhắc lịch Purrbo',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF4D8D',
    });
  } catch {}
}

export async function ensureNotifPermission(): Promise<boolean> {
  await setupAndroidChannel();
  const cur = await Notifications.getPermissionsAsync();
  if (cur.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

// Deep-link: chạm thông báo → mở đúng màn (mặc định về Home). Xử lý cả
// cold-start (mở app từ notif) lẫn khi app đang chạy. Gọi 1 lần ở App.
export function setupNotificationNavigation(): () => void {
  const go = (data: any) => navigate(data?.target || 'Main', data?.params);
  Notifications.getLastNotificationResponseAsync()
    .then((resp) => {
      if (resp) setTimeout(() => go(resp.notification.request.content.data), 500);
    })
    .catch(() => {});
  const sub = Notifications.addNotificationResponseReceivedListener((resp) => {
    go(resp.notification.request.content.data);
  });
  return () => sub.remove();
}

// Gửi 1 thông báo TEST sau 3 giây — để user kiểm tra notif thật sự chạy.
export async function sendTestNotification(): Promise<boolean> {
  try {
    const ok = await ensureNotifPermission();
    if (!ok) return false;
    await Notifications.scheduleNotificationAsync({
      content: { title: 'Purrbo 🐾', body: 'Thử nè cưng! Nhận được là notif đang chạy ngon 💗', data: { target: 'Main' } },
      trigger: { seconds: 3, channelId: 'purrbo-reminders' } as any,
    });
    return true;
  } catch {
    return false;
  }
}

// Remote push: chỉ chạy trên dev build/standalone (Expo Go không lấy được token).
// Best-effort: lấy Expo push token rồi gửi backend (PushPort). Thiếu → bỏ qua êm.
export async function registerPushToken(): Promise<string | null> {
  try {
    if (Constants.appOwnership === 'expo') return null; // Expo Go → skip
    const ok = await ensureNotifPermission();
    if (!ok) return null;
    const projectId =
      (Constants as any)?.expoConfig?.extra?.eas?.projectId ||
      (Constants as any)?.easConfig?.projectId;
    const tok = (await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined)).data;
    if (tok) { try { await Api.registerPush(tok); } catch {} }
    return tok;
  } catch {
    return null;
  }
}

type Habit = { name: string; time?: string; repeat?: string };

// 0=T2..6=CN  →  weekday của expo (1=CN..7=T7)
const expoWeekday = (d: number) => ((d + 1) % 7) + 1;

// Đặt lại toàn bộ nhắc theo lịch lặp của từng habit.
//  repeat: "daily" | "weekly:0,2,4" (0=T2..6=CN) | "hours:2" (mỗi 2 tiếng)
export async function scheduleHabitReminders(habits: Habit[]): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    for (const h of habits) {
      const body = `${h.name} — em đang hóng cưng khoe đó 👀💗`;
      const content = { title: 'Purrbo 🐾', body, data: { target: 'Main' } };
      const repeat = String(h.repeat || 'daily');

      // Mỗi X giờ — không cần giờ cố định
      if (repeat.startsWith('hours:')) {
        const n = Math.max(1, parseInt(repeat.split(':')[1], 10) || 1);
        await Notifications.scheduleNotificationAsync({
          content, trigger: { seconds: n * 3600, repeats: true, channelId: 'purrbo-reminders' } as any,
        });
        continue;
      }

      const m = String(h.time || '').match(/(\d{1,2})[:h](\d{0,2})/);
      if (!m) continue;
      const hour = Number(m[1]);
      const minute = Number(m[2] || 0);
      if (Number.isNaN(hour)) continue;

      if (repeat.startsWith('weekly:')) {
        const days = repeat.split(':')[1].split(',').map((x) => parseInt(x, 10)).filter((x) => x >= 0 && x <= 6);
        for (const d of days) {
          await Notifications.scheduleNotificationAsync({
            content, trigger: { weekday: expoWeekday(d), hour, minute, repeats: true, channelId: 'purrbo-reminders' } as any,
          });
        }
        continue;
      }

      // daily
      await Notifications.scheduleNotificationAsync({
        content, trigger: { hour, minute, repeats: true, channelId: 'purrbo-reminders' } as any,
      });
    }
  } catch {
    /* Expo Go có thể hạn chế — bỏ qua, không chặn app */
  }
}
