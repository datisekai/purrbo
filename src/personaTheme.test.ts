import { personaPalette, personaTheme } from './personaTheme';

const VARIANTS = ['mun', 'cam', 'ly', 'sep', 'bong', 'xu', 'bo', 'sin'];

describe('personaPalette', () => {
  it('đủ 8 persona, mỗi cái đủ 4 màu hex hợp lệ', () => {
    for (const v of VARIANTS) {
      const p = personaPalette(v);
      for (const k of ['primary', 'primaryDark', 'surface', 'soft'] as const) {
        expect(p[k]).toMatch(/^#[0-9A-Fa-f]{6}$/);
      }
    }
  });

  it('variant lạ / rỗng → NEUTRAL (không crash)', () => {
    expect(personaPalette('khong-co')).toEqual(personaPalette(undefined));
    expect(personaPalette('').primary).toBe(personaPalette(undefined).primary);
  });

  it('mỗi persona có primary KHÁC nhau (không trùng tông)', () => {
    const primaries = VARIANTS.map((v) => personaPalette(v).primary);
    expect(new Set(primaries).size).toBe(VARIANTS.length);
  });

  it('primaryDark khác primary (đủ tương phản cho viền/pressed)', () => {
    for (const v of VARIANTS) {
      const p = personaPalette(v);
      expect(p.primaryDark).not.toBe(p.primary);
    }
  });
});

describe('personaTheme (tương thích cũ)', () => {
  it('trả surface + soft', () => {
    const t = personaTheme('cam');
    expect(t.surface).toBe(personaPalette('cam').surface);
    expect(t.soft).toBe(personaPalette('cam').soft);
  });
});
