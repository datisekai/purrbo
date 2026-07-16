// Logic ngày/giờ/lặp THUẦN (không import RN) — 1 nguồn chân lý, unit-test được.
// repeat: 'daily' | 'weekly:d1,d2' (0=T2..6=CN) | 'hours:N' | 'once:YYYY-MM-DD'

// "07:00"→420 · "7h"→420 · "7h30"→450 · "18:30"→1110 · rỗng/sai→null
export function parseHM(t?: string): number | null {
  const m = String(t || '').match(/(\d{1,2})[:h](\d{0,2})/);
  return m ? Number(m[1]) * 60 + Number(m[2] || 0) : null;
}

// Date → 'YYYY-MM-DD' theo giờ LOCAL (không dính UTC).
export function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Date.getDay() (0=CN..6=T7) → index 0=T2..6=CN.
export function dowIdx(jsWeekday: number): number {
  return (jsWeekday + 6) % 7;
}

// index 0=T2..6=CN → weekday của expo-notifications (1=CN..7=T7).
export function expoWeekday(idx0Mon: number): number {
  return ((idx0Mon + 1) % 7) + 1;
}

// Việc (repeat) có áp dụng vào ngày `ymdStr` (jsWeekday = Date.getDay() của ngày đó) không?
export function matchesDate(repeat: string | undefined, ymdStr: string, jsWeekday: number): boolean {
  const rep = String(repeat || 'daily');
  if (rep.startsWith('once:')) return rep.slice(5) === ymdStr;
  if (rep.startsWith('weekly:')) {
    return rep.split(':')[1].split(',').map(Number).includes(dowIdx(jsWeekday));
  }
  return true; // daily · hours → mỗi ngày
}

export type RepeatMode = 'once' | 'daily' | 'weekly' | 'hours';

// 'once:2026-07-17' → {mode:'once',date:'2026-07-17'} · 'weekly:0,2,4' → {mode:'weekly',days:[0,2,4]} ...
export function parseRepeat(rep?: string): { mode: RepeatMode; days: number[]; every: number; date: string } {
  const r = String(rep || 'daily');
  if (r.startsWith('once:')) return { mode: 'once', days: [0, 2, 4], every: 2, date: r.slice(5) };
  if (r.startsWith('weekly:'))
    return { mode: 'weekly', days: r.split(':')[1].split(',').map(Number).filter((n) => n >= 0 && n <= 6), every: 2, date: '' };
  if (r.startsWith('hours:')) return { mode: 'hours', days: [0, 2, 4], every: parseInt(r.split(':')[1], 10) || 2, date: '' };
  return { mode: 'daily', days: [0, 2, 4], every: 2, date: '' };
}

// Dựng chuỗi repeat từ form.
export function buildRepeat(mode: RepeatMode, dateYmd: string, days: number[], every: number): string {
  if (mode === 'once') return 'once:' + dateYmd;
  if (mode === 'weekly') return 'weekly:' + [...days].sort((a, b) => a - b).join(',');
  if (mode === 'hours') return 'hours:' + every;
  return 'daily';
}

// "nhắc trước 1 tiếng"→60 · "nhắc trước 15 phút"→15 · không có→0
export function parseRemindLead(hint?: string): number {
  const m = String(hint || '').toLowerCase().match(/nhắc trước\s*(\d+)\s*(phút|tiếng|giờ|h)/);
  if (!m) return 0;
  const n = parseInt(m[1], 10) || 0;
  return m[2] === 'phút' ? n : n * 60;   // 'phút'→phút, còn lại (tiếng/giờ/h)→giờ
}
