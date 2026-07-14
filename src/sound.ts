// Âm thanh + haptics cho Purrbo (expo-audio). Tất cả bọc try/catch để
// Expo Go / thiết bị thiếu module không làm sập app. Trạng thái bật/tắt
// lưu ở AsyncStorage (SFX + nhạc nền tách riêng).
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

let AudioMod: any = null;
try { AudioMod = require('expo-audio'); } catch {}

type Player = any;
let tap: Player = null;
let success: Player = null;
let open: Player = null;
let bg: Player = null;

let sfxOn = true;
let bgOn = true;
let inited = false;

const KEY = 'purrbo.sound';

export async function initSound(): Promise<void> {
  if (inited || !AudioMod) return;
  inited = true;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) {
      const j = JSON.parse(raw);
      if (typeof j.sfx === 'boolean') sfxOn = j.sfx;
      if (typeof j.bg === 'boolean') bgOn = j.bg;
    }
  } catch {}
  try {
    await AudioMod.setAudioModeAsync({ playsInSilentMode: true });
  } catch {}
  try {
    tap = AudioMod.createAudioPlayer(require('../assets/audio/tap.wav'));
    success = AudioMod.createAudioPlayer(require('../assets/audio/success.wav'));
    open = AudioMod.createAudioPlayer(require('../assets/audio/open.wav'));
    bg = AudioMod.createAudioPlayer(require('../assets/audio/bg.wav'));
    if (tap) tap.volume = 0.55;
    if (success) success.volume = 0.7;
    if (open) open.volume = 0.7;
    if (bg) { bg.loop = true; bg.volume = 0.32; }
  } catch {}
  if (bgOn) startBg();
}

function replay(p: Player) {
  if (!p) return;
  try { p.seekTo(0); } catch {}
  try { p.play(); } catch {}
}

export function playTap(): void {
  if (sfxOn) replay(tap);
  try { Haptics.selectionAsync(); } catch {}
}
export function playSuccess(): void {
  if (sfxOn) replay(success);
  try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
}
export function playOpen(): void {
  if (sfxOn) replay(open);
  try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
}

export function startBg(): void { try { bg?.play(); } catch {} }
export function stopBg(): void { try { bg?.pause(); } catch {} }

export function isSfxOn(): boolean { return sfxOn; }
export function isBgOn(): boolean { return bgOn; }

async function persist(): Promise<void> {
  try { await AsyncStorage.setItem(KEY, JSON.stringify({ sfx: sfxOn, bg: bgOn })); } catch {}
}
export async function setSfx(v: boolean): Promise<void> { sfxOn = v; await persist(); }
export async function setBg(v: boolean): Promise<void> {
  bgOn = v;
  if (v) startBg(); else stopBg();
  await persist();
}
