import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { PurrboMascot } from './PersonaFace';

// Bắt lỗi render ở gốc: thay vì màn trắng, hiện linh vật + thông báo thân thiện
// + nút Thử lại + chi tiết kỹ thuật (thu gọn) để debug. KHÔNG bao giờ để trống.
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null; showDetail: boolean }
> {
  state = { error: null as Error | null, showDetail: false };

  static getDerivedStateFromError(error: Error) {
    return { error, showDetail: false };
  }

  componentDidCatch(error: Error) {
    // eslint-disable-next-line no-console
    console.log('[Purrbo] render error:', error?.message, error?.stack);
  }

  retry = () => this.setState({ error: null, showDetail: false });
  toggle = () => this.setState((p) => ({ ...p, showDetail: !p.showDetail }));

  render() {
    if (this.state.error) {
      const detail = String(this.state.error?.stack || this.state.error?.message || this.state.error);
      return (
        <View style={s.wrap}>
          <PurrboMascot size={116} />
          <Text style={s.title}>Ối, Purrbo vấp cục lỗi 🐾</Text>
          <Text style={s.sub}>Đừng lo nha, thử mở lại là thường hết. Nếu vẫn lỗi, chụp màn này gửi tụi mình.</Text>

          <Pressable onPress={this.retry} style={s.btn}>
            <Text style={s.btnTxt}>Thử lại</Text>
          </Pressable>

          <Pressable onPress={this.toggle} hitSlop={10}>
            <Text style={s.link}>{this.state.showDetail ? 'Ẩn chi tiết' : 'Xem chi tiết lỗi'}</Text>
          </Pressable>
          {this.state.showDetail && (
            <ScrollView style={s.detailBox}>
              <Text selectable style={s.detailTxt}>{detail}</Text>
            </ScrollView>
          )}
        </View>
      );
    }
    return this.props.children as any;
  }
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#FFF0F4', alignItems: 'center', justifyContent: 'center', padding: 30 },
  title: { marginTop: 18, fontSize: 21, fontWeight: '800', color: '#2E2A3F', textAlign: 'center' },
  sub: { marginTop: 8, fontSize: 14, color: '#8A8398', textAlign: 'center', lineHeight: 21, maxWidth: 320 },
  btn: { marginTop: 22, backgroundColor: '#FF4D8D', paddingVertical: 13, paddingHorizontal: 40, borderRadius: 999, borderBottomWidth: 3, borderBottomColor: '#D8306F' },
  btnTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },
  link: { marginTop: 16, fontSize: 13, color: '#8A8398', textDecorationLine: 'underline' },
  detailBox: { marginTop: 12, maxHeight: 220, alignSelf: 'stretch', backgroundColor: '#fff', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#F0DCE4' },
  detailTxt: { fontSize: 11.5, color: '#E0532F', lineHeight: 17 },
});
