# waliFit — Complete Implementation Prompt Library
# Every prompt below is ready to copy-paste into Claude Code.
# Use them in order. Do not skip tiers.
# After each prompt: review the diff → approve → move to next.

---

# ════════════════════════════════════════════
# SESSION 0 — FIRST TIME SETUP (run once)
# ════════════════════════════════════════════

Read these files in order before doing anything else:
- CLAUDE.md
- .stitch/DESIGN.md
- docs/DECISIONS.md
- docs/walifit-PROMPTS.md

Confirm back to me:
1. The 5 bottom tabs and what each one does
2. The color token for primary and what text color always goes on it
3. Where the waliAI folder lives in the backend
4. What is NEVER used for storage (two things)
5. How steps are logged and why manual entry is forbidden
6. What "show diff, wait for approval" means in practice

Do not write any code. Just confirm these 6 things.

---

# ════════════════════════════════════════════
# TIER 1 — CORE LOOP
# Build these first. Everything else depends on them.
# ════════════════════════════════════════════

---

# ── FEATURE F5 · ONBOARDING ──────────────────
# SESSION 1A — Schema

Read CLAUDE.md and .stitch/DESIGN.md.

We are starting Feature F5 — Onboarding.
The scaffolds are:
- apps/mobile/screens/AuthScreen.tsx
- apps/mobile/screens/OnboardingFlowScreen.tsx

Before touching any UI file, show me the Prisma schema diff for onboarding.
It needs to cover: user profile, training goal, units preference, training frequency, onboardingComplete flag, and the importedFrom field (nullable — Hevy / MFP / Strava / Strong / null).

Show the schema diff only. Stop and wait for my approval before anything else.

---

# SESSION 1B — Auth wiring (after schema approved)

Read CLAUDE.md and .stitch/DESIGN.md.

Wire apps/mobile/screens/AuthScreen.tsx to real auth:
- Email signup/login → Supabase Auth with PKCE flow
- Apple Sign In → expo-apple-authentication
- Google Sign In → expo-auth-session
- Forgot password → Supabase resetPasswordForEmail
- On success → set Zustand authStore.user and navigate to onboarding or home based on onboardingComplete flag

Rules:
- Do not redesign. Preserve all layout and styling exactly.
- MMKV encrypted wrapper only for session persistence — never AsyncStorage.
- Apple Sign In is mandatory because Google is offered (App Store rule).
- Show diff. Wait for approval. Then apply.

---

# SESSION 1C — Onboarding flow wiring

Read CLAUDE.md and .stitch/DESIGN.md.

Wire apps/mobile/screens/OnboardingFlowScreen.tsx to real data:
- Goal step → PATCH /users/me { goal }
- Frequency step → PATCH /users/me { trainingFrequency }
- Units step → PATCH /users/me { units } — store in MMKV encrypted wrapper too
- Import step → POST /ai/parse-import with screenshot base64 — use Wali AI (claude-sonnet-4-6)
- Complete step → PATCH /users/me { onboardingComplete: true } then fire Wali AI cold-start trigger after 1500ms delay

On onboardingComplete = true:
- Navigate to HomeScreen (bottom tabs)
- CoachScreen shows cold-start prompt on first open

Show diff. Wait for approval. Then apply.

---

# ── FEATURE F2 · WORKOUT LOGGING ────────────────
# SESSION 2A — Schema

Read CLAUDE.md and .stitch/DESIGN.md.

Feature F2 — Workout Logging. Schema first.

Show me the Prisma schema diff for workouts. It needs:
- Workout (id, userId, name, startedAt, finishedAt, totalVolumeKg, notes)
- Exercise (id, name, muscleGroup, equipment, force, mechanic — seeded)
- WorkoutExercise (workoutId, exerciseId, order)
- WorkoutSet (id, workoutExerciseId, setNumber, weightKg, reps, completedAt, rpe nullable)
- PersonalRecord (userId, exerciseId, weightKg, reps, achievedAt)

All weights in kg in the DB. All durations in seconds in the DB.

Show schema diff only. Stop and wait for approval.

---

# SESSION 2B — Active Workout wiring

Read CLAUDE.md and .stitch/DESIGN.md.

Wire apps/mobile/screens/ActiveWorkoutScreen.tsx to real data:
- Start workout → POST /workouts → store workoutId in Zustand workoutStore
- Log set → POST /workouts/:id/sets — fire immediately on checkmark tap, do not batch
- Every set mutation goes through offline sync queue (app kill must not lose data)
- Plate calculator reads units preference from MMKV encrypted wrapper
- Timer reads/writes restTimerStore in Zustand
- Add exercise → opens ExerciseLibraryScreen in pick mode → POST /workouts/:id/exercises

Show diff. Wait for approval. Then apply.

---

# SESSION 2C — Workout Complete wiring

Read CLAUDE.md and .stitch/DESIGN.md.

Wire apps/mobile/screens/WorkoutCompleteScreen.tsx to real data:
- On mount: GET /workouts/:id/summary → replace all mock stats
- PR detection: compare against GET /users/me/prs — highlight new ones in green
- Tree impact: read before/after from GET /users/me/vitality/today
- Arena share button: POST /arena/events { type: 'pr', workoutId, exercises }
- Finish button: PATCH /workouts/:id { finishedAt: now }

Show diff. Wait for approval. Then apply.

---

# SESSION 2D — Exercise Library wiring

Read CLAUDE.md and .stitch/DESIGN.md.

Wire the ExerciseLibraryScreen component in apps/mobile/screens/RemainingScreens.tsx:
- Fetch: GET /exercises?muscleGroup=&search= with TanStack Query
- Debounce search input 300ms
- Filter by muscle group locally after initial fetch (no re-fetch on filter change)
- mode='pick': add button calls onSelect(exerciseId) callback — no navigation
- mode='browse': row tap navigates to ExerciseDetailScreen (show full history and PRs)

Show diff. Wait for approval. Then apply.

---

# ── FEATURE F9 · REST TIMER ─────────────────────
# SESSION 3 — Rest Timer wiring

Read CLAUDE.md and .stitch/DESIGN.md.

Wire apps/mobile/components/RestTimerSheet.tsx:
- Default duration reads from Zustand userPrefsStore.restTimerSeconds (set in Settings)
- On set completion in ActiveWorkoutScreen → auto-start rest timer via restTimerStore.start(seconds)
- Haptic at 10 seconds remaining → expo-haptics impactAsync Medium
- Haptic + audio at 0 seconds → expo-haptics notificationAsync Success + expo-av short beep
- Timer persists across tab switches — bottom sheet stays visible on all tabs during active workout
- Full-screen expand/collapse does not reset the timer
- Skip → restTimerStore.stop()
- ±15s buttons → restTimerStore.adjust(±15)

Show diff. Wait for approval. Then apply.

---

# ── FEATURE F3 · VITALITY TREE ──────────────────
# SESSION 4A — Schema

Read CLAUDE.md and .stitch/DESIGN.md.

Feature F3 — Vitality Tree. Schema first.

Show me the Prisma schema diff for vitality. It needs:
- VitalityDay (id, userId, date, stepsScore, proteinScore, waterScore, totalScore, stage)
- Scores computed server-side from steps/protein/water actuals vs goals
- Weights: steps 40%, protein 30%, water 30%
- Stage thresholds: Wilted 0-15, Recovering 16-35, Sprout 36-55, Growing 56-75, Thriving 76-90, Full Vitality 91-100

Show schema diff only. Stop and wait for approval.

---

# SESSION 4B — Tree Detail wiring

Read CLAUDE.md and .stitch/DESIGN.md.

Wire the TreeDetailScreen component in apps/mobile/screens/RemainingScreens.tsx:
- Fetch: GET /users/me/vitality/today → pillar scores, total, stage
- Fetch: GET /users/me/vitality/history?days=7 → 7-day bar chart data
- Steps pillar → read from HealthKit / Google Fit bridge (NOT from manual input, NEVER)
- TreeAtRiskModal: trigger if totalScore < 50 and time > 19:00 local
- StreakModal: trigger on first open if streak >= 7 and not shown today (check MMKV flag)

Show diff. Wait for approval. Then apply.

---

# ── FEATURE F4 · CALENDAR ───────────────────────
# SESSION 5 — Calendar wiring

Read CLAUDE.md and .stitch/DESIGN.md.

apps/mobile/screens/CalendarScreen.tsx is scaffolded.

Wire it to real data:
- Month view: GET /workouts?month=YYYY-MM → dot indicators on completed days
- Week view: GET /workouts?week=YYYY-WW → workout cards per day
- Day detail modal: GET /workouts/:id → full session summary
- Scheduled days come from userPrefsStore.trainingDays (set in Onboarding / Preferences)
- Empty day state: show "Rest day" or "Scheduled — no workout logged yet" based on trainingDays

Show diff. Wait for approval. Then apply.

---

# ── FEATURE F6 · NUTRITION LOGGER ───────────────
# SESSION 6A — Schema

Read CLAUDE.md and .stitch/DESIGN.md.

Feature F6 — Nutrition Logger. Schema first.

Show me the Prisma schema diff:
- ProteinLog (id, userId, date, amountG, label nullable, loggedAt)
- HydrationLog (id, userId, date, amountMl, loggedAt)
- Steps come from Apple Health / Google Fit bridge — NOT stored in our DB, read-only via native bridge

Show schema diff only. Stop and wait for approval.

---

# SESSION 6B — Nutrition wiring

Read CLAUDE.md and .stitch/DESIGN.md.

Wire apps/mobile/screens/NutritionLogScreen.tsx to real data:

Protein tab:
- Fetch: GET /nutrition/protein/today → total and log entries
- Quick add presets → POST /nutrition/protein { amountG, label: null }
- Custom add → POST /nutrition/protein { amountG, label: userInput }
- Wali AI insight card → GET /ai/nudge/protein (cached, max 1 call/hour)

Hydration tab:
- Fetch: GET /nutrition/water/today → totalMl and log entries
- Glass tap / quick add → POST /nutrition/water { amountMl }

Steps tab:
- Read from HealthKit (iOS) or Google Fit (Android) native bridge
- Display only — no POST endpoint, no manual entry, no edit button

All mutations through offline sync queue.
Show diff. Wait for approval. Then apply.

---

# ── FEATURE F7 · SETTINGS ───────────────────────
# SESSION 7 — Settings wiring

Read CLAUDE.md and .stitch/DESIGN.md.

Wire apps/mobile/screens/SettingsScreen.tsx to real data:

Edit Profile: PATCH /users/me { displayName, username } — check username availability GET /auth/check-username?username= debounced 600ms

Preferences: PATCH /users/me { units, proteinGoal, waterGoal, stepsGoal, trainingDays } — also sync units to MMKV encrypted wrapper immediately

Notifications: PATCH /users/me/notification-prefs — each toggle fires independently

Account: change email / password via Supabase Auth methods

Data Export: POST /users/me/export → returns signed S3 URL → open in browser

Delete Account: POST /users/me/delete — requires typed DELETE confirmation — deactivates immediately, hard delete after 30 days

Legal: open WebView with privacy policy / terms URLs from config

Show diff. Wait for approval. Then apply.

---

# ════════════════════════════════════════════
# TIER 2 — EXTENDED FEATURES
# Only start after Tier 1 full loop works on device.
# ════════════════════════════════════════════

---

# ── FEATURE F1 · WALI AI ────────────────────────
# SESSION 8A — Coach home + chat wiring

Read CLAUDE.md and .stitch/DESIGN.md.

Wire apps/mobile/screens/CoachScreen.tsx — Chat view only first:

- Message send → POST /ai/chat { message, conversationId }
- Streaming response → SSE endpoint, render tokens as they arrive
- Conversation history persists in Zustand coachStore.messages (MMKV encrypted wrapper for persistence across app kills)
- Context injected server-side (not from client): today's workout, vitality score, streak, last 7 days
- Disclaimer banner is always visible — never hide it
- Model: claude-sonnet-4-6 on backend via apps/backend/src/waliAI/

Show diff. Wait for approval. Then apply.

---

# SESSION 8B — Program Architect wiring

Read CLAUDE.md and .stitch/DESIGN.md.

Wire apps/mobile/screens/CoachScreen.tsx — Program Architect view:

- Generate → POST /ai/program/generate { goal, frequency, equipment }
- Streams back structured JSON: { weeks, days[], rationale }
- Parse stream progressively — show rationale first, then days as they arrive
- Regenerate → POST /ai/program/generate (same params, new seed)
- Accept → POST /programs { generatedProgramId } → saves to DB → updates CalendarScreen

Show diff. Wait for approval. Then apply.

---

# ── FEATURE F10 · NOTIFICATIONS ─────────────────
# SESSION 9 — Notifications wiring

Read CLAUDE.md and .stitch/DESIGN.md.

Wire notifications:
- Permission priming screen in RemainingScreens.tsx: trigger after first completed workout — NOT at app launch
- Request via expo-notifications — show system dialog only after user taps "Sure" on priming screen
- Notification types to schedule:
  - Workout reminder: trigger on trainingDays at user's preferred time (default 8am) if no workout logged yet
  - Streak at risk: 7pm if dailyVitalityScore < 50
  - Session reminder: 60min before accepted group sessions
- Quiet hours: read from Zustand userPrefsStore.quietHours — suppress all notifications in that window
- POST /users/me/push-token on permission grant

Show diff. Wait for approval. Then apply.

---

# ── FEATURE F11 · OFFLINE MODE ──────────────────
# SESSION 10 — Offline wiring

Read CLAUDE.md and .stitch/DESIGN.md.

Wire offline mode components in apps/mobile/screens/RemainingScreens.tsx:

- OfflineBanner: subscribe to NetInfo — show automatically when offline, hide when reconnected
- SyncStatusIndicator: reads Zustand syncStore.pendingCount — show count, tap triggers manual sync
- Sync queue: every mutation (sets, nutrition logs, run data) writes to MMKV queue when offline
- On reconnect: process queue in order, retry failed items up to 3 times with exponential backoff
- Conflict resolution: server wins — if server has newer timestamp, discard local version and notify user

Show diff. Wait for approval. Then apply.

---

# ── FEATURE F12 · WALIRUN GPS ───────────────────
# SESSION 11A — WaliRun schema

Read CLAUDE.md and .stitch/DESIGN.md.

Feature F12 — WaliRun. Schema first.

Show Prisma schema diff:
- RunSession (id, userId, mode, distanceKm, durationSeconds, avgPaceSecPerKm, startedAt, finishedAt, routeGeoJSON nullable)
- RunSplit (id, runSessionId, splitKm, splitTimeSeconds, cumulativeTimeSeconds)
- PersonalRecord already covers runs — add runSessionId nullable FK

All durations in seconds. All distances in km.
Show schema diff only. Stop and wait for approval.

---

# SESSION 11B — WaliRun wiring

Read CLAUDE.md and .stitch/DESIGN.md.

Wire apps/mobile/screens/WaliRunScreen.tsx to real data:

Pre-run: 
- GPS check → expo-location getCurrentPositionAsync — show Strong/Weak/None based on accuracy
- Battery → expo-battery getBatteryLevelAsync

Active run:
- Start → POST /runs → runId in Zustand runStore
- GPS tracking → expo-location watchPositionAsync — foreground only in V1
- Distance, pace, elapsed computed client-side from coords
- Splits fired automatically every 1km → POST /runs/:id/splits
- Screen stays on → expo-keep-awake activateKeepAwake on start, deactivate on finish

Run summary:
- Finish → PATCH /runs/:id { finishedAt, distanceKm, durationSeconds, routeGeoJSON }
- PR detection → compare against GET /users/me/prs/run
- Steps: run distance auto-counts toward daily step goal via HealthKit / Google Fit — no manual bridge needed

Show diff. Wait for approval. Then apply.

---

# ════════════════════════════════════════════
# TIER 3 — ARENA
# Start only after Tier 1 + Tier 2 are stable on device.
# ════════════════════════════════════════════

---

# ── FEATURE F8 · ARENA ──────────────────────────
# SESSION 12A — Arena schema

Read CLAUDE.md and .stitch/DESIGN.md.

Feature F8 — Arena. Schema first.

Show Prisma schema diff:
- ArenaEvent (id, userId, type: workout_complete|pr|run_complete, refId, content, createdAt)
- Reaction (id, eventId, userId, emoji)
- Friendship (id, requesterId, addresseeId, status: pending|accepted|declined)
- Challenge (id, creatorId, type, title, endsAt, participantIds[])
- GroupSession (id, creatorId, workoutName, scheduledAt, ghostMode bool, memberIds[])
- Message (id, senderId, recipientId, content, sentAt — DMs only between mutual friends)
- Badge (id, slug, name, category, rarity: common|rare|epic|legendary)
- UserBadge (userId, badgeId, earnedAt)

Show schema diff only. Stop and wait for approval.

---

# SESSION 12B — Arena Feed wiring

Read CLAUDE.md and .stitch/DESIGN.md.

Wire apps/mobile/screens/ArenaScreen.tsx — Feed tab:
- Fetch: GET /arena/feed?cursor= with TanStack Query infinite scroll
- Pull to refresh
- Reactions: POST /arena/events/:id/reactions { emoji } — optimistic update
- Event types: workout_complete, pr, run_complete — each renders different card layout
- Share workout → POST /arena/events from WorkoutCompleteScreen already wired — just confirm it appears

Show diff. Wait for approval. Then apply.

---

# SESSION 12C — Friends wiring

Read CLAUDE.md and .stitch/DESIGN.md.

Wire the FriendsScreen component in apps/mobile/screens/ArenaExtendedScreens.tsx:
- Friends list: GET /friends
- Pending requests: GET /friends/requests
- Accept: POST /friends/requests/:id/accept
- Decline: POST /friends/requests/:id/decline
- Add friend search: GET /users/search?username= debounced 400ms
- Send request: POST /friends/requests { addresseeId }
- Compatibility %: GET /friends/:id/compatibility (cached, not real-time)
- DM button: only visible for mutual friends

Show diff. Wait for approval. Then apply.

---

# SESSION 12D — Challenges wiring

Read CLAUDE.md and .stitch/DESIGN.md.

Wire the ChallengesScreen component in apps/mobile/screens/ArenaExtendedScreens.tsx:
- Active: GET /challenges?status=active
- Past: GET /challenges?status=ended
- Leaderboard per challenge: GET /challenges/:id/leaderboard
- Join: POST /challenges/:id/join
- Create: POST /challenges { type, title, endsAt, invitedFriendIds[] }
- Rankings update in real-time via Supabase Realtime subscription on challenge_participants table

Show diff. Wait for approval. Then apply.

---

# SESSION 12E — Badges wiring

Read CLAUDE.md and .stitch/DESIGN.md.

Wire the BadgesScreen component in apps/mobile/screens/ArenaExtendedScreens.tsx:
- Fetch: GET /users/me/badges → earned array
- Fetch: GET /badges → all badges catalog (seeded, static)
- Locked badges show criteria in tooltip on tap
- Badge award: triggered server-side after relevant actions — client just subscribes to Supabase Realtime on user_badges table and shows a toast when a new row appears

Show diff. Wait for approval. Then apply.

---

# SESSION 12F — Group Sessions wiring

Read CLAUDE.md and .stitch/DESIGN.md.

Wire the SessionsScreen component in apps/mobile/screens/ArenaExtendedScreens.tsx:
- Active/upcoming: GET /sessions?status=active,upcoming
- Create: POST /sessions { name, workoutName, scheduledAt, ghostMode, invitedFriendIds[] }
- Join: POST /sessions/:id/join
- Start my session: links to ActiveWorkoutScreen with sessionId in params
- Ghost mode: participants can't see each other's sets until all finish — reveal on WorkoutCompleteScreen
- Real-time member count: Supabase Realtime on session_members table

Show diff. Wait for approval. Then apply.

---

# SESSION 12G — DMs wiring

Read CLAUDE.md and .stitch/DESIGN.md.

Wire the DMsScreen component in apps/mobile/screens/ArenaExtendedScreens.tsx:
- Threads list: GET /messages/threads
- Thread view: GET /messages/thread/:friendId
- Send: POST /messages { recipientId, content }
- Real-time: Supabase Realtime on messages table — new messages appear without pull-to-refresh
- Available to mutual friends only — enforce on both client (hide DM button) and server (403 if not mutual)
- Unread count: badge from GET /messages/unread-count — poll every 30s (Realtime subscription preferred in V2)

Show diff. Wait for approval. Then apply.

---

# ════════════════════════════════════════════
# MAINTENANCE PROMPTS
# Use these anytime, any session.
# ════════════════════════════════════════════

---

# END OF SESSION CHECKPOINT (run before closing every session)

Before we close:
1. List every file modified this session
2. One line per file: what changed and why
3. Any half-finished migrations or uncommitted mutations?
4. Anything I need to manually test on device before next session?

Do not start any new work. Checkpoint only.

---

# REVERT + REDO (when Claude goes off-script)

Stop. You changed [what it changed] and I didn't ask for that.

Revert [filename] to its state before this session.
Then apply ONLY this change: [restate original ask].

The scaffold is the source of truth for layout and styling.
Your job is to wire data, not redesign.

---

# RE-ANCHOR (paste at top of any prompt if Claude forgets the rules mid-session)

Before continuing, re-read CLAUDE.md and .stitch/DESIGN.md.

Reminders:
- Never hardcode colors or spacing — always apps/mobile/theme.ts
- Never use AsyncStorage — MMKV encrypted wrapper only
- Never add manual step entry
- Dark text (#002f2f) on primary (#0BBFBD teal) — never white on primary
- Show diff. Wait for approval. Then apply.

---

# ════════════════════════════════════════════
# QUICK REFERENCE — FEATURE → SESSION MAP
# ════════════════════════════════════════════

# TIER 1
# Session 0  → First time setup + doc confirmation
# Session 1A → F5 Onboarding schema
# Session 1B → F5 Auth wiring
# Session 1C → F5 Onboarding flow wiring
# Session 2A → F2 Workout schema
# Session 2B → F2 Active Workout wiring
# Session 2C → F2 Workout Complete wiring
# Session 2D → F2 Exercise Library wiring
# Session 3  → F9 Rest Timer wiring
# Session 4A → F3 Vitality Tree schema
# Session 4B → F3 Tree Detail wiring
# Session 5  → F4 Calendar wiring
# Session 6A → F6 Nutrition schema
# Session 6B → F6 Nutrition wiring
# Session 7  → F7 Settings wiring

# TIER 2
# Session 8A → F1 Wali AI chat wiring
# Session 8B → F1 Program Architect wiring
# Session 9  → F10 Notifications wiring
# Session 10 → F11 Offline mode wiring
# Session 11A → F12 WaliRun schema
# Session 11B → F12 WaliRun wiring

# TIER 3
# Session 12A → F8 Arena schema
# Session 12B → F8 Arena Feed wiring
# Session 12C → F8 Friends wiring
# Session 12D → F8 Challenges wiring
# Session 12E → F8 Badges wiring
# Session 12F → F8 Group Sessions wiring
# Session 12G → F8 DMs wiring

# TOTAL: 24 sessions to complete V1
