// Cầu nối app RN → Widget iOS (WidgetKit) qua App Group.
// Ghi JSON vào UserDefaults(suiteName: group.com.purrbo.app) key "purrbo_widget",
// rồi gọi reload timeline để widget cập nhật ngay.
//
// Cần cài (xem docs/widget-setup.md):
//   npx expo install react-native-shared-group-preferences react-native-widgetkit
// Chưa cài → require an toàn, app vẫn chạy (chỉ là widget không cập nhật).
import { Platform } from 'react-native';

const APP_GROUP = 'group.com.purrbo.app';
const KEY = 'purrbo_widget';

// Load lib mềm — không có cũng không làm crash app (dev/Expo Go).
let SharedGroupPreferences: any = null;
let WidgetKit: any = null;
try { SharedGroupPreferences = require('react-native-shared-group-preferences').default; } catch {}
try { WidgetKit = require('react-native-widgetkit').WidgetKit; } catch {}

export type WidgetData = {
  personaName: string;
  line: string;
  nextName: string;
  nextTime: string;
  done: number;
  total: number;
  streak: number;
};

// Gọi mỗi khi dữ liệu Home đổi (load, khoe, tạo/xoá việc…).
export async function pushWidget(data: WidgetData): Promise<void> {
  if (Platform.OS !== 'ios' || !SharedGroupPreferences) return;
  try {
    // Lưu dạng CHUỖI JSON (Swift đọc bằng defaults.string(forKey:) rồi decode).
    await SharedGroupPreferences.setItem(KEY, JSON.stringify(data), APP_GROUP);
    WidgetKit?.reloadAllTimelines?.();
  } catch {
    // im lặng — widget không cập nhật được thì thôi, không ảnh hưởng app.
  }
}
