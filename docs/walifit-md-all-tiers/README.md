# waliFit — All Tiers Screen Scaffolds

Generated: 2026-04-20
Coverage: All V1 screens — Tier 1 + Tier 2 + Tier 3

## Files in this package

| File | Destination | Feature |
|------|-------------|---------|
| AuthScreen.md | `apps/mobile/screens/AuthScreen.tsx` | F5 Onboarding — Welcome, Login, SignUp, Forgot |
| OnboardingFlowScreen.md | `apps/mobile/screens/OnboardingFlowScreen.tsx` | F5 Onboarding — Goal, Frequency, Units, Import, Complete |
| ActiveWorkoutScreen.md | `apps/mobile/screens/ActiveWorkoutScreen.tsx` | F2 Workout — Full-screen modal + Set Logger + Plate Calc |
| WorkoutCompleteScreen.md | `apps/mobile/screens/WorkoutCompleteScreen.tsx` | F2 Workout — PR detection, tree impact, Arena share |
| NutritionLogScreen.md | `apps/mobile/screens/NutritionLogScreen.tsx` | F6 Nutrition — Protein, Hydration, Steps (read-only) |
| SettingsScreen.md | `apps/mobile/screens/SettingsScreen.tsx` | F7 Settings — All 9 sub-screens incl. Delete Account |
| RestTimerSheet.md | `apps/mobile/components/RestTimerSheet.tsx` | F9 Rest Timer — Bottom sheet + Full-screen modal |
| CoachScreen.md | `apps/mobile/screens/CoachScreen.tsx` | F1 Wali AI — Home, Chat, Program Architect |
| WaliRunScreen.md | `apps/mobile/screens/WaliRunScreen.tsx` | F12 WaliRun — Run tab, Pre-run, Active, Summary |
| ArenaExtendedScreens.md | `apps/mobile/screens/ArenaExtendedScreens.tsx` | F8 Arena — Friends, Challenges, Badges, Sessions, DMs |
| RemainingScreens.md | `apps/mobile/screens/RemainingScreens.tsx` | F3 Tree, F2 ExLibrary, F11 Offline, Modals |

## Usage with Claude Code

For each feature, use the wiring prompt pattern:

```
Read CLAUDE.md and .stitch/DESIGN.md.
apps/mobile/screens/[ScreenName].tsx is already scaffolded with mock data.
Wire it to real data: [specific endpoints + Zustand store hooks]
Do not redesign. Preserve all existing layout and styling.
```

## Design rules (all screens follow these)
- All tokens from `apps/mobile/theme.ts` — NEVER hardcoded hex
- Touch targets: min 44px, comfortable 48px, workout CTAs 56px
- Steps: NEVER manually entered — Apple Health / Google Fit only
- Dark text (#002f2f = primaryFg) on primary (#0BBFBD teal) — NEVER white on primary
- Every screen: loading/skeleton, success, empty, error states
- MMKV encrypted wrapper only — never AsyncStorage, never raw MMKV
- lucide-react-native icons only

## Build order (Tier 1 first)
1. F5 Onboarding (AuthScreen + OnboardingFlowScreen) — gates everything
2. F2 Workout (ActiveWorkoutScreen + WorkoutCompleteScreen)
3. F9 Rest Timer (RestTimerSheet)
4. F3 Tree (RemainingScreens → TreeDetailScreen)
5. F6 Nutrition (NutritionLogScreen)
6. F7 Settings (SettingsScreen)
7. F1 Coach (CoachScreen)
8. F12 WaliRun (WaliRunScreen)
9. F8 Arena (ArenaExtendedScreens)
