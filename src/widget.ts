// Cầu nối app RN → Widget iOS (WidgetKit) qua App Group.
// Ghi JSON vào UserDefaults(suiteName: group.com.purrbo.app) key "purrbo_widget"
// (gồm cả token + apiBase để nút "Xong" trên widget gọi khoe được), rồi reload.
//
// Cần cài (docs/widget-setup.md):
//   npx expo install react-native-shared-group-preferences react-native-widgetkit
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE } from './api';

const APP_GROUP = 'group.com.purrbo.app';
const KEY = 'purrbo_widget';
const TOKEN_KEY = 'purrbo.token';   // trùng với api.ts

let SharedGroupPreferences: any = null;
let WidgetKit: any = null;
try { SharedGroupPreferences = require('react-native-shared-group-preferences').default; } catch {}
try { WidgetKit = require('react-native-widgetkit').WidgetKit; } catch {}

// Dữ liệu hiển thị + hành động cho widget. next = việc kế tiếp (để nút Xong khoe).
export type WidgetData = {
  personaVariant: string;
  nextId: number;
  nextName: string;
  nextTime: string;
  done: number;
  total: number;
  streak: number;
};

export async function pushWidget(data: WidgetData): Promise<void> {
  if (Platform.OS !== 'ios' || !SharedGroupPreferences) return;
  try {
    const token = (await AsyncStorage.getItem(TOKEN_KEY)) || '';
    // token + apiBase để AppIntent trên widget gọi POST /v1/habits/{id}/khoe.
    const payload = { ...data, token, apiBase: API_BASE };
    await SharedGroupPreferences.setItem(KEY, JSON.stringify(payload), APP_GROUP);
    WidgetKit?.reloadAllTimelines?.();
  } catch {
    // widget không cập nhật được thì thôi, không ảnh hưởng app.
  }
}
