# waliFit — Claude Code Project Memory

## What this app is
waliFit is a Hybrid Athlete Operating System for iOS and Android.
It combines AI coaching, workout tracking, GPS running, gamified consistency
(the Vitality Tree), and a competitive social layer (The Arena) into one app.
Target user: hybrid athletes who train strength AND run (Hyrox, CrossFit, tactical).

## Core loop
Train → Log → Progress → Compete → Repeat

## Stack
- Mobile: React Native + Expo SDK 54 · TypeScript strict · NativeWind · gluestack-ui v3
- Navigation: React Navigation — bottom tabs + native stack. NO expo-router.
- Backend: Fastify + TypeScript · Prisma ORM · Railway hosting
- Database: Supabase PostgreSQL (cloud — NO Docker)
- Cache / Queues: Upstash Redis (cloud — NO Docker)
- Auth: Supabase Auth + PKCE
- AI — complex: Claude Sonnet 4.6 (program generation, complex coaching, cold start)
- AI — volume: Gemini Flash (chat Q&A, nutrition parsing, workout adjustment)
- AI — vision: Gemini Vision (meal scan V2.5, onboarding import)
- Local storage: MMKV via encrypted wrapper in react-native/utils/supabase.ts
- State: Zustand (client) + TanStack Query (server)
- Icons: lucide-react-native (standardized — no Ionicons, no @expo/vector-icons)
- Animations: react-native-reanimated v3 + Lottie
- Forms: React Hook Form + Zod schemas from packages/shared
- Package manager: npm inside react-native/ · pnpm at root when backend exists

## Bottom navigation — 5 tabs, in this exact order
1. Home     — Vitality Tree hero, pillar cards, today's workout
2. Train    — Workout logging, builder, exercise library, WaliRun GPS
3. Calendar — Daily / weekly / monthly activity views
4. Coach    — Wali AI chat, program generation, workout adjustment
5. Arena    — Social hub: feed, sessions, leaderboards, friends, challenges, badges

## Key paths — ACTUAL current paths
- Mobile app root:    react-native/
- Mobile screens:     react-native/screens/
- Mobile components:  react-native/components/
- Mobile hooks:       react-native/hooks/
- Mobile lib:         react-native/lib/
- Mobile utils:       react-native/utils/
- Design tokens:      react-native/theme.ts        ← SOURCE OF TRUTH for all colors
- Tailwind config:    react-native/tailwind.config.js
- Supabase + storage: react-native/utils/supabase.ts
- API layer:          react-native/lib/api.ts
- Query client:       react-native/lib/queryClient.ts
- MMKV storage:       react-native/lib/storage.ts
- Workout utils:      react-native/lib/workouts.ts
- Design system:      DESIGN.md                    ← at project root
- AI service:         backend/src/waliAI/           ← create when building backend
- Prisma schema:      backend/prisma/schema.prisma  ← create when building backend
- Shared types:       packages/shared/src/types/    ← create when needed

## Screens already built (DO NOT recreate these)
- react-native/screens/HomeScreen.tsx
- react-native/screens/TrainScreen.tsx
- react-native/screens/ActiveWorkoutScreen.tsx
- react-native/screens/ArenaScreen.tsx
- react-native/screens/CalendarScreen.tsx
- react-native/screens/ProfileScreen.tsx
- react-native/screens/AuthScreen.tsx
- react-native/screens/OnboardingScreen.tsx
- react-native/screens/OnboardingFlowScreen.tsx
- react-native/screens/SettingsScreen.tsx
- react-native/screens/ProfileDestinationScreen.tsx

## Components already built
- react-native/components/VitalityTree.tsx  ← Vitality Tree component, extend don't replace

## Hooks already built
- react-native/hooks/useHomeData.ts
- react-native/hooks/useArenaData.ts
- react-native/hooks/useCalendarData.ts
- react-native/hooks/useProfileData.ts
- react-native/hooks/useUser.ts
- react-native/hooks/useCachedQuery.ts

## Design tokens (SOURCE OF TRUTH: react-native/theme.ts)
- Background:        #0a0f0f  (deep charcoal)
- Card surface:      #141818
- Primary/Emerald:   #10b981  (tree, actions, completion)
- Primary text on:   #000000  (ALWAYS dark text on emerald — NEVER white)
- Steps pillar:      #10b981  (emerald — 40% tree weight)
- Protein pillar:    #f59e0b  (amber — 30% tree weight)
- Hydration pillar:  #60a5fa  (blue — 30% tree weight)
- Energy/Amber:      #fbbf24  (streaks, achievements)
- Social/Purple:     #a78bfa  (Arena, squad features)
- Destructive:       #ef4444  (errors, stop, wilting)
- Foreground text:   #e5e7eb

## Vitality Tree — 6 health states
Wilted (0–15) → Recovering (16–35) → Sprout (36–55) →
Growing (56–75) → Thriving (76–90) → Full Vitality (91–100)
Single tree visual in V1. No species/biomes until V2.

## Vitality Tree — 3 pillars
- Steps:      40% weight. AUTO from Apple Health (iOS) / Google Fit (Android). NEVER manual entry.
- Protein:    30% weight. Manual log in grams.
- Hydration:  30% weight. Manual log in ml or glasses.

## Hard rules — NEVER break these
- NEVER import colors/spacing from anywhere except react-native/theme.ts
- NEVER hardcode hex values, spacing numbers, or font sizes in components
- NEVER use AsyncStorage — always MMKV via react-native/lib/storage.ts
- NEVER import Anthropic/Google AI SDKs directly in routes — backend/src/waliAI/ only
- NEVER use expo-router — React Navigation only
- NEVER use Ionicons or @expo/vector-icons — lucide-react-native only
- NEVER recreate screens that already exist — read them first, then extend
- ALL weights stored in kg in DB — UI converts via displayWeight()
- ALL durations stored in seconds in DB — UI formats on display
- Steps data from native health APIs only — NEVER ask user to enter steps manually
- Dark text (#000000) on primary (#10b981) backgrounds — NEVER white text on emerald
- Touch targets: minHeight 44 minimum, 48 for primary actions, 56 for workout CTAs
- Every screen must implement 4 states: loading (skeleton), success, empty, error
- Every mutation goes through the offline sync queue — no direct writes that bypass it
- MMKV always encrypted via getEncryptionKey() in react-native/utils/supabase.ts
- Run test:ai before every commit that touches backend/src/waliAI/

## What NOT to build in V1
- No tree biomes / species selection (V2)
- No Squad Forests (V2)
- No Nexus Seed economy (V1)
- No global Arena / seasonal events (V2.5)
- No background GPS — foreground only (V2)
- No full macro tracking — protein + hydration + steps only (V2)
- No monetization / paywalls (V2.5)
- No Docker — Supabase + Upstash are the databases

## Commands
- Start mobile:       cd react-native && npx expo start
- Start backend:      cd backend && npx tsx watch src/server.ts
- Prisma migrate:     cd backend && npx prisma migrate dev
- Prisma studio:      cd backend && npx prisma studio
- AI compliance:      cd backend && npx tsx src/scripts/testAICompliance.ts

## When building new features — always do this first
1. Read the relevant existing screen/hook/component before writing anything
2. Check react-native/theme.ts for the correct token to use
3. Check DESIGN.md at root for component patterns
4. Never create a new file without checking if one already exists

## Token optimization
- /clear between unrelated tasks
- /compact with: "Focus on code changes and schema state"
- Reference specific files directly: "read react-native/screens/HomeScreen.tsx"
- Sonnet for features; Haiku for formatting/docs/minor fixes

## Compact instruction
When compacting: preserve schema state, active feature branch, and any
unresolved conflicts. Drop conversation history. Keep hard rules and key paths.