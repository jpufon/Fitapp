# waliFit — App.tsx

> `apps/mobile/App.tsx` — copy this file exactly

```typescript
// waliFit — Root App
// Navigation: React Navigation only. No expo-router.
// Tabs: Home · Train · Calendar · Coach · Arena (V1 Brief spec)
// Icons: lucide-react-native (migrate from Ionicons)

import React, { useState } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { StatusBar } from 'expo-status-bar'
import {
  Home,
  Dumbbell,
  Calendar,
  Bot,
  Trophy,
} from 'lucide-react-native'
import { colors, touchTarget, typography } from './theme'

// ─── Screen imports ───────────────────────────────────────────────────────────
import OnboardingScreen from './screens/OnboardingScreen'
import HomeScreen       from './screens/HomeScreen'
import TrainScreen      from './screens/TrainScreen'
import CalendarScreen   from './screens/CalendarScreen'
import CoachScreen      from './screens/CoachScreen'
import ArenaScreen      from './screens/ArenaScreen'

// ─── Navigator instances ─────────────────────────────────────────────────────
const Tab   = createBottomTabNavigator()
const Stack = createNativeStackNavigator()

// ─── Tab icon map ─────────────────────────────────────────────────────────────
const TAB_ICONS: Record<string, React.ElementType> = {
  Home:     Home,
  Train:    Dumbbell,
  Calendar: Calendar,
  Coach:    Bot,
  Arena:    Trophy,
}

// ─── Main tab navigator ───────────────────────────────────────────────────────
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const Icon = TAB_ICONS[route.name]
        return {
          headerShown: false,
          tabBarStyle: {
            backgroundColor:  colors.card,
            borderTopColor:   colors.border,
            borderTopWidth:   0.5,
            paddingTop:       8,
            paddingBottom:    8,
            height:           70,
          },
          tabBarActiveTintColor:   colors.primary,
          tabBarInactiveTintColor: colors.mutedForeground,
          tabBarLabelStyle: {
            fontSize:      11,
            fontWeight:    typography.weight.semibold,
            letterSpacing: 0.3,
            marginTop:     2,
          },
          tabBarIcon: ({ color, size }) =>
            Icon ? (
              <Icon
                color={color}
                size={size ?? 22}
                strokeWidth={1.75}
              />
            ) : null,
          tabBarButton: (props) => (
            // Enforce minimum touch target on every tab
            <props.children
              {...props}
              style={[
                props.style,
                { minHeight: touchTarget.comfortable },
              ]}
            />
          ),
        }
      }}
    >
      {/* Tabs in the order specified by the V1 Frontend Brief */}
      <Tab.Screen name="Home"     component={HomeScreen}     />
      <Tab.Screen name="Train"    component={TrainScreen}    />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="Coach"    component={CoachScreen}    />
      <Tab.Screen name="Arena"    component={ArenaScreen}    />
    </Tab.Navigator>
  )
}

// ─── Root stack (onboarding gate) ────────────────────────────────────────────
// Active workout and active run are full-screen modals pushed on top of
// the tab navigator — they are added here as screens in the root stack.

export default function App() {
  // TODO: replace with persisted auth state from Supabase + MMKV
  const [onboardingComplete, setOnboardingComplete] = useState(false)

  return (
    <>
      <StatusBar style="light" />
      {!onboardingComplete ? (
        <OnboardingScreen onComplete={() => setOnboardingComplete(true)} />
      ) : (
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {/* Main app */}
            <Stack.Screen name="Main" component={MainTabs} />

            {/* Full-screen modals — cannot be dismissed accidentally */}
            {/* These are added as features are built:
            <Stack.Screen
              name="ActiveWorkout"
              component={ActiveWorkoutScreen}
              options={{ presentation: 'fullScreenModal', gestureEnabled: false }}
            />
            <Stack.Screen
              name="ActiveRun"
              component={ActiveRunScreen}
              options={{ presentation: 'fullScreenModal', gestureEnabled: false }}
            />
            */}
          </Stack.Navigator>
        </NavigationContainer>
      )}
    </>
  )
}
```
