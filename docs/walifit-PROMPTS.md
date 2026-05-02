# waliFit — Claude Code Prompt System
# Use this file as reference. Copy-paste the relevant prompt for each session.

---

## PROMPT 1 — FIRST TIME SETUP
# Run this once when you open Claude Code on a fresh repo.
# Claude reads all docs, confirms it understands, then waits.

---

Read these files in order before doing anything else:
- CLAUDE.md
- .stitch/DESIGN.md
- docs/DECISIONS.md

Then confirm back to me:
1. The 5 bottom tabs and what each one does
2. The color token for primary and what text color goes on it
3. Where the waliAI folder lives in the backend
4. Where state is stored (and what is NEVER used for storage)
5. How steps are logged (and why)

Do not write any code yet. Just confirm these 5 things.

---

## PROMPT 2 — START A FEATURE (use once per feature)
# Replace [FEATURE] and [SCREEN] with the real values.
# Always do schema first, wait for confirmation, then build UI.

---

Read CLAUDE.md and .stitch/DESIGN.md.

We are building Feature [FEATURE]. The scaffold is at apps/mobile/screens/[SCREEN].tsx — it already has mock data, all tokens imported from theme.ts, and the full layout.

Before writing any component code:
1. Show me the Prisma schema diff for this feature
2. Stop and wait for my approval
3. After I approve: run the migration, then wire the UI to real data

Rules:
- Do not redesign. Preserve every layout detail and style exactly.
- All tokens from apps/mobile/theme.ts — never hardcode hex or spacing values
- Use MMKV encrypted wrapper only — never AsyncStorage, never raw MMKV
- Every mutation goes through the offline sync queue
- lucide-react-native icons only
- Touch targets: min 44px, primary actions 48px, workout CTAs 56px
- Steps data comes from Apple Health / Google Fit only — never add manual entry

---

## PROMPT 3 — WIRING AN EXISTING SCAFFOLD (most common)
# Use this once you're past schema. One screen at a time.

---

Read CLAUDE.md and .stitch/DESIGN.md.

apps/mobile/screens/[ScreenName].tsx is scaffolded with mock data.

Wire it to real data:
- Fetch: GET [endpoint] → replace mock with useQuery hook
- Mutations: [list specific actions] → useMutation + offline queue
- Store: read/write [specific Zustand slice]

Rules (non-negotiable):
- Do NOT redesign. Every px of layout stays exactly as-is.
- Do NOT swap any icon for a different one.
- Do NOT change any color — use the existing token references.
- Do NOT add new UI elements unless I ask.

Show me the diff. Do not apply it until I say yes.

---

## PROMPT 4 — FIXING A SPECIFIC BUG
# Surgical. No rewrites.

---

Read CLAUDE.md.

Bug: [describe exactly what's wrong]
File: apps/mobile/screens/[ScreenName].tsx
Line / area: [approximate location if known]

Fix only this bug. Do not refactor anything else in the file.
Show me the diff. Do not apply until I approve.

---

## PROMPT 5 — ADDING A SCREEN THAT DOESN'T EXIST YET
# For the few screens not in the scaffold zip.

---

Read CLAUDE.md and .stitch/DESIGN.md.

Build [ScreenName] from scratch.

Requirements:
- Stack: React Native + NativeWind + gluestack-ui v3
- All tokens from apps/mobile/theme.ts
- Use lucide-react-native icons only
- Navigation: [push / modal / bottom sheet]
- Data: [what it fetches and from where]
- States: loading skeleton, success, empty state, error state — all four required

Match the visual pattern of HomeScreen.tsx exactly (card style, spacing, typography scale).

Show me the component before wiring any data.

---

## PROMPT 6 — END OF SESSION CHECKPOINT
# Run this at the end of every Claude Code session.

---

Before we close this session:

1. List every file you modified in this session
2. For each file: what changed and why
3. Are there any half-finished migrations or uncommitted mutations?
4. Anything I need to manually test on device before next session?

Do not start any new work. Just the checkpoint.

---

## PROMPT 7 — WHEN CLAUDE GOES OFF-SCRIPT
# If Claude redesigns something, swaps tokens, or ignores a rule.

---

Stop. You changed [what it changed] and I didn't ask for that.

Revert [specific file] to the last working state.
Then apply only the change I asked for: [restate the original ask].

Reminder: the scaffold is the source of truth for layout and styling.
Your job is to wire data, not redesign.

---

## FEATURE BUILD ORDER (Tier 1 → Tier 3)

Tier 1 (build first — these gate everything):
  F5  Onboarding       → AuthScreen + OnboardingFlowScreen
  F2  Workout          → ActiveWorkoutScreen + WorkoutCompleteScreen
  F9  Rest Timer       → RestTimerSheet component
  F3  Vitality Tree    → RemainingScreens (TreeDetailScreen)
  F4  Calendar         → CalendarScreen (already scaffolded)
  F6  Nutrition        → NutritionLogScreen
  F7  Settings         → SettingsScreen

Tier 2 (after core loop works):
  F1  Wali AI          → CoachScreen
  F10 Notifications    → permission priming, quiet hours
  F11 Offline          → OfflineBanner + SyncStatusIndicator
  F12 WaliRun          → WaliRunScreen

Tier 3 (last):
  F8  Arena            → ArenaExtendedScreens

---

## GOLDEN RULES (paste at top of any prompt if Claude is misbehaving)

> You are working on waliFit — a React Native + Expo SDK 53 hybrid athlete app.
> Source of truth for design: apps/mobile/theme.ts and .stitch/DESIGN.md.
> Source of truth for architecture: CLAUDE.md and docs/DECISIONS.md.
> Never hardcode colors or spacing. Never use AsyncStorage. Never add manual step entry.
> Dark text (#002f2f) on primary (#0BBFBD teal) — NEVER white on primary.
> Show diffs. Wait for approval. Then apply.
