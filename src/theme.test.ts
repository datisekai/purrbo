import { colors, makeColors } from './theme';
import { personaPalette } from './personaTheme';

describe('makeColors — monochrome theo persona', () => {
  it('mọi màu brand quy về primary/primaryDark của persona (hết hồng khi persona xanh)', () => {
    const pal = personaPalette('xu'); // mint/xanh
    const c = makeColors(pal);
    for (const k of ['pink', 'purple', 'yellow', 'mint', 'sky', 'coral'] as const) {
      expect(c[k]).toBe(pal.primary);
    }
    for (const k of ['pinkDark', 'purpleDark', 'yellowDark', 'mintDark', 'skyDark', 'coralDark'] as const) {
      expect(c[k]).toBe(pal.primaryDark);
    }
    // KHÔNG còn hồng brand cũ ở bất kỳ token brand nào
    expect(Object.values(c)).not.toContain(colors.pink);
  });

  it('giữ neutral + ĐỎ cho hành động xoá', () => {
    const c = makeColors(personaPalette('xu'));
    expect(c.ink).toBe(colors.ink);
    expect(c.muted).toBe(colors.muted);
    expect(c.line).toBe(colors.line);
    expect(c.bg).toBe(colors.bg);
    expect(c.danger).toBe(colors.danger);   // đỏ KHÔNG bị đổi theo persona
  });

  it('rarity vẫn phân biệt được bằng 3 sắc độ cùng tông', () => {
    const pal = personaPalette('cam');
    const c = makeColors(pal);
    expect(c.rRare).toBe(pal.primary);
    expect(c.rSSR).toBe(pal.primaryDark);
    expect(new Set([c.rCommon, c.rRare, c.rSSR]).size).toBe(3);
  });

  it('đổi persona → đổi tông toàn bộ', () => {
    const xanh = makeColors(personaPalette('xu'));
    const cam = makeColors(personaPalette('cam'));
    expect(xanh.pink).not.toBe(cam.pink);
  });
});
