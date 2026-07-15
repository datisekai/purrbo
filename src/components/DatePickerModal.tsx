import React, { useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, fonts, radii, hardShadow } from '../theme';
import { Icon } from './Icon';

const DOW = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const MONTHS = ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'];
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Lịch chọn ngày thuần JS (không cần native module) — cho việc "một lần" chọn ngày bất kỳ.
export function DatePickerModal({
  visible,
  value,
  onSelect,
  onClose,
  minToday = true,
}: {
  visible: boolean;
  value: Date;
  onSelect: (d: Date) => void;
  onClose: () => void;
  minToday?: boolean;
}) {
  const [view, setView] = useState(() => new Date(value.getFullYear(), value.getMonth(), 1));

  // Reset tháng đang xem về tháng của value mỗi lần mở.
  React.useEffect(() => {
    if (visible) setView(new Date(value.getFullYear(), value.getMonth(), 1));
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selYmd = ymd(value);

  // Lưới 6 hàng × 7 cột, tuần bắt đầu Thứ 2.
  const first = new Date(view.getFullYear(), view.getMonth(), 1);
  const lead = (first.getDay() + 6) % 7; // 0=T2
  const daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(view.getFullYear(), view.getMonth(), d));
  while (cells.length % 7 !== 0) cells.push(null);

  const shift = (n: number) => setView(new Date(view.getFullYear(), view.getMonth() + n, 1));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose}>
        <Pressable style={s.card} onPress={() => {}}>
          <View style={s.hdr}>
            <Pressable onPress={() => shift(-1)} hitSlop={10} style={s.nav}>
              <Icon name="back" size={18} color={colors.ink} />
            </Pressable>
            <Text style={s.month}>{MONTHS[view.getMonth()]} · {view.getFullYear()}</Text>
            <Pressable onPress={() => shift(1)} hitSlop={10} style={[s.nav, { transform: [{ scaleX: -1 }] }]}>
              <Icon name="back" size={18} color={colors.ink} />
            </Pressable>
          </View>

          <View style={s.dowRow}>
            {DOW.map((d) => (
              <Text key={d} style={s.dow}>{d}</Text>
            ))}
          </View>

          <View style={s.grid}>
            {cells.map((c, i) => {
              if (!c) return <View key={i} style={s.cell} />;
              const isSel = ymd(c) === selYmd;
              const isToday = ymd(c) === ymd(today);
              const disabled = minToday && c < today;
              return (
                <Pressable
                  key={i}
                  disabled={disabled}
                  onPress={() => { onSelect(c); onClose(); }}
                  style={[s.cell, isSel && s.cellSel]}
                >
                  <Text style={[s.day, isToday && s.dayToday, isSel && s.daySel, disabled && s.dayOff]}>
                    {c.getDate()}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable onPress={onClose} style={s.closeBtn}>
            <Text style={s.closeTxt}>Đóng</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const CELL = 40;
const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(46,42,63,0.45)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 340, backgroundColor: '#fff', borderRadius: 24, borderWidth: 2, borderColor: colors.line, padding: 16, ...hardShadow(6, 0.2) },
  hdr: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  nav: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.bg, borderWidth: 2, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  month: { fontFamily: fonts.display, fontSize: 17, color: colors.ink },
  dowRow: { flexDirection: 'row', marginBottom: 4 },
  dow: { width: CELL, textAlign: 'center', fontFamily: fonts.heading, fontSize: 11, color: colors.muted },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: CELL, height: CELL, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  cellSel: { backgroundColor: colors.purple },
  day: { fontFamily: fonts.body, fontSize: 15, color: colors.ink },
  dayToday: { fontFamily: fonts.heading, color: colors.purpleDark },
  daySel: { color: '#fff', fontFamily: fonts.display },
  dayOff: { color: '#CBC7D6' },
  closeBtn: { alignSelf: 'center', marginTop: 8, paddingVertical: 8, paddingHorizontal: 20 },
  closeTxt: { fontFamily: fonts.heading, fontSize: 14, color: colors.muted },
});
