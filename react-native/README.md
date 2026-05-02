# waliFit — Mobile App (React Native + Expo)

The mobile half of waliFit. iOS + Android. Single source of truth for the user experience: tabs, navigation, screens, hooks, sync queue.

> Authoritative project rules live in `../CLAUDE.md`. Read those first. The hard rules in CLAUDE.md (tokens-only, lucide-only, MMKV-only, no expo-router) are enforced — this README does not duplicate them.

## Quick start

```bash
cd react-native
npm install
cp .env.example .env       # set EXPO_PUBLIC_API_URL + Supabase keys
npx expo start
```

Then:
- Scan the QR code with **Expo Go** on iOS (Camera app) or Android (Expo Go app)
- Press `i` for iOS simulator, `a` for Android emulator
- If "loading forever" after a network change, your LAN IP changed — update `EXPO_PUBLIC_API_URL` in `.env` and restart with `npx expo start --clear`

## Required environment variables

| Var | Purpose |
|---|---|
| `EXPO_PUBLIC_API_URL` | Backend Fastify URL — e.g. `http://192.168.1.x:4000` for LAN, Railway URL for prod |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL (auth) |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `EXPO_PUBLIC_DEV_JWT` | Optional — paste a dev JWT to bypass Supabase auth in development |

## Stack

- **Framework:** React Native + Expo SDK 54 · TypeScript strict
- **Navigation:** `@react-navigation/native` + `bottom-tabs` + `native-stack`. **No expo-router.**
- **Icons:** `lucide-react-native` only. **No Ionicons, no @expo/vector-icons.**
- **Styling:** NativeWind v4 (Tailwind) + `theme.ts` design tokens
- **State:** Zustand (client) + `@tanstack/react-query` (server)
- **Local storage:** `react-native-mmkv` via encrypted wrapper in `utils/supabase.ts` and helpers in `lib/storage.ts`. **No AsyncStorage.**
- **Auth:** Supabase Auth + PKCE
- **Animations:** `react-native-reanimated` v3 + Lottie
- **Forms:** `react-hook-form` + Zod schemas (mirrored from `packages/shared` — see Shared schemas note below)

## Project layout

```
react-native/
├── App.tsx                 # boot/auth/onboarding gate + tab + stack registration
├── theme.ts                # design tokens — SOURCE OF TRUTH for colors, spacing, type
├── tailwind.config.js
├── global.css
├── app.json                # Expo config
├── package.json
├── screens/                # all screens (tabs + stack-only)
├── components/             # VitalityTree, RestTimerSheet, ChipSelector
├── hooks/                  # data hooks + mutation hooks
├── lib/                    # api, syncQueue, storage, queryClient, workouts
└── utils/                  # supabase + encrypted MMKV
```

## Navigation map

5 bottom tabs: **Home → Train → Calendar → Coach → Arena**.

The other screens are stack-only and pushed on top: `Profile`, `WaliRun`, `ActiveWorkout`, `NutritionLog`, `WorkoutComplete`, `Settings`, `Auth`, `OnboardingFlow`, `Friends`, `Badges`, `TreeDetail`, `Dev`.

`App.tsx` is the entry — read it before adding a screen. The full map (params, deep links) is `RootStackParamList` in `App.tsx`.

## Screens

All 17 screens live in `screens/`. See `../CLAUDE.md` "Screens already built" for the inventory. **Read existing screens before scaffolding new ones** — most patterns (loading skeleton, success, empty, error) are already established in `HomeScreen.tsx`, `CalendarScreen.tsx`, and `ArenaScreen.tsx`.

## Data hooks

| Hook | What it returns | Backend route |
|---|---|---|
| `useHomeData` | Vitality + pillars + today's workout | `GET /home` |
| `useTrainData` | Today's in-progress workout + recent history | `GET /workouts/today`, `GET /workouts?limit=N` |
| `useCalendarData` | Day-rollups for a date range | `GET /calendar` |
| `useArenaData` | Feed + my squads + leaderboard | `GET /feed`, `GET /squads/mine`, `GET /leaderboards/squad` |
| `useProfileData` | User stats | `GET /users/me/stats` |
| `useUser` | Current user + onboarding state | `GET /me` |
| `useCachedQuery` | Generic React-Query wrapper with MMKV cache | (utility) |
| `useMutations` | All write paths (workouts, sets, nutrition, vitality) | POST/PATCH routes |
| `useSyncBootstrap` | Subscribes the offline queue to NetInfo (mounted in `App.tsx`) | (utility) |

The full route ↔ hook mapping is in `../docs/API_CONTRACT.md`.

## Mutations and the offline sync queue

**Every mutation goes through `apiMutate` in `lib/api.ts`**, which either sends it immediately or hands it off to the FIFO queue in `lib/syncQueue.ts` for retry on reconnect. Direct `fetch` calls bypass the queue and break the offline contract — don't.

`useSyncBootstrap()` is mounted once in `App.tsx`. It subscribes to NetInfo and drains the queue when connectivity comes back.

Full API surface and retry policy: `../docs/SYNC_QUEUE.md`.

## Shared schemas

Zod schemas live in `packages/shared/src/schemas/` and are consumed by both packages via `"walifit-shared": "file:../packages/shared"`. Mobile uses **type-only** imports — the device never runs Zod at runtime; the backend validates incoming bodies.

```ts
// hooks/useMutations.ts
import type { StartWorkoutBody, LogSetBody } from 'walifit-shared';
```

Metro picks up the package because `metro.config.js` adds the repo root to `watchFolders`. When you add a new schema:

1. Add the Zod schema in `packages/shared/src/schemas/` and re-export from `packages/shared/src/index.ts`.
2. Backend imports it directly: `import { MySchema } from 'walifit-shared'` and validates with `.safeParse()`.
3. Mobile imports types only: `import type { MyBody } from 'walifit-shared'`.

The backend uses Zod v3, the mobile package is on Zod v4. Mobile only consumes types, so the version mismatch is invisible today. If mobile ever needs runtime validation, align versions first.

## Design system

All colors, spacing, type scale, and touch-target sizes come from **`theme.ts`** at the root of this package. Never hardcode hex values, spacing numbers, or font sizes — pull from `colors`, `spacing`, `typography`, `touchTarget`. The full token spec is `docs/waliFit_Design_Tokens.md` at the repo root.

| Token | Value | Use |
|---|---|---|
| `colors.primary` | `#0BBFBD` | CTAs, Vitality Tree, progress rings |
| `colors.primaryDark` | `#0D6D6B` | Header blocks, points cards |
| `colors.primaryFg` | `#002f2f` | **Always** dark text on primary — never white |
| `colors.background` | `#0a0f0f` | App shell |
| `colors.backgroundAlt` | `#050A0A` | Immersive run/focus mode |
| `colors.card` | `#161b1b` | Cards |
| `colors.popover` | `#1a1f1f` | Sheets, modals, menus |
| `colors.border` | `#2f3636` | Borders |
| `colors.energy` | `#f59e0b` | Protein, effort, warnings |
| `colors.hydration` | `#60a5fa` | Water, run data |
| `colors.growth` | `#84cc16` | Recovery, health |
| `colors.foreground` | `#ececec` | Body text |
| `pillarColors.steps` | `#0BBFBD` | Steps ring |
| `pillarColors.protein` | `#f59e0b` | Protein ring |
| `pillarColors.hydration` | `#60a5fa` | Hydration ring |
| `touchTarget.min` | 44 | Every tappable element |
| `touchTarget.comfortable` | 48 | Primary actions |
| `touchTarget.large` | 56 | Workout CTAs |

## Common commands

| What | Command |
|---|---|
| Start dev | `npx expo start` |
| Clear bundler cache | `npx expo start --clear` |
| Force tunnel (when same-WiFi fails) | `npx expo start --tunnel` |
| Reinstall pods (if iOS native breaks) | `cd ios && pod install` |
| Reset node_modules | `rm -rf node_modules && npm install` |

## Troubleshooting

- **Expo Go can't connect** → same WiFi? If yes, try `--tunnel`. If on home Wi-Fi where ports get blocked, see the auto-memory note about Supabase pooler 6543.
- **"Loading forever" after network change** → LAN IP rolled. Update `EXPO_PUBLIC_API_URL` in `.env` and restart with `--clear`.
- **Module not found** → `rm -rf node_modules && npm install`.
- **Metro bundler crashed** → `npx expo start -c`.
- **Auth fails silently in dev** → set `EXPO_PUBLIC_DEV_JWT` from `cd ../backend && npx tsx src/scripts/mint-dev-jwt.ts`.

## Resources

- [Expo SDK 54 docs](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [TanStack Query](https://tanstack.com/query/latest)
- [react-native-mmkv](https://github.com/mrousavy/react-native-mmkv)
- [lucide-react-native](https://lucide.dev/guide/packages/lucide-react-native)
