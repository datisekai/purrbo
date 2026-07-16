import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, radii, hardShadow, type AppColors } from '../theme';
import { useC, usePal } from '../themeContext';
import { Icon } from '../components/Icon';
import { PurrboMascot } from './PersonaFace';

// Bản xem trước WIDGET màn hình chính: "hôm nay có gì · sắp tới gì".
// Widget native thật (WidgetKit iOS / Glance Android) cần dev build — đây là
// thiết kế/preview trong app để chốt bố cục trước khi dựng native.
type Habit = { id?: any; name: string; icon?: string; time?: string; done?: boolean };

export function WidgetPreview({ habits = [], dateLabel = 'Hôm nay' }: { habits?: Habit[]; dateLabel?: string }) {
  const c = useC();
  const pal = usePal();
  const s = useMemo(() => mkStyles(c, pal), [c, pal]);
  // Mọi icon tint đều về 1 tông persona.
  const tint = (_ic: string) => ({ bg: pal.soft, col: c.purpleDark });
  const pending = habits.filter((h) => !h.done);
  const next = pending[0];
  const upcoming = pending[1];
  const doneCount = habits.length - pending.length;

  return (
    <View>
      <View style={s.tagRow}>
        <Icon name="sparkles" size={13} color={c.purpleDark} />
        <Text style={s.tag}>Widget màn hình chính</Text>
        <Text style={s.tagHint}>xem trước</Text>
      </View>

      <View style={s.widget}>
        {/* Header */}
        <View style={s.head}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
            <PurrboMascot size={24} />
            <Text style={s.brand}>Purrbo</Text>
          </View>
          <Text style={s.date}>{dateLabel}</Text>
        </View>

        {/* Next up */}
        {next ? (
          <View style={s.nextRow}>
            <View style={[s.nIc, { backgroundColor: tint(next.icon || '').bg }]}>
              <Icon name={(next.icon as any) || 'droplet'} size={20} color={tint(next.icon || '').col} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={s.nLabel}>Việc kế tiếp</Text>
              <Text style={s.nName} numberOfLines={1}>{next.name}</Text>
            </View>
            {!!next.time && <Text style={s.nTime}>{next.time}</Text>}
          </View>
        ) : (
          <View style={s.allDone}>
            <Icon name="heartfill" size={16} color={c.pink} />
            <Text style={s.allDoneTxt}>Xong hết rồi, giỏi xỉu 💗</Text>
          </View>
        )}

        {/* Footer: đếm + sắp tới */}
        <View style={s.foot}>
          <View style={s.pill}>
            <Icon name="check" size={11} color={c.mintDark} />
            <Text style={s.pillTxt}>{doneCount}/{habits.length} xong</Text>
          </View>
          {upcoming ? (
            <View style={s.soon}>
              <Icon name="clock" size={11} color={colors.muted} />
              <Text style={s.soonTxt} numberOfLines={1}>Sắp tới: {upcoming.name}{upcoming.time ? ` · ${upcoming.time}` : ''}</Text>
            </View>
          ) : (
            <Text style={s.soonTxt}>không còn việc nào phía sau</Text>
          )}
        </View>
      </View>

      <Text style={s.note}>Bản build thật sẽ gắn được ra màn hình chính (iOS/Android).</Text>
    </View>
  );
}

const mkStyles = (c: AppColors, pal: any) => StyleSheet.create({
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8, marginHorizontal: 4 },
  tag: { fontFamily: fonts.heading, fontSize: 13, color: c.purpleDark },
  tagHint: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.muted },

  widget: {
    backgroundColor: pal.soft, borderRadius: 24, padding: 15,
    borderWidth: 2, borderColor: pal.surface, ...hardShadow(6, 0.16),
  },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  brand: { fontFamily: fonts.display, fontSize: 15, color: colors.ink },
  date: { fontFamily: fonts.heading, fontSize: 12, color: colors.muted },

  nextRow: {
    flexDirection: 'row', alignItems: 'center', gap: 11,
    backgroundColor: '#fff', borderRadius: 16, padding: 11, ...hardShadow(3, 0.1),
  },
  nIc: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  nLabel: { fontFamily: fonts.bodyBold, fontSize: 10.5, color: colors.muted },
  nName: { fontFamily: fonts.heading, fontSize: 15, color: colors.ink },
  nTime: { fontFamily: fonts.display, fontSize: 14, color: c.purpleDark },

  allDone: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: '#fff', borderRadius: 16, padding: 13, ...hardShadow(3, 0.1),
  },
  allDoneTxt: { fontFamily: fonts.heading, fontSize: 14, color: colors.ink },

  foot: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 11 },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: pal.soft, borderColor: pal.surface, borderWidth: 1.5,
    borderRadius: radii.pill, paddingVertical: 4, paddingHorizontal: 9,
  },
  pillTxt: { fontFamily: fonts.heading, fontSize: 11, color: c.mintDark },
  soon: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: 0 },
  soonTxt: { flex: 1, fontFamily: fonts.body, fontSize: 11, color: colors.muted },

  note: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, marginTop: 8, marginHorizontal: 4 },
});
