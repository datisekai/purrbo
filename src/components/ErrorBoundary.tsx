import React from 'react';
import { View, Text, ScrollView } from 'react-native';

// Bắt lỗi render ở gốc: thay vì màn hình trắng, hiện thông báo + lỗi để debug.
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    // eslint-disable-next-line no-console
    console.log('[Purrbo] render error:', error?.message, error?.stack);
  }

  render() {
    if (this.state.error) {
      return (
        <View style={{ flex: 1, backgroundColor: '#fff', padding: 24, justifyContent: 'center' }}>
          <Text style={{ fontSize: 22, fontWeight: '800', color: '#2E2A3F' }}>Ối, có lỗi rồi 🐾</Text>
          <Text style={{ fontSize: 14, color: '#8A8398', marginTop: 8 }}>
            Purrbo gặp trục trặc khi khởi động. Thử mở lại app nha.
          </Text>
          <ScrollView style={{ marginTop: 16, maxHeight: 240 }}>
            <Text selectable style={{ fontSize: 12, color: '#E0532F' }}>
              {String(this.state.error?.message || this.state.error)}
            </Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children as any;
  }
}
