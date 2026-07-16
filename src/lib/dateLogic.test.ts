import {
  parseHM, ymd, dowIdx, expoWeekday, matchesDate, parseRepeat, buildRepeat, parseRemindLead,
} from './dateLogic';

describe('parseHM', () => {
  it('parse HH:MM và Hh', () => {
    expect(parseHM('07:00')).toBe(420);
    expect(parseHM('7h')).toBe(420);
    expect(parseHM('7h30')).toBe(450);
    expect(parseHM('18:30')).toBe(1110);
    expect(parseHM('23:59')).toBe(1439);
  });
  it('rỗng/sai → null', () => {
    expect(parseHM('')).toBeNull();
    expect(parseHM('abc')).toBeNull();
    expect(parseHM(undefined)).toBeNull();
  });
});

describe('ymd (local, không UTC)', () => {
  it('format + padding', () => {
    expect(ymd(new Date(2026, 6, 16))).toBe('2026-07-16'); // tháng 0-index
    expect(ymd(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(ymd(new Date(2026, 11, 31))).toBe('2026-12-31');
  });
});

describe('dowIdx (getDay → 0=T2..6=CN)', () => {
  it('map đúng', () => {
    expect(dowIdx(1)).toBe(0); // Mon → T2=0
    expect(dowIdx(2)).toBe(1); // Tue → T3=1
    expect(dowIdx(6)).toBe(5); // Sat → T7=5
    expect(dowIdx(0)).toBe(6); // Sun → CN=6
  });
});

describe('expoWeekday (0=T2 → 1=CN..7=T7)', () => {
  it('map đúng', () => {
    expect(expoWeekday(0)).toBe(2); // T2
    expect(expoWeekday(1)).toBe(3); // T3
    expect(expoWeekday(5)).toBe(7); // T7
    expect(expoWeekday(6)).toBe(1); // CN
  });
});

describe('matchesDate — trái tim của "hôm nay"', () => {
  // 2026-07-16 là Thứ Năm (getDay=4)
  it('once: đúng ngày', () => {
    expect(matchesDate('once:2026-07-16', '2026-07-16', 4)).toBe(true);
    expect(matchesDate('once:2026-07-17', '2026-07-16', 4)).toBe(false); // mai không hiện hôm nay
    expect(matchesDate('once:2026-07-15', '2026-07-16', 4)).toBe(false); // hôm qua
  });
  it('daily/hours: luôn true', () => {
    expect(matchesDate('daily', '2026-07-16', 4)).toBe(true);
    expect(matchesDate('hours:2', '2026-07-16', 4)).toBe(true);
    expect(matchesDate(undefined, '2026-07-16', 4)).toBe(true);
  });
  it('weekly: đúng thứ', () => {
    expect(matchesDate('weekly:3', '2026-07-16', 4)).toBe(true);   // T5 (getDay4→idx3)
    expect(matchesDate('weekly:0,2,4', '2026-07-16', 4)).toBe(false); // T5 ∉ {T2,T4,T6}
    expect(matchesDate('weekly:6', '2026-07-19', 0)).toBe(true);   // CN (getDay0→idx6)
    expect(matchesDate('weekly:0', '2026-07-19', 0)).toBe(false);
  });
});

describe('parseRepeat', () => {
  it('once/weekly/hours/daily', () => {
    expect(parseRepeat('once:2026-07-17')).toMatchObject({ mode: 'once', date: '2026-07-17' });
    expect(parseRepeat('weekly:0,2,4')).toMatchObject({ mode: 'weekly', days: [0, 2, 4] });
    expect(parseRepeat('hours:2')).toMatchObject({ mode: 'hours', every: 2 });
    expect(parseRepeat(undefined)).toMatchObject({ mode: 'daily' });
    expect(parseRepeat('weekly:9').days).toEqual([]); // filter 0..6
  });
});

describe('buildRepeat', () => {
  it('dựng chuỗi + sort weekly', () => {
    expect(buildRepeat('once', '2026-07-17', [], 2)).toBe('once:2026-07-17');
    expect(buildRepeat('weekly', '', [4, 0, 2], 2)).toBe('weekly:0,2,4');
    expect(buildRepeat('hours', '', [], 3)).toBe('hours:3');
    expect(buildRepeat('daily', '', [], 2)).toBe('daily');
  });
});

describe('parseRemindLead', () => {
  it('phút/tiếng', () => {
    expect(parseRemindLead('nhắc trước 1 tiếng')).toBe(60);
    expect(parseRemindLead('nhắc trước 15 phút')).toBe(15);
    expect(parseRemindLead('nhắc trước 2 giờ')).toBe(120);
    expect(parseRemindLead('với crush')).toBe(0);
    expect(parseRemindLead(undefined)).toBe(0);
  });
});
