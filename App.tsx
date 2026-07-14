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
import { AuthProvider } from './src/auth';
import { ensureNotifPermission, registerPushToken } from './src/notifications';
import { initSound } from './src/sound';

const queryClient = new QueryClient();  // AD-10

export default function App() {
  const [loaded] = useFonts({
    Baloo2_600SemiBold, Baloo2_700Bold, Baloo2_800ExtraBold,
    BeVietnamPro_600SemiBold, BeVietnamPro_700Bold, BeVietnamPro_800ExtraBold,
  });

  useEffect(() => {
    ensureNotifPermission();  // AD-9: xin quyền + tạo Android channel
    registerPushToken();      // remote push (chỉ dev build; Expo Go tự bỏ qua)
    initSound();              // nhạc nền + sfx (bọc try/catch, thiếu module không sao)
  }, []);

  if (!loaded) return null;
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <NavigationContainer>
            <RootNav />
          </NavigationContainer>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
