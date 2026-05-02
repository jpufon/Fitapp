import './global.css';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  createNativeStackNavigator,
  type NativeStackNavigationProp,
} from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import {
  Home as HomeIcon,
  Dumbbell,
  Calendar as CalendarIcon,
  Bot,
  Trophy,
} from 'lucide-react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors, spacing, typography } from './theme';
import type { WorkoutSummary } from './lib/workouts';
import { apiQuery, hasApiConfig } from './lib/api';
import { configureQueryClient, queryClient } from './lib/queryClient';
import { useSyncBootstrap } from './hooks/useSyncBootstrap';
import { hasSupabaseConfig, supabase } from './utils/supabase';

// Screens
import AuthScreen from './screens/AuthScreen';
import OnboardingFlowScreen from './screens/OnboardingFlowScreen';
import HomeScreen from './screens/HomeScreen';
import TrainScreen from './screens/TrainScreen';
import CalendarScreen from './screens/CalendarScreen';
import ArenaScreen from './screens/ArenaScreen';
import ProfileScreen from './screens/ProfileScreen';
import ActiveWorkoutScreen from './screens/ActiveWorkoutScreen';
import SettingsScreen from './screens/SettingsScreen';
import ProfileDestinationScreen from './screens/ProfileDestinationScreen';
import DevScreen from './screens/DevScreen';
import WorkoutCompleteScreen from './screens/WorkoutCompleteScreen';
import NutritionLogScreen from './screens/NutritionLogScreen';
import CoachScreen from './screens/CoachScreen';
import WaliRunScreen from './screens/WaliRunScreen';
import { FriendsScreen, BadgesScreen } from './screens/ArenaExtendedScreens';
import { TreeDetailScreen } from './screens/RemainingScreens';
import WorkoutBuilderScreen from './screens/WorkoutBuilderScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<RootStackParamList>();

export type RootStackParamList = {
  Boot: undefined;
  Auth: undefined;
  OnboardingFlow: undefined;
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
  Profile: undefined;
  Dev: undefined;
  WorkoutComplete: undefined;
  NutritionLog: undefined;
  Coach: undefined;
  WaliRun: undefined;
  Friends: undefined;
  Badges: undefined;
  TreeDetail: undefined;
  WorkoutBuilder: undefined;
};

const TAB_ICONS: Record<string, React.ComponentType<{ size: number; color: string; strokeWidth?: number }>> = {
  Home: HomeIcon,
  Train: Dumbbell,
  Calendar: CalendarIcon,
  Coach: Bot,
  Arena: Trophy,
};

type RootNav = NativeStackNavigationProp<RootStackParamList>;

type MeResponse = {
  user?: {
    onboardingComplete?: boolean;
    onboardingStep?: string | null;
  };
};

function BootScreen() {
  const navigation = useNavigation<RootNav>();
  const [error, setError] = useState<string | null>(null);

  const routeFromAuthState = useCallback(async () => {
    setError(null);

    const hasDevToken = Boolean(process.env.EXPO_PUBLIC_DEV_JWT);
    const session = supabase ? (await supabase.auth.getSession()).data.session : null;

    if (!session && !hasDevToken) {
      navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
      return;
    }

    if (!hasApiConfig) {
      setError('Missing EXPO_PUBLIC_API_URL.');
      return;
    }

    try {
      const me = await apiQuery<MeResponse>('/me');
      navigation.reset({
        index: 0,
        routes: [{ name: me.user?.onboardingComplete ? 'MainTabs' : 'OnboardingFlow' }],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load your profile.');
    }
  }, [navigation]);

  useEffect(() => {
    void routeFromAuthState();
  }, [routeFromAuthState]);

  return (
    <View style={bootStyles.container}>
      <ActivityIndicator color={colors.primary} />
      <Text style={bootStyles.title}>Loading waliFit</Text>
      {error ? (
        <Text style={bootStyles.error} onPress={() => void routeFromAuthState()}>
          {error} Tap to retry.
        </Text>
      ) : null}
      {!hasSupabaseConfig ? (
        <Text style={bootStyles.note}>Supabase config missing. Sign-in is disabled until .env is configured.</Text>
      ) : null}
    </View>
  );
}

function AuthScreenWrapper() {
  const navigation = useNavigation<RootNav>();
  return <AuthScreen onAuthComplete={() => navigation.replace('Boot')} />;
}

function OnboardingFlowScreenWrapper() {
  const navigation = useNavigation<RootNav>();
  return (
    <OnboardingFlowScreen
      onComplete={() =>
        navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] })
      }
    />
  );
}

function FriendsScreenWrapper() {
  const navigation = useNavigation<RootNav>();
  return <FriendsScreen onBack={() => navigation.goBack()} />;
}

function BadgesScreenWrapper() {
  const navigation = useNavigation<RootNav>();
  return <BadgesScreen onBack={() => navigation.goBack()} />;
}

function TreeDetailScreenWrapper() {
  const navigation = useNavigation<RootNav>();
  return <TreeDetailScreen onClose={() => navigation.goBack()} />;
}

function MainTabs() {
  return (
    <Tab.Navigator
      detachInactiveScreens
      screenOptions={({ route }) => ({
        headerShown: false,
        lazy: true,
        freezeOnBlur: true,
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
          const Icon = TAB_ICONS[route.name] ?? HomeIcon;
          return <Icon size={size} color={color} strokeWidth={focused ? 2.25 : 1.75} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Train" component={TrainScreen} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="Coach" component={CoachScreen} />
      <Tab.Screen name="Arena" component={ArenaScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  useEffect(() => {
    configureQueryClient();
  }, []);

  useSyncBootstrap();

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <QueryClientProvider client={queryClient}>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Boot" screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Boot" component={BootScreen} />
            <Stack.Screen name="Auth" component={AuthScreenWrapper} />
            <Stack.Screen name="OnboardingFlow" component={OnboardingFlowScreenWrapper} />
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen
              name="ActiveWorkout"
              component={ActiveWorkoutScreen}
              options={{
                presentation: 'fullScreenModal',
                gestureEnabled: false,
              }}
            />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="WaliAI" component={ProfileDestinationScreen} />
            <Stack.Screen name="Analytics" component={ProfileDestinationScreen} />
            <Stack.Screen name="Notifications" component={ProfileDestinationScreen} />
            <Stack.Screen name="AccountSettings" component={ProfileDestinationScreen} />
            <Stack.Screen name="PrivacyLegal" component={ProfileDestinationScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Dev" component={DevScreen} />
            <Stack.Screen name="WorkoutComplete" component={WorkoutCompleteScreen} />
            <Stack.Screen name="NutritionLog" component={NutritionLogScreen} />
            <Stack.Screen name="Coach" component={CoachScreen} />
            <Stack.Screen name="WaliRun" component={WaliRunScreen} />
            <Stack.Screen name="Friends" component={FriendsScreenWrapper} />
            <Stack.Screen name="Badges" component={BadgesScreenWrapper} />
            <Stack.Screen name="TreeDetail" component={TreeDetailScreenWrapper} />
            <Stack.Screen name="WorkoutBuilder" component={WorkoutBuilderScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const bootStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.background,
  },
  title: {
    color: colors.foreground,
    fontSize: typography.fontSize.base,
    fontWeight: '700',
  },
  error: {
    color: colors.destructive,
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
  },
  note: {
    color: colors.mutedForeground,
    fontSize: typography.fontSize.xs,
    textAlign: 'center',
  },
});
