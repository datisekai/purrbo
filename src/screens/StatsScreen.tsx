import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors, fonts, radii, hardShadow, type AppColors } from '../theme';
import { Icon } from '../components/Icon';
import { useC, usePal } from '../themeContext';
import { Api } from '../api';

const CHART_H = 130;
const DOW = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

export default function StatsScreen({ navigation }) {
  const c = useC();
  const pal = usePal();
  const s = useMemo(() => mkStyles(c, pal), [c, pal]);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<7 | 30>(7);

  const statTile = (n: string | number, label: string, bg: string, col: string, icon: string) => (
    <View style={[s.tile, { backgroundColor: bg }]} key={label}>
      <Icon name={icon as any} size={16} color={col} />
      <Text style={[s.tileNum, { color: col }]}>{n}</Text>
      <Text style={s.tileLbl}>{label}</Text>
    </View>
  );

  const load = useCallback(async () => {
    try { setData(await Api.stats()); } catch {}
    setLoading(false);
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const days = data?.days || [];
  const shown = days.slice(-range);
  const maxCount = Math.max(1, ...shown.map((d: any) => d.count));
  const rangeDone = shown.reduce((a: number, d: any) => a + d.count, 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View style={s.hdr}>
          <Pressable onPress={() => navigation?.goBack?.()} style={s.back}>
            <Icon name="back" size={20} color={colors.ink} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={s.hTitle}>Thống kê</Text>
            <Text style={s.hSub}>hành trình chăm bản thân của cưng 💗</Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator color={c.purple} style={{ marginTop: 40 }} />
        ) : (
          <>
            <View style={s.tiles}>
              {statTile(data?.streak ?? 0, 'streak nay', pal.soft, c.coralDark, 'flamefill')}
              {statTile(data?.best_streak ?? 0, 'streak dài nhất', pal.soft, c.pinkDark, 'flame')}
              {statTile(data?.total_done ?? 0, 'tổng việc', pal.soft, c.mintDark, 'check')}
              {statTile(data?.active_days ?? 0, 'ngày chăm', pal.soft, c.purpleDark, 'calendar')}
            </View>

            <View style={s.chartCard}>
              <View style={s.chartTop}>
                <Text style={s.chartTitle}>Hoàn thành</Text>
                <View style={s.seg}>
                  {[7, 30].map((r) => {
                    const on = range === r;
                    return (
                      <Pressable key={r} onPress={() => setRange(r as 7 | 30)} style={[s.segItem, on && s.segItemOn]}>
                        <Text style={[s.segTxt, on && s.segTxtOn]}>{r} ngày</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={[s.chart, { height: CHART_H + 22 }]}>
                {shown.map((d: any, i: number) => {
                  const h = Math.max(d.count > 0 ? 6 : 2, (d.count / maxCount) * CHART_H);
                  const isToday = i === shown.length - 1;
                  const showLabel = range === 7 || i % 5 === 0 || isToday;
                  return (
                    <View key={d.ymd} style={s.barCol}>
                      <View style={{ height: CHART_H, justifyContent: 'flex-end', width: '100%', alignItems: 'center' }}>
                        <View style={[
                          s.bar,
                          { height: h, backgroundColor: isToday ? c.pinkDark : d.count > 0 ? c.purple : '#E7E0F2', width: range === 7 ? 22 : '68%' },
                        ]} />
                      </View>
                      <Text style={[s.barLbl, isToday && { color: c.pinkDark, fontFamily: fonts.heading }]}>
                        {showLabel ? d.dd : ''}
                      </Text>
                    </View>
                  );
                })}
              </View>

              <Text style={s.chartFoot}>
                {rangeDone} việc trong {range} ngày qua · TB {(rangeDone / range).toFixed(1)}/ngày
              </Text>
            </View>

            {(data?.total_done ?? 0) === 0 && (
              <View style={s.empty}>
                <Text style={s.emptyTxt}>Chưa có dữ liệu — khoe vài việc là biểu đồ bắt đầu lên nha 🐾</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const mkStyles = (c: AppColors, pal: any) => StyleSheet.create({
  hdr: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  back: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#fff', borderWidth: 2, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', ...hardShadow(3, 0.12) },
  hTitle: { fontFamily: fonts.display, fontSize: 20, color: colors.ink },
  hSub: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },

  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  tile: { width: '47%', flexGrow: 1, borderRadius: 18, padding: 14, borderWidth: 2, borderColor: '#fff', ...hardShadow(4, 0.12) },
  tileNum: { fontFamily: fonts.display, fontSize: 26, marginTop: 6 },
  tileLbl: { fontFamily: fonts.bodyBold, fontSize: 11.5, color: colors.muted, marginTop: 1 },

  chartCard: { backgroundColor: '#fff', borderWidth: 2, borderColor: colors.line, borderRadius: 24, padding: 16, ...hardShadow(5, 0.14) },
  chartTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  chartTitle: { fontFamily: fonts.display, fontSize: 16, color: colors.ink },
  seg: { flexDirection: 'row', gap: 4, backgroundColor: '#F0EAF6', borderRadius: radii.pill, padding: 3, borderWidth: 2, borderColor: colors.line },
  segItem: { paddingVertical: 5, paddingHorizontal: 12, borderRadius: radii.pill },
  segItemOn: { backgroundColor: colors.ink },
  segTxt: { fontFamily: fonts.heading, fontSize: 11, color: colors.muted },
  segTxtOn: { color: '#fff' },

  chart: { flexDirection: 'row', alignItems: 'flex-end' },
  barCol: { flex: 1, alignItems: 'center' },
  bar: { borderRadius: 6, minHeight: 2 },
  barLbl: { fontFamily: fonts.body, fontSize: 9, color: colors.muted, marginTop: 6, height: 12 },
  chartFoot: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.muted, marginTop: 10, textAlign: 'center' },

  empty: { backgroundColor: pal.soft, borderRadius: 18, padding: 18, marginTop: 16, borderWidth: 2, borderColor: '#fff' },
  emptyTxt: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, textAlign: 'center', lineHeight: 19 },
});
