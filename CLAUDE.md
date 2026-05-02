# waliFit — Claude Code Project Memory

## What this app is
waliFit is a Hybrid Athlete Operating System for iOS and Android.
It combines AI coaching, workout tracking, GPS running, gamified consistency
(the Vitality Tree), and a competitive social layer (The Arena) into one app.
Target user: hybrid athletes who train strength AND run (Hyrox, CrossFit, tactical).

## Core loop
Train → Log → Progress → Compete → Repeat

## Stack
- Mobile: React Native + Expo SDK 54 · TypeScript strict · NativeWind
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
- Animations: react-native-reanimated v4 + Lottie
- Forms: React Hook Form + Zod (mobile zod v4 · backend + shared zod v3 — types only on mobile)
- Package manager: npm everywhere (react-native/, backend/, packages/shared/). No root workspace.

## Bottom navigation — 5 tabs, in this exact order (matches react-native/App.tsx)
1. Home     — Vitality Tree hero, pillar cards, today's workout
2. Train    — Workout logging, builder, exercise library, WaliRun entry
3. Calendar — Daily / weekly / monthly activity views
4. Coach    — Wali coaching, guidance, and AI chat
5. Arena    — Social hub: feed, sessions, leaderboards, friends, challenges, badges

Stack-only screens (not tabs): WaliRun, ActiveWorkout, NutritionLog,
WorkoutComplete, Settings, Auth, OnboardingFlow, Friends, Badges, TreeDetail, Dev.
(Coach is both a tab and reachable via stack push.)

## Key paths — ACTUAL current paths
- Mobile app root:    react-native/
- Mobile screens:     react-native/screens/
- Mobile components:  react-native/components/
- Mobile hooks:       react-native/hooks/
- Mobile lib:         react-native/lib/
- Mobile utils:       react-native/utils/
- Color values:       react-native/theme.colors.js ← SOURCE OF TRUTH for palette values
- Design tokens:      react-native/theme.ts        ← TS exports for colors, spacing, type
- Tailwind config:    react-native/tailwind.config.js
- Supabase + storage: react-native/utils/supabase.ts
- API layer:          react-native/lib/api.ts
- Query client:       react-native/lib/queryClient.ts
- MMKV storage:       react-native/lib/storage.ts
- Workout utils:      react-native/lib/workouts.ts
- Design system:      DESIGN.md                    ← at project root
- Backend root:       backend/                      ← Fastify + Prisma · Phases 1–4 done; Phase 5 (Railway deploy) and 6+ (waliAI) pending
- Backend entry:      backend/src/server.ts
- Backend env config: backend/src/config.ts (Zod-validated)
- Prisma schema:      backend/prisma/schema.prisma  ← V1 schema applied (3 migrations in backend/prisma/migrations)
- Prisma client:      backend/src/lib/prisma.ts
- Backend lib/:       backend/src/lib/              ← auth, dailyScore, feed, pr, prisma, score
- Backend routes:     backend/src/routes/           ← me, workouts, calendar, nutrition, vitality, home, arena
- AI service:         backend/src/waliAI/           ← NOT YET SCAFFOLDED (Phase 6+)
- Shared types:       packages/shared/src/         ← walifit-shared package, Zod schemas
- API contract:       docs/API_CONTRACT.md          ← every route, request, response, mobile hook
- Sync queue:         docs/SYNC_QUEUE.md            ← offline mutation queue API
- Sync queue impl:    react-native/lib/syncQueue.ts ← every mutation routes through this
- Zustand store:      react-native/lib/onboardingStore.ts
- Auth helpers:       react-native/lib/auth.ts

## Screens already built (DO NOT recreate these)
- react-native/screens/HomeScreen.tsx
- react-native/screens/TrainScreen.tsx
- react-native/screens/ActiveWorkoutScreen.tsx
- react-native/screens/ArenaScreen.tsx
- react-native/screens/ArenaExtendedScreens.tsx   ← exports FriendsScreen, BadgesScreen
- react-native/screens/CalendarScreen.tsx
- react-native/screens/CoachScreen.tsx            ← stack-only, not a tab
- react-native/screens/ProfileScreen.tsx
- react-native/screens/ProfileDestinationScreen.tsx ← stub for WaliAI/Analytics/Notifications/Account/Privacy
- react-native/screens/AuthScreen.tsx
- react-native/screens/OnboardingFlowScreen.tsx
- react-native/screens/SettingsScreen.tsx
- react-native/screens/NutritionLogScreen.tsx
- react-native/screens/WorkoutCompleteScreen.tsx
- react-native/screens/WaliRunScreen.tsx
- react-native/screens/RemainingScreens.tsx        ← exports TreeDetailScreen
- react-native/screens/DevScreen.tsx               ← dev-only utilities

## Components already built
- react-native/components/VitalityTree.tsx  ← Vitality Tree component, extend don't replace
- react-native/components/RestTimerSheet.tsx
- react-native/components/ChipSelector.tsx

## Hooks already built
- react-native/hooks/useHomeData.ts
- react-native/hooks/useArenaData.ts
- react-native/hooks/useCalendarData.ts
- react-native/hooks/useTrainData.ts        ← today's workout + history (GET /workouts/today, GET /workouts)
- react-native/hooks/useProfileData.ts
- react-native/hooks/useUser.ts
- react-native/hooks/useCachedQuery.ts
- react-native/hooks/useMutations.ts        ← all write paths (workouts, sets, nutrition, vitality)
- react-native/hooks/useSyncBootstrap.ts    ← mounts offline queue NetInfo subscriber once

## Design tokens (SOURCE OF TRUTH: react-native/theme.ts · spec: docs/waliFit_Design_Tokens.md v3.0)
- Background:        #0a0f0f  (deep charcoal)
- Background alt:    #050A0A  (immersive run/focus mode)
- Card surface:      #161b1b
- Popover surface:   #1a1f1f
- Border:            #2f3636
- Primary/Teal:      #0BBFBD  (CTA, tree, progress rings, active tabs)
- Primary dark:      #0D6D6B  (points/status/header blocks)
- Primary light:     #3FD9D7
- Primary text on:   #002f2f  (ALWAYS dark text on teal — NEVER white)
- Steps pillar:      #0BBFBD  (teal — matches primary, 40% tree weight)
- Protein pillar:    #f59e0b  (amber — 30% tree weight)
- Hydration pillar:  #60a5fa  (blue — 30% tree weight)
- Growth:            #84cc16  (recovery/health)
- Accent Blue:       #3b82f6
- Accent Purple:     #8b5cf6
- Energy/Amber:      #f59e0b  (effort, warnings, protein)
- Destructive:       #ef4444  (errors, stop, wilting)
- Foreground text:   #ececec
- Badge tiers:       Iron #6b7280 · Bronze #c2410c · Silver #94a3b8 · Gold #fbbf24 · Legendary #a78bfa

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
- Dark text (#002f2f) on primary (#0BBFBD teal) backgrounds — NEVER white text on primary
- Touch targets: minHeight 44 minimum, 48 for primary actions, 56 for workout CTAs
- Every screen must implement 4 states: loading (skeleton), success, empty, error
- Every mutation goes through the offline sync queue — no direct writes that bypass it
- MMKV always encrypted via getEncryptionKey() in react-native/utils/supabase.ts
- Once waliAI is scaffolded, run its compliance script before every commit that touches backend/src/waliAI/

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
- AI compliance:      (script will be added when waliAI is scaffolded — Phase 6+)

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
