import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors, fonts, type AppColors } from '../theme';
import { useC } from '../themeContext';
import { Icon } from '../components/Icon';
import { LoadingScreen } from '../components/LoadingScreen';
import { useAuth } from '../auth';

import HomeScreen from '../screens/HomeScreen';
import CalendarScreen from '../screens/CalendarScreen';
import ShopScreen from '../screens/ShopScreen';
import ProfileScreen from '../screens/ProfileScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import ChatScreen from '../screens/ChatScreen';
import AddScreen from '../screens/AddScreen';
import SettingsScreen from '../screens/SettingsScreen';
import PersonaScreen from '../screens/PersonaScreen';
import WinbackScreen from '../screens/WinbackScreen';
import NameScreen from '../screens/NameScreen';
import TopupScreen from '../screens/TopupScreen';
import CollectionScreen from '../screens/CollectionScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import RewardsScreen from '../screens/RewardsScreen';
import ItemsScreen from '../screens/ItemsScreen';
import GachaResultScreen from '../screens/GachaResultScreen';
import HabitEditScreen from '../screens/HabitEditScreen';
import StatsScreen from '../screens/StatsScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Màu tab active theo PERSONA → truyền c vào (không gọi hook trong hàm render của navigator).
const tabIcon = (name: string, c: AppColors) => ({ focused }: { focused: boolean }) => (
  <Icon name={name} size={24} color={focused ? c.pink : colors.muted} />
);
const tabLabel = (label: string, c: AppColors) => ({ focused }: { focused: boolean }) => (
  <Text style={{ fontFamily: fonts.heading, fontSize: 10, color: focused ? c.pink : colors.muted }}>{label}</Text>
);

function MainTabs() {
  const c = useC();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { height: 76, paddingBottom: 12, paddingTop: 8, borderTopWidth: 2, borderTopColor: colors.line, backgroundColor: '#fff' },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: tabIcon('home', c), tabBarLabel: tabLabel('Home', c) }} />
      <Tab.Screen name="Lịch" component={CalendarScreen} options={{ tabBarIcon: tabIcon('calendar', c), tabBarLabel: tabLabel('Lịch', c) }} />
      <Tab.Screen name="Nhiệm vụ" component={RewardsScreen} options={{ tabBarIcon: tabIcon('star', c), tabBarLabel: tabLabel('Nhiệm vụ', c) }} />
      <Tab.Screen name="Shop" component={ShopScreen} options={{ tabBarIcon: tabIcon('gift', c), tabBarLabel: tabLabel('Túi mù', c) }} />
      <Tab.Screen name="Mình" component={ProfileScreen} options={{ tabBarIcon: tabIcon('user', c), tabBarLabel: tabLabel('Mình', c) }} />
    </Tab.Navigator>
  );
}

export default function RootNav() {
  const { ready, token, onboarded } = useAuth();

  if (!ready) {
    // Màn khởi động: linh vật mèo cam animation (nền hồng-kem, KHÁC trắng #FFF)
    // → không bao giờ để màn trắng trơ; kẹt ở đây vẫn thấy mèo + "Đang khởi động".
    return <LoadingScreen message="Đang khởi động Purrbo…" sub="chờ xíu nha cưng 🐾" />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!token ? (
        <Stack.Screen name="Name" component={NameScreen} />
      ) : !onboarded ? (
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      ) : (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="Chat" component={ChatScreen} />
          <Stack.Screen name="AddTask" component={AddScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="Topup" component={TopupScreen} />
          <Stack.Screen name="Collection" component={CollectionScreen} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} />
          <Stack.Screen name="Rewards" component={RewardsScreen} />
          <Stack.Screen name="Items" component={ItemsScreen} />
          <Stack.Screen name="GachaResult" component={GachaResultScreen} options={{ presentation: 'modal' }} />
          <Stack.Screen name="HabitEdit" component={HabitEditScreen} />
          <Stack.Screen name="Stats" component={StatsScreen} />
          <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
          <Stack.Screen name="PersonaDetail" component={PersonaScreen} />
          <Stack.Screen name="Winback" component={WinbackScreen} options={{ presentation: 'modal' }} />
        </>
      )}
    </Stack.Navigator>
  );
}
