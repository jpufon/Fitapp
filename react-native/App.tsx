import './global.css';
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { QueryClientProvider } from '@tanstack/react-query';
import { colors } from './theme';
import type { WorkoutSummary } from './lib/workouts';
import { configureQueryClient, queryClient } from './lib/queryClient';

// Screens
import OnboardingScreen from './screens/OnboardingScreen';
import HomeScreen from './screens/HomeScreen';
import TrainScreen from './screens/TrainScreen';
import CalendarScreen from './screens/CalendarScreen';
import ArenaScreen from './screens/ArenaScreen';
import ProfileScreen from './screens/ProfileScreen';
import ActiveWorkoutScreen from './screens/ActiveWorkoutScreen';
import SettingsScreen from './screens/SettingsScreen';
import ProfileDestinationScreen from './screens/ProfileDestinationScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<RootStackParamList>();

export type RootStackParamList = {
  Welcome: undefined;
  MainTabs: undefined;
  ActiveWorkout: {
    workout: WorkoutSummary;
  };
  Settings: undefined;
  WaliAI: undefined;
  Analytics: undefined;
  Notifications: undefined;
  AccountSettings: undefined;
  PrivacyLegal: undefined;
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card + 'CC',
          borderTopColor: colors.border + '80',
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: 8,
          height: 70,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Train') {
            iconName = focused ? 'barbell' : 'barbell-outline';
          } else if (route.name === 'Calendar') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Arena') {
            iconName = focused ? 'trophy' : 'trophy-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'home-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Train" component={TrainScreen} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="Arena" component={ArenaScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  useEffect(() => {
    configureQueryClient();
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <QueryClientProvider client={queryClient}>
        <NavigationContainer>
          <Stack.Navigator initialRouteName={onboardingComplete ? 'MainTabs' : 'Welcome'}>
            <Stack.Screen
              name="Welcome"
              options={{ headerShown: false }}
            >
              {({ navigation }) => (
                <OnboardingScreen
                  onComplete={() => {
                    setOnboardingComplete(true);
                    navigation.reset({
                      index: 0,
                      routes: [{ name: 'MainTabs' }],
                    });
                  }}
                />
              )}
            </Stack.Screen>
            <Stack.Screen
              name="MainTabs"
              component={MainTabs}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="ActiveWorkout"
              component={ActiveWorkoutScreen}
              options={{
                headerShown: false,
                presentation: 'fullScreenModal',
                gestureEnabled: false,
              }}
            />
            <Stack.Screen
              name="Settings"
              component={SettingsScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen name="WaliAI" component={ProfileDestinationScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Analytics" component={ProfileDestinationScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Notifications" component={ProfileDestinationScreen} options={{ headerShown: false }} />
            <Stack.Screen name="AccountSettings" component={ProfileDestinationScreen} options={{ headerShown: false }} />
            <Stack.Screen name="PrivacyLegal" component={ProfileDestinationScreen} options={{ headerShown: false }} />
          </Stack.Navigator>
        </NavigationContainer>
      </QueryClientProvider>
    </>
  );
}
