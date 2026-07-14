import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useFonts,
  Baloo2_600SemiBold, Baloo2_700Bold, Baloo2_800ExtraBold,
} from '@expo-google-fonts/baloo-2';
import {
  BeVietnamPro_600SemiBold, BeVietnamPro_700Bold, BeVietnamPro_800ExtraBold,
} from '@expo-google-fonts/be-vietnam-pro';
import RootNav from './src/navigation/RootNav';
import { navigationRef } from './src/navigation/ref';
import { AuthProvider } from './src/auth';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { ensureNotifPermission, registerPushToken, setupNotificationNavigation } from './src/notifications';
import { initSound } from './src/sound';

const queryClient = new QueryClient();  // AD-10

export default function App() {
  const [loaded, error] = useFonts({
    Baloo2_600SemiBold, Baloo2_700Bold, Baloo2_800ExtraBold,
    BeVietnamPro_600SemiBold, BeVietnamPro_700Bold, BeVietnamPro_800ExtraBold,
  });

  useEffect(() => {
    // Mọi init khởi động đều bọc try/catch — lỗi phụ trợ KHÔNG được làm trắng app.
    try { ensureNotifPermission(); } catch {}
    try { registerPushToken(); } catch {}
    try { initSound(); } catch {}
    let off: any;
    try { off = setupNotificationNavigation(); } catch {}
    return () => { try { off && off(); } catch {} };
  }, []);

  // Font lỗi vẫn render (rơi về font hệ thống) — tránh màn hình trắng vĩnh viễn.
  if (!loaded && !error) return null;

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <NavigationContainer ref={navigationRef}>
              <RootNav />
            </NavigationContainer>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
