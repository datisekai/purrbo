import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors, fonts, radii, hardShadow } from '../theme';
import { Icon } from '../components/Icon';
import { Api } from '../api';

const MEDAL = ['#FFC93C', '#C7CCD6', '#E29B5B']; // vàng · bạc · đồng (rank 1-3)

export default function LeaderboardScreen({ navigation }: any) {
  const [top, setTop] = useState<any[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await Api.leaderboard();
      setTop(Array.isArray(r?.top) ? r.top : []);
      setMyRank(r?.my_rank ?? null);
      setErr(false);
    } catch { setErr(true); }
    setLoading(false);
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = useCallback(async () => { setRefreshing(true); await load(); setRefreshing(false); }, [load]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ padding: 18, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.pink} colors={[colors.pink]} />}
      >
        <View style={s.hdr}>
          <Pressable onPress={() => navigation?.goBack?.()} style={s.back}>
            <Icon name="back" size={20} color={colors.ink} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={s.hTitle}>Bảng xếp hạng 🔥</Text>
            <Text style={s.hSub}>đọ streak với cả nhà Purrbo</Text>
          </View>
        </View>

        {myRank != null && (
          <View style={s.mineBanner}>
            <Icon name="flamefill" size={16} color="#fff" />
            <Text style={s.mineTxt}>Hạng của cưng: #{myRank}</Text>
          </View>
        )}

        {loading ? (
          <ActivityIndicator color={colors.pink} style={{ marginTop: 40 }} />
        ) : err ? (
          <View style={s.empty}>
            <Text style={s.emptyTxt}>Không tải được bảng xếp hạng 😿</Text>
            <Text style={s.emptySub}>Kéo xuống để thử lại nha</Text>
          </View>
        ) : top.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyTxt}>Chưa có ai lên bảng 🐾</Text>
            <Text style={s.emptySub}>Giữ streak để trở thành người đầu tiên!</Text>
          </View>
        ) : (
          top.map((u) => {
            const medal = u.rank <= 3 ? MEDAL[u.rank - 1] : null;
            return (
              <View key={u.rank} style={[s.row, u.me && s.rowMe]}>
                <View style={[s.rank, medal ? { backgroundColor: medal } : null]}>
                  <Text style={[s.rankTxt, medal ? { color: '#2E2A3F' } : null]}>{u.rank}</Text>
                </View>
                <Text style={[s.name, u.me && { color: colors.pinkDark }]} numberOfLines={1}>
                  {u.name}{u.me ? ' (cưng)' : ''}
                </Text>
                <View style={s.lv}><Icon name="heartfill" size={11} color={colors.pinkDark} /><Text style={s.lvTxt}>Lv.{u.level}</Text></View>
                <View style={s.streak}>
                  <Icon name="flamefill" size={13} color={colors.coralDark} />
                  <Text style={s.streakTxt}>{u.streak}</Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  hdr: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  back: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#fff', borderWidth: 2, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', ...hardShadow(3, 0.12) },
  hTitle: { fontFamily: fonts.display, fontSize: 20, color: colors.ink },
  hSub: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },

  mineBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.pink, borderRadius: 16, paddingVertical: 11, paddingHorizontal: 14, marginBottom: 16, borderWidth: 2, borderColor: '#fff', ...hardShadow(4, 0.16) },
  mineTxt: { fontFamily: fonts.display, fontSize: 15, color: '#fff' },

  row: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderWidth: 2, borderColor: colors.line, borderRadius: 18, paddingVertical: 11, paddingHorizontal: 12, marginBottom: 9, ...hardShadow(3, 0.1) },
  rowMe: { borderColor: colors.pink, backgroundColor: '#FFF6F9' },
  rank: { width: 30, height: 30, borderRadius: 10, backgroundColor: '#F0EAF6', alignItems: 'center', justifyContent: 'center' },
  rankTxt: { fontFamily: fonts.display, fontSize: 14, color: colors.muted },
  name: { flex: 1, minWidth: 0, fontFamily: fonts.heading, fontSize: 15, color: colors.ink },
  lv: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#FFEAF2', borderRadius: radii.pill, paddingVertical: 3, paddingHorizontal: 8 },
  lvTxt: { fontFamily: fonts.heading, fontSize: 11, color: colors.pinkDark },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFF0E6', borderRadius: radii.pill, paddingVertical: 4, paddingHorizontal: 9 },
  streakTxt: { fontFamily: fonts.heading, fontSize: 13, color: colors.coralDark },

  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyTxt: { fontFamily: fonts.display, fontSize: 16, color: colors.ink },
  emptySub: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: 4 },
});
