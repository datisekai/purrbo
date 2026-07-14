import React from 'react';
import { View, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors, fonts } from '../theme';
import { Icon } from '../components/Icon';
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

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const tabIcon = (name: string) => ({ focused }: { focused: boolean }) => (
  <Icon name={name} size={24} color={focused ? colors.pink : colors.muted} />
);
const tabLabel = (label: string) => ({ focused }: { focused: boolean }) => (
  <Text style={{ fontFamily: fonts.heading, fontSize: 10, color: focused ? colors.pink : colors.muted }}>{label}</Text>
);

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { height: 76, paddingBottom: 12, paddingTop: 8, borderTopWidth: 2, borderTopColor: colors.line, backgroundColor: '#fff' },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: tabIcon('home'), tabBarLabel: tabLabel('Home') }} />
      <Tab.Screen name="Lịch" component={CalendarScreen} options={{ tabBarIcon: tabIcon('calendar'), tabBarLabel: tabLabel('Lịch') }} />
      <Tab.Screen name="Shop" component={ShopScreen} options={{ tabBarIcon: tabIcon('gift'), tabBarLabel: tabLabel('Túi mù') }} />
      <Tab.Screen name="Mình" component={ProfileScreen} options={{ tabBarIcon: tabIcon('user'), tabBarLabel: tabLabel('Mình') }} />
    </Tab.Navigator>
  );
}

export default function RootNav() {
  const { ready, token, onboarded } = useAuth();

  if (!ready) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
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
          <Stack.Screen name="PersonaDetail" component={PersonaScreen} />
          <Stack.Screen name="Winback" component={WinbackScreen} options={{ presentation: 'modal' }} />
        </>
      )}
    </Stack.Navigator>
  );
}
