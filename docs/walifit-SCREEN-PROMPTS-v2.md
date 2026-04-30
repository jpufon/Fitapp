# waliFit — Screen Creation Prompts (Corrected)
# All paths verified against actual repo structure.
# Navigation adapter rule baked in — Claude Code will never need to stop and ask.
# Use these in order. One screen per session.
#
# CONFIRMED PATHS:
#   DESIGN.md         → repo root
#   DECISIONS.md      → repo root  
#   CLAUDE.md         → repo root
#   MEMORY.md         → repo root
#   MD spec files     → walifit-md-all-tiers/<Screen>.md (repo root)
#   Screens           → react-native/screens/<Screen>.tsx
#   Components        → react-native/components/<Component>.tsx
#   Theme             → react-native/theme.ts
#
# RULES BAKED INTO EVERY PROMPT:
#   - Read existing file first. If it matches MD: skip and report.
#   - If it differs: diff to bring in line. If missing: create from MD tsx block.
#   - Navigation adapter: use NativeStackScreenProps signature always.
#     Wire onFinish / onDiscard / onBack internally to navigation.goBack().
#   - Replace ALL Ionicons with lucide-react-native equivalents.
#   - All colors and spacing from react-native/theme.ts — never hardcoded hex.
#   - Mock data only. No API calls. No Zustand writes.
#   - Do not touch App.tsx or navigation unless the prompt says so.
#   - Show diff. Wait for approval. Then apply.

---

# ════════════════════════════════════════════
# SCREEN 1 — AUTH
# F5 · react-native/screens/AuthScreen.tsx
# ════════════════════════════════════════════

Read CLAUDE.md, DESIGN.md, and MEMORY.md.
Read walifit-md-all-tiers/AuthScreen.md.
Read react-native/screens/AuthScreen.tsx if it exists.

If the file already matches the MD: tell me and skip to next screen.
If it differs or is missing: produce a diff that makes it match.

Rules for this screen:
- Signature: NativeStackScreenProps — wire onGetStarted / onLogin / onSuccess 
  internally to navigation.navigate() to the correct stack screens.
- Replace any Ionicons with lucide-react-native equivalents.
- Apple Sign In button must always appear when Google Sign In is shown (App Store rule).
- All tokens from react-native/theme.ts — no hardcoded hex.
- Mock auth callbacks (no Supabase yet) — log to console on success.
- Four views in one file: welcome, signup, login, forgot password.

Show diff. Wait for my approval. Then apply.

---

# ════════════════════════════════════════════
# SCREEN 2 — ONBOARDING FLOW
# F5 · react-native/screens/OnboardingFlowScreen.tsx
# ════════════════════════════════════════════

Read CLAUDE.md, DESIGN.md, and MEMORY.md.
Read walifit-md-all-tiers/OnboardingFlowScreen.md.
Read react-native/screens/OnboardingFlowScreen.tsx if it exists.

If the file already matches the MD: tell me and skip to next screen.
If it differs or is missing: produce a diff that makes it match.

Rules for this screen:
- Signature: NativeStackScreenProps — wire onComplete internally to 
  navigation.navigate('Home') or equivalent.
- Replace any Ionicons with lucide-react-native equivalents.
- All tokens from react-native/theme.ts — no hardcoded hex.
- Five steps: Goal → Frequency → Units → Import → Complete.
- Import step: mock Wali AI parsing (setTimeout 2000ms, then show parsed results).
- Steps goal field must NOT have manual entry — read-only display with note 
  "auto-synced from Apple Health / Google Fit".
- Mock callbacks — no API calls, no Zustand writes yet.

Show diff. Wait for my approval. Then apply.

---

# ════════════════════════════════════════════
# SCREEN 3 — ACTIVE WORKOUT
# F2 · react-native/screens/ActiveWorkoutScreen.tsx
# ════════════════════════════════════════════

Read CLAUDE.md, DESIGN.md, and MEMORY.md.
Read walifit-md-all-tiers/ActiveWorkoutScreen.md.
Read react-native/screens/ActiveWorkoutScreen.tsx if it exists.

If the file already matches the MD: tell me and skip to next screen.
If it differs or is missing: produce a diff that makes it match.

Rules for this screen:
- Signature: NativeStackScreenProps<RootStackParamList, 'ActiveWorkout'>.
  Wire internally: onFinish = () => navigation.navigate('WorkoutComplete'),
  onDiscard = () => navigation.goBack().
- Replace ALL Ionicons with lucide-react-native equivalents.
- All tokens from react-native/theme.ts — no hardcoded hex.
- Mock workout: hardcoded MOCK_WORKOUT array (3 exercises, 3-4 sets each).
- Plate calculator: BAR_WEIGHT_KG = 20 hardcoded, no store reads yet.
- Set logging: local useState only — no API calls, no mutations.
- route.params.workout is accepted but ignored for now — mock data shown.
  (real wiring happens in IMPL-PROMPTS session 2B)
- Gesture dismiss must be disabled — gestureEnabled: false — user cannot 
  accidentally swipe away mid-workout.

Show diff. Wait for my approval. Then apply.

---

# ════════════════════════════════════════════
# SCREEN 4 — WORKOUT COMPLETE
# F2 · react-native/screens/WorkoutCompleteScreen.tsx
# ════════════════════════════════════════════

Read CLAUDE.md, DESIGN.md, and MEMORY.md.
Read walifit-md-all-tiers/WorkoutCompleteScreen.md.
Read react-native/screens/WorkoutCompleteScreen.tsx if it exists.

If the file already matches the MD: tell me and skip to next screen.
If it differs or is missing: produce a diff that makes it match.

Rules for this screen:
- Signature: NativeStackScreenProps<RootStackParamList, 'WorkoutComplete'>.
  Wire internally: onDone = () => navigation.navigate('Home').
- Replace any Ionicons with lucide-react-native equivalents.
- All tokens from react-native/theme.ts — no hardcoded hex.
- Mock result: hardcoded MOCK_RESULT (PR on Bench Press, volume stats, tree before/after).
- PR banner shows in primary teal — text color must be primaryFg (#000000), 
  never white on teal.
- Share to Arena button: mock only — console.log on press, no POST yet.
- Tree impact section: shows before/after score with stage label.

Show diff. Wait for my approval. Then apply.

---

# ════════════════════════════════════════════
# SCREEN 5 — REST TIMER COMPONENT
# F9 · react-native/components/RestTimerSheet.tsx
# NOTE: This is a component, not a screen. Goes in components/ not screens/
# ════════════════════════════════════════════

Read CLAUDE.md, DESIGN.md, and MEMORY.md.
Read walifit-md-all-tiers/RestTimerSheet.md.
Read react-native/components/RestTimerSheet.tsx if it exists.

If the file already matches the MD: tell me and skip to next screen.
If it differs or is missing: produce a diff that makes it match.

Rules for this component:
- Two exports: RestTimerSheet (bottom bar) and RestTimerFullScreen (modal).
- Timer logic: local useState + setInterval — no Zustand store yet.
- Replace any Ionicons with lucide-react-native equivalents.
- All tokens from react-native/theme.ts — no hardcoded hex.
- No haptics wiring yet — placeholder comment // TODO: expo-haptics on complete.
- No audio wiring yet — placeholder comment // TODO: expo-av on complete.
- Bottom sheet stays above keyboard — use appropriate padding for safe area.
- Full-screen modal: ring visual shows countdown progress, not just number.
- ±15s buttons: min touch target 44px.
- Do NOT mount this component anywhere yet — just create the file.

Show diff. Wait for my approval. Then apply.

---

# ════════════════════════════════════════════
# SCREEN 6 — REMAINING SCREENS
# F3 + F2 + F11 · react-native/screens/RemainingScreens.tsx
# ════════════════════════════════════════════

Read CLAUDE.md, DESIGN.md, and MEMORY.md.
Read walifit-md-all-tiers/RemainingScreens.md.
Read react-native/screens/RemainingScreens.tsx if it exists.

If the file already matches the MD: tell me and skip to next screen.
If it differs or is missing: produce a diff that makes it match.

Rules for this file:
- Contains multiple exports — confirm all of these exist after applying:
  TreeDetailScreen, StreakModal, TreeAtRiskModal,
  ExerciseLibraryScreen, OfflineBanner, SyncStatusIndicator.
- Replace any Ionicons with lucide-react-native equivalents.
- All tokens from react-native/theme.ts — no hardcoded hex.
- TreeDetailScreen: mock 7-day history bars, mock pillar scores (steps/protein/water).
- Steps pillar: shows "Auto-synced from Apple Health / Google Fit" — 
  no manual entry input anywhere in this file.
- StreakModal: milestone dots at 7, 14, 30, 60, 100 days.
- TreeAtRiskModal: shows which pillars are low, Log Now button navigates to 
  NutritionLogScreen (mock navigation.navigate for now).
- ExerciseLibraryScreen: mode prop ('browse' | 'pick') — both modes present.
- OfflineBanner: yellow/amber warning bar — visible prop controls show/hide.
- SyncStatusIndicator: shows pending count badge.

Show diff. Wait for my approval. Then apply.

---

# ════════════════════════════════════════════
# SCREEN 7 — NUTRITION LOGGER
# F6 · react-native/screens/NutritionLogScreen.tsx
# ════════════════════════════════════════════

Read CLAUDE.md, DESIGN.md, and MEMORY.md.
Read walifit-md-all-tiers/NutritionLogScreen.md.
Read react-native/screens/NutritionLogScreen.tsx if it exists.

If the file already matches the MD: tell me and skip to next screen.
If it differs or is missing: produce a diff that makes it match.

Rules for this screen:
- Signature: NativeStackScreenProps or used as bottom tab — match what App.tsx expects.
- Replace any Ionicons with lucide-react-native equivalents.
- All tokens from react-native/theme.ts — no hardcoded hex.
- Three tabs: Protein · Hydration · Steps.
- Protein tab: quick add presets (10g, 25g, 40g, 60g) + custom input + today's log list.
- Hydration tab: tappable glass icons (8 glasses) + quick add buttons + log list.
- Steps tab: read-only display only.
  CRITICAL: No manual entry input for steps. No TextInput. No edit button.
  Show sync notice: "Steps sync automatically from Apple Health (iOS) 
  or Google Fit (Android)."
- Wali AI insight card on protein tab: mock hardcoded insight text.
- All values from MOCK_TODAY constants — no API calls.

Show diff. Wait for my approval. Then apply.

---

# ════════════════════════════════════════════
# SCREEN 8 — SETTINGS (all 9 sub-screens)
# F7 · react-native/screens/SettingsScreen.tsx
# ════════════════════════════════════════════

Read CLAUDE.md, DESIGN.md, and MEMORY.md.
Read walifit-md-all-tiers/SettingsScreen.md.
Read react-native/screens/SettingsScreen.tsx if it exists.

If the file already matches the MD: tell me and skip to next screen.
If it differs or is missing: produce a diff that makes it match.

Rules for this screen:
- Signature: NativeStackScreenProps — wire onClose internally to navigation.goBack().
- Replace any Ionicons with lucide-react-native equivalents.
- All tokens from react-native/theme.ts — no hardcoded hex.
- All 9 sub-screens in one file, confirmed present:
  Home · Edit Profile · Preferences · Notifications · 
  Account · Delete Account · Data Export · Legal & Privacy · About
- Delete Account: MUST require user to type the word DELETE exactly before 
  the confirm button enables. This is an App Store hard requirement.
- Notifications: each toggle fires independently (local useState for now).
- Units toggle: kg / lbs — large tappable cards, not a small switch.
- Training days: tappable pill per day (Mon–Sun), multi-select.
- Steps goal field in Preferences: read-only with note 
  "Set automatically from your step goal in Health settings."
- Mock save callbacks — console.log on save, no API calls.

Show diff. Wait for my approval. Then apply.

---

# ════════════════════════════════════════════
# SCREEN 9 — WALI AI COACH
# F1 · react-native/screens/CoachScreen.tsx
# ════════════════════════════════════════════

Read CLAUDE.md, DESIGN.md, and MEMORY.md.
Read walifit-md-all-tiers/CoachScreen.md.
Read react-native/screens/CoachScreen.tsx if it exists.

If the file already matches the MD: tell me and skip to next screen.
If it differs or is missing: produce a diff that makes it match.

Rules for this screen:
- Signature: NativeStackScreenProps or bottom tab — match what App.tsx expects.
- Replace any Ionicons with lucide-react-native equivalents.
- All tokens from react-native/theme.ts — no hardcoded hex.
- Three views in one file: Coach Home · AI Chat · Program Architect.
- AI Chat: mock streaming via setTimeout (1800ms delay, then show full response).
  No real API call yet. One hardcoded mock message in MOCK_MESSAGES.
- CRITICAL: Disclaimer banner "Not medical advice · Consult a professional" 
  must always be visible in chat view — never hidden, never behind a toggle.
- Program Architect: generate → mock 2500ms loading → show MOCK_PROGRAM → 
  accept/regenerate. No API call.
- Coach Home: suggested questions chips navigate to chat view with that text 
  pre-filled (local state, no navigation param needed).
- Cold-start prompt: first message in chat shows a proactive Wali AI message 
  if MOCK_MESSAGES length === 1.

Show diff. Wait for my approval. Then apply.

---

# ════════════════════════════════════════════
# SCREEN 10 — WALIRUN GPS
# F12 · react-native/screens/WaliRunScreen.tsx
# ════════════════════════════════════════════

Read CLAUDE.md, DESIGN.md, and MEMORY.md.
Read walifit-md-all-tiers/WaliRunScreen.md.
Read react-native/screens/WaliRunScreen.tsx if it exists.

If the file already matches the MD: tell me and skip to next screen.
If it differs or is missing: produce a diff that makes it match.

Rules for this screen:
- Signature: NativeStackScreenProps or bottom tab — match what App.tsx expects.
- Replace any Ionicons with lucide-react-native equivalents.
- All tokens from react-native/theme.ts — no hardcoded hex.
- Four views: Run Tab · Pre-run Checklist · Active Run · Run Summary.
- Pre-run: GPS mocked as 'strong', battery mocked as 78% — no expo-location yet.
- Active Run: full-screen dark layout (#050A0A background), large distance display.
  Mock static data (MOCK_ACTIVE) — no live GPS updates yet.
  Screen must stay on during run — add comment // TODO: expo-keep-awake activate.
- Finish run: confirmation modal requires deliberate tap — cannot be dismissed 
  by tapping the overlay background.
- Run Summary: PR banner if isPR = true. Mock splits table.
- Run history on Run Tab: three mock entries with date, distance, time, PR badge.
- Active Run uses blue (colors.blue) as primary accent — not primary green.
  Distance number in colors.blue. Pause/start button background colors.blue.

Show diff. Wait for my approval. Then apply.

---

# ════════════════════════════════════════════
# SCREEN 11 — ARENA EXTENDED
# F8 · react-native/screens/ArenaExtendedScreens.tsx
# ════════════════════════════════════════════

Read CLAUDE.md, DESIGN.md, and MEMORY.md.
Read walifit-md-all-tiers/ArenaExtendedScreens.md.
Read react-native/screens/ArenaExtendedScreens.tsx if it exists.

If the file already matches the MD: tell me and skip to next screen.
If it differs or is missing: produce a diff that makes it match.

Rules for this file:
- Contains five exports — confirm all present after applying:
  FriendsScreen · ChallengesScreen · BadgesScreen · 
  SessionsScreen · DMsScreen
- Replace any Ionicons with lucide-react-native equivalents.
- All tokens from react-native/theme.ts — no hardcoded hex.
- FriendsScreen: pending requests section (accept/decline), friends list with 
  compatibility %, Add Friend modal (search + invite link).
  DM button visible only on mutual=true friends.
- ChallengesScreen: active challenges show rank, days left, participant count.
  Past challenges shown at 60% opacity.
- BadgesScreen: 3-column grid. Locked badges show Lock icon at 50% opacity.
  Rarity colors — Common: mutedForeground, Rare: blue, Epic: purple, 
  Legendary: energy (amber).
- SessionsScreen: Ghost Mode badge on sessions where ghostMode=true.
  "Start my session" button navigates to ActiveWorkoutScreen 
  (mock navigation.navigate for now).
- DMsScreen: thread list → thread view on tap. Send button disabled when 
  input empty. Real-time placeholder comment // TODO: Supabase Realtime.
  DMs available to mutual friends only — notice shown at top.

Show diff. Wait for my approval. Then apply.

---

# ════════════════════════════════════════════
# SCREEN 12 — ARENA FEED EXTENSION
# F8 · react-native/screens/ArenaScreen.tsx (extend existing)
# ════════════════════════════════════════════

Read CLAUDE.md, DESIGN.md, and MEMORY.md.
Read react-native/screens/ArenaScreen.tsx — this file already exists.

Extend it (do not recreate) with the following, using mock data only:

Feed tab (if not already present):
- Three mock events: one workout_complete, one PR, one run_complete.
- Each event has: avatar initials, name, description, time, reaction row.
- Reaction row: 🔥 💪 🏆 emoji buttons with mock counts.
- Tapping a reaction: optimistic local count increment (useState).

Leaderboard tab (if not already present):
- Weekly volume: mock top 5 with rank number, name, volume in kg, 
  delta vs last week (green if up, red if down).
- Current user row highlighted with primary border.

Squad tab (if not already present):
- Four tappable cards: Friends · Challenges · Badges · Sessions.
- Each card navigates to the matching screen in ArenaExtendedScreens.tsx.
  (mock navigation.navigate for now if those screens not in stack yet)

Rules:
- Replace any Ionicons with lucide-react-native equivalents.
- All tokens from react-native/theme.ts — no hardcoded hex.
- Do not redesign the existing layout — add the tab content only.
- Do not touch App.tsx.

Show diff. Wait for my approval. Then apply.

---

# ════════════════════════════════════════════
# FINAL VERIFICATION
# Run after all 12 screens are created.
# ════════════════════════════════════════════

Read CLAUDE.md and MEMORY.md.

Audit every file in react-native/screens/ and react-native/components/.

For each file report:
1. File name
2. Any hardcoded hex colors found (violation if yes)
3. Any AsyncStorage imports found (violation if yes)
4. Any Ionicons imports found (violation if yes)
5. Any manual step entry inputs found (violation if yes)
6. Any missing lucide-react-native import where icons are used

Report only. Do not fix anything yet.
Format as a table: File | Hex | AsyncStorage | Ionicons | Manual Steps | Icons OK

---

# ════════════════════════════════════════════
# SMOKE TEST
# Run after verification passes clean.
# ════════════════════════════════════════════

Read CLAUDE.md and MEMORY.md.
Read react-native/App.tsx.

Create a temporary DEV ONLY screen selector at 
react-native/screens/DevScreen.tsx.

It should be a ScrollView of TouchableOpacity rows — one per screen.
Tapping a row navigates to that screen.

Screens to include:
- AuthScreen (welcome view)
- OnboardingFlowScreen
- HomeScreen
- ActiveWorkoutScreen
- WorkoutCompleteScreen
- NutritionLogScreen (protein tab)
- CoachScreen
- WaliRunScreen (run tab)
- SettingsScreen
- ArenaScreen (feed tab)
- FriendsScreen (from ArenaExtendedScreens)
- BadgesScreen (from ArenaExtendedScreens)
- TreeDetailScreen (from RemainingScreens)

Add a comment at the top of DevScreen.tsx:
// DEV ONLY — REMOVE BEFORE PRODUCTION BUILD

Then show me the minimal App.tsx diff to mount DevScreen as the 
initial route.

Show both diffs. Wait for my approval. Then apply.

---

# ════════════════════════════════════════════
# QUICK REFERENCE
# ════════════════════════════════════════════

# Screen  1  → react-native/screens/AuthScreen.tsx
# Screen  2  → react-native/screens/OnboardingFlowScreen.tsx
# Screen  3  → react-native/screens/ActiveWorkoutScreen.tsx
# Screen  4  → react-native/screens/WorkoutCompleteScreen.tsx
# Screen  5  → react-native/components/RestTimerSheet.tsx      ← components/
# Screen  6  → react-native/screens/RemainingScreens.tsx
# Screen  7  → react-native/screens/NutritionLogScreen.tsx
# Screen  8  → react-native/screens/SettingsScreen.tsx
# Screen  9  → react-native/screens/CoachScreen.tsx
# Screen 10  → react-native/screens/WaliRunScreen.tsx
# Screen 11  → react-native/screens/ArenaExtendedScreens.tsx
# Screen 12  → react-native/screens/ArenaScreen.tsx (extend)
#
# Then: Final Verification → Smoke Test → open walifit-IMPL-PROMPTS.md
