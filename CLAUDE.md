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
- Local storage: MMKV via encrypted wrapper in utils/supabase.ts
- State: Zustand (client) + TanStack Query (server)
- Icons: lucide-react-native (standardized — no Ionicons)
- Animations: react-native-reanimated v3 + Lottie
- Forms: React Hook Form + Zod schemas from packages/shared
- Testing: Jest + React Native Testing Library + Maestro (E2E smoke)
- Package manager: pnpm (hoisted node-linker — never change)

## Bottom navigation — 5 tabs, in this exact order
1. Home     — Vitality Tree hero, pillar cards, today's workout
2. Train    — Workout logging, builder, exercise library, WaliRun GPS
3. Calendar — Daily / weekly / monthly activity views
4. Coach    — Wali AI chat, program generation, workout adjustment
5. Arena    — Social hub: feed, sessions, leaderboards, friends, challenges, badges

## Key paths
- AI service:      apps/backend/src/waliAI/     ← NOT questai
- Prisma schema:   apps/backend/prisma/schema.prisma
- Shared types:    packages/shared/src/types/
- Shared schemas:  packages/shared/src/schemas/
- Design system:   .stitch/DESIGN.md
- Design tokens:   apps/mobile/theme.ts         ← source of truth for all colors
- Tailwind config: apps/mobile/tailwind.config.js

## Design tokens (source of truth: apps/mobile/theme.ts)
- Background:        #0a0f0f  (deep charcoal)
- Card surface:      #141818
- Primary/Emerald:   #10b981  (tree, actions, completion)
- Primary text on:   #000000  (ALWAYS dark text on emerald — never white)
- Steps pillar:      #10b981  (emerald — 40% tree weight)
- Protein pillar:    #f59e0b  (amber — 30% tree weight)
- Hydration pillar:  #60a5fa  (blue — 30% tree weight)
- Energy/Amber:      #fbbf24  (streaks, achievements)
- Social/Purple:     #a78bfa  (Arena, squad features)
- Destructive:       #ef4444  (errors, stop, wilting)
- Foreground text:   #e5e7eb

## Vitality Tree — 6 states
Wilted (0-15) → Recovering (16-35) → Sprout (36-55) → Growing (56-75) → Thriving (76-90) → Full Vitality (91-100)
Single tree visual in V1. No species/biomes until V2.

## Vitality Tree — 3 pillars
- Steps:     40% weight. AUTO from Apple Health (iOS) / Google Fit (Android). NEVER manual.
- Protein:   30% weight. Manual log (grams).
- Hydration: 30% weight. Manual log (ml or glasses).

## Hard rules — Claude must never break these
- NEVER import colors/spacing from anywhere except apps/mobile/theme.ts
- NEVER hardcode hex values, spacing numbers, or font sizes in components
- NEVER use AsyncStorage — always MMKV via the encrypted wrapper
- NEVER import Anthropic/Google AI SDKs directly in routes — use apps/backend/src/waliAI/ only
- NEVER use expo-router — React Navigation only
- NEVER use Ionicons — lucide-react-native only
- ALL weights stored in kg in DB. UI converts via displayWeight() from @walifit/shared
- ALL durations stored in seconds in DB. UI formats on display.
- Steps data comes from native health APIs — NEVER ask the user to enter steps manually
- Dark text (#000000) on primary (#10b981) backgrounds — NEVER white text on emerald
- Touch targets: minHeight 44 minimum, 48 for primary actions, 56 for workout CTAs
- Every screen implements 4 states: loading (skeleton), success, empty, error
- Every mutation goes through the offline sync queue — no direct writes that bypass it
- MMKV always encrypted via getEncryptionKey() from utils/supabase.ts
- Run test:ai before every commit touching waliAI/

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
- pnpm dev:mobile    → start Expo
- pnpm dev:backend   → start Fastify
- pnpm db:migrate    → Prisma migration against Supabase
- pnpm db:studio     → Prisma Studio
- pnpm test:ai       → AI compliance tests (must pass before commit)

## Token optimization
- /clear between unrelated tasks
- /compact with: "Focus on code changes and schema state"
- Reference specific files: "read apps/mobile/screens/HomeScreen.tsx" not "look at mobile"
- Sonnet for features; Haiku for formatting/docs

## Compact instruction
When compacting: preserve schema state, active feature branch, and any unresolved
conflicts. Drop conversation history.
