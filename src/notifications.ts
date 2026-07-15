// AD-9: nhắc lịch bằng LOCAL notification (chạy cả offline; hoạt động trong Expo Go).
// Remote push (Expo Push) chỉ chạy trên DEV BUILD — Expo Go SDK 53+ đã bỏ hỗ trợ.
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Api } from './api';
import { personaReminder } from './personaCopy';
import { navigate } from './navigation/ref';

// QUAN TRỌNG: call này chạy Ở CẤP MODULE (lúc import). Nếu native module
// expo-notifications init khác trong bản standalone và ném lỗi ở đây thì cả
// module graph vỡ TRƯỚC khi React mount → màn trắng, ErrorBoundary không bắt được.
// Bọc try/catch để lỗi khởi tạo notif không bao giờ làm trắng app.
try {
  Notifications.setNotificationHandler({
    // Handler này CHỈ chạy khi noti tới lúc app đang MỞ (foreground). Lúc đó
    // KHÔNG hiện banner/âm thanh — đang dùng app thì khỏi nhắc, tránh "mở app là
    // bị noti". Nhắc lịch thật vẫn hiện khi app ĐÓNG/nền (handler không can thiệp).
    // Hiện noti CẢ khi app đang mở (foreground). Trước đây tắt để tránh bug cũ
    // "mở app là bị bắn tức thì"; nay trigger đã đúng loại (DAILY/WEEKLY/DATE) nên
    // reminder chỉ bắn đúng giờ → hiện banner trong app là hợp lý, không phải spam.
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch {}

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
      content: { title: 'Purrbo 🐾', body: 'Thử nè cưng! Nhận được là notif đang chạy ngon 💗', data: { target: 'Main', foregroundTest: true } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 2, channelId: 'purrbo-reminders' } as any,
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

type Habit = { name: string; time?: string; repeat?: string; hint?: string };

// 0=T2..6=CN  →  weekday của expo (1=CN..7=T7)
const expoWeekday = (d: number) => ((d + 1) % 7) + 1;

// "nhắc trước 1 tiếng" / "nhắc trước 15 phút" → số PHÚT dời sớm (0 nếu không có).
function parseRemindLead(hint?: string): number {
  const m = String(hint || '').toLowerCase().match(/nhắc trước\s*(\d+)\s*(phút|tiếng|giờ|h)/);
  if (!m) return 0;
  const n = parseInt(m[1], 10) || 0;
  return /tiếng|giờ|h/.test(m[2]) ? n * 60 : n;
}

// Đặt lại toàn bộ nhắc theo lịch lặp của từng habit.
//  repeat: "daily" | "weekly:0,2,4" (0=T2..6=CN) | "hours:2" (mỗi 2 tiếng)
let _lastSig = '';
export async function scheduleHabitReminders(habits: Habit[], variant?: string): Promise<void> {
  // Chỉ lên lịch LẠI khi habit HOẶC persona đổi — tránh reschedule (và trên
  // simulator là re-bắn) mỗi lần Home focus.
  const sig = JSON.stringify([variant || '', (habits || []).map((h) => [h.name, h.time, h.repeat, h.hint])]);
  if (sig === _lastSig) return;
  _lastSig = sig;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    for (const h of habits) {
      const body = personaReminder(variant, h.name);  // nhắc theo GIỌNG persona
      const content = { title: 'Purrbo 🐾', body, data: { target: 'Main' } };
      const repeat = String(h.repeat || 'daily');

      // Mỗi X giờ — không cần giờ cố định
      if (repeat.startsWith('hours:')) {
        const n = Math.max(1, parseInt(repeat.split(':')[1], 10) || 1);
        await Notifications.scheduleNotificationAsync({
          content, trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: n * 3600, repeats: true, channelId: 'purrbo-reminders' } as any,
        });
        continue;
      }

      const m = String(h.time || '').match(/(\d{1,2})[:h](\d{0,2})/);
      if (!m) continue;
      const hour = Number(m[1]);
      const minute = Number(m[2] || 0);
      if (Number.isNaN(hour)) continue;

      // "nhắc trước X" → dời giờ nhắc SỚM lên leadMin phút.
      const leadMin = parseRemindLead(h.hint);

      // MỘT LẦN vào ngày cụ thể → trigger DATE (bỏ qua nếu đã quá giờ)
      if (repeat.startsWith('once:')) {
        const [y, mo, d] = repeat.slice(5).split('-').map((x) => parseInt(x, 10));
        const when = new Date(y, (mo || 1) - 1, d || 1, hour, minute, 0);
        when.setMinutes(when.getMinutes() - leadMin);   // Date tự xử lý qua ngày
        if (when.getTime() > Date.now()) {
          await Notifications.scheduleNotificationAsync({
            content, trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: when, channelId: 'purrbo-reminders' } as any,
          });
        }
        continue;
      }

      // Giờ nhắc (theo phút trong ngày) sau khi trừ lead — wrap 0..1439.
      const totalMin = (((hour * 60 + minute - leadMin) % 1440) + 1440) % 1440;
      const rHour = Math.floor(totalMin / 60);
      const rMin = totalMin % 60;
      // Lead vượt qua nửa đêm → lùi 1 ngày trong tuần (chỉ ảnh hưởng weekly).
      const dayShift = hour * 60 + minute - leadMin < 0 ? 1 : 0;

      if (repeat.startsWith('weekly:')) {
        const days = repeat.split(':')[1].split(',').map((x) => parseInt(x, 10)).filter((x) => x >= 0 && x <= 6);
        for (const d of days) {
          const dd = ((d - dayShift) % 7 + 7) % 7;
          await Notifications.scheduleNotificationAsync({
            content, trigger: { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday: expoWeekday(dd), hour: rHour, minute: rMin, channelId: 'purrbo-reminders' } as any,
          });
        }
        continue;
      }

      // daily
      await Notifications.scheduleNotificationAsync({
        content, trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: rHour, minute: rMin, channelId: 'purrbo-reminders' } as any,
      });
    }
  } catch {
    /* Expo Go có thể hạn chế — bỏ qua, không chặn app */
  }
}
