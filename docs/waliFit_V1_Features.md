# waliFit — V1 Complete Feature Specification
> Core loop: Train → Log → Progress → Compete → Repeat
> 12 core features · 3 AI capabilities · 5 social features · 2 legal requirements

---

## NON-NEGOTIABLE RULES

- Never hardcode hex or spacing — import from `react-native/theme.ts`
- Never white text on `colors.primary` (#0BBFBD teal). `primaryFg` = #000000 always
- Steps NEVER manually entered — Apple Health / Google Fit read-only only
- MMKV encrypted wrapper only — never AsyncStorage
- Every mutation through offline sync queue — app kill must never lose a set
- All weights stored kg in DB, durations in seconds. UI converts on display
- No AI SDK imports outside `src/waliAI/`
- Wali AI disclaimer banner always visible — never hidden
- Push notification permission after first workout only — never at launch
- In-app account deletion required — Apple will reject without it
- lucide-react-native icons only — no Ionicons anywhere
- Every screen needs 4 states: loading, success, empty, error
- V1 is 100% free. Paywall at V2.5 only

---

## Navigation — 5 Bottom Tabs

`Home · Train · Calendar · Coach · Arena`

- **Home** — Vitality Tree + today's workout card + nutrition rings + streak
- **Train** — Active plan + workout library + custom builder. WaliRun is a sub-tab inside Train
- **Calendar** — Monthly/weekly views. All workouts, runs, AI sessions anchored to dates
- **Coach** — Wali AI chat + Program Architect + Journal (V1.5 tab added later)
- **Arena** — PR feed, leaderboards, squads, run clubs, friends, DMs

---

## SECTION A — AI & Coaching

### Feature 1 — Wali AI
Built on Claude Sonnet (complex coaching) + Gemini Flash (high-volume tasks). Entire AI service lives in `src/waliAI/` — no AI SDK imports anywhere else.

**Program Architect**
- Generate 4–6 week training blocks from goals, schedule, equipment
- Supports: strength, fat loss, muscle gain, hybrid performance, conditioning
- Returns structured JSON mapped directly to calendar PlannedSession rows
- BullMQ job → returns jobId immediately → WebSocket emits `plan:ready` → user reviews → accepts → Calendar populates

**Daily Coach Chat**
- Complexity classifier: complex → Claude Sonnet, simple → Gemini Flash
- Full user context injected every call: goals, recent workouts, plan, nutrition 7-day avg
- Response streams via SSE token-by-token
- AI disclaimer banner always visible above input bar

**Workout Adjustment Engine** — lives inside Daily Coach Chat, no separate screen

**Cold-Start Message**
- Wali AI speaks first — fires 1.5s after `onboardingComplete = true` via BullMQ
- Personalised to stated goal. Exactly one follow-up question. Never "How can I help today?"
- Delivered as push notification AND inserted into Coach chat

**RAG Knowledge Base**
- 800+ exercises from wger API embedded via pgvector on Railway PostgreSQL
- ~$5/month at 1,000 users. No separate vector DB needed.

> V2 unlocks: Nutrition AI · V2.5: AI Program Evolution · V2.5: HRV deload suggestions

### Feature 5 — Onboarding & User Profile
Completable under 3 minutes. Each step saves to server immediately (not on final submit).

- Goal + training setup: goals, experience, training days, equipment, injuries
- Units: kg or lbs — DB always stores kg, UI converts. Defaults to device locale
- Daily targets: protein (g) + water (ml) — Wali AI suggests, user can override
- Return path: `onboardingComplete` + `onboardingStep` on User model — app reopens at correct step
- Multimodal import: Gemini Vision reads Hevy/Strava/MFP/Strong screenshots → pre-fills fields

> V2 unlocks: Female Training Considerations · Progress & Analytics · Body Metrics

---

## SECTION B — Training Core

### Feature 2 — Hybrid Performance Engine

**Workout Logging**
- Sets, reps, weight (kg stored, displayed per unitSystem), RPE per set
- Notes per session
- All timestamped → feeds Vitality Tree activity pillar, PR feed, Wali AI context
- Offline: every set fires POST immediately + MMKV queue if offline

**Active Workout Flow**
1. Tap workout → `ActiveWorkoutScreen` opens as full-screen modal (`gestureEnabled: false`)
2. Each set checkmark → POST `/workouts/:id/sets` immediately (not batched)
3. Set saved to MMKV queue if offline
4. Rest Timer auto-starts after set log (if enabled in settings)
5. Finish → PATCH `/workouts/:id { finishedAt }` → server PR check → `WorkoutCompleteScreen`
6. WorkoutCompleteScreen shows: PRs, tree impact before/after, Arena share prompt
7. Done → Home → tree animates to new state

**Custom Workout Builder** — create from scratch, save templates, assign to calendar

**AI-Generated Plan Editing** — edit any session in a Wali AI plan, ask Wali to revise sections

**Exercise Library** — 800+ exercises, cached locally (MMKV), works fully offline

**Plate Math Calculator** — target weight → plate distribution, kg + lbs

> V2 unlocks: RPE-Linked Rest Extension · V2.5: Conditioning Event Expansion · V3: Bar Path/AI Form Coach

### Feature 12 — WaliRun

**GPS Run Tracking (foreground only in V1)**
- expo-location, screen stays on
- Real-time: pace, avg pace, elapsed distance, elapsed time
- Audio cues at every km/mile split
- Route stored as polyline on WorkoutLog

**Standard Distances** — 1 mile, 2 mile, 3 mile, 2K, 5K + Free Run mode
- Auto-stops at target distance
- Both metric and imperial pace shown regardless of units preference

**Run Stats Report** — appears immediately after run
- Distance, time, avg pace, fastest/slowest split, splits chart
- PR delta: "+45s off your 5K PR" or "NEW 5K BEST"
- Shareable stats card — all client-side, no extra API calls

**Run PRs** — PRRecord with `exerciseName: '5K Run'`, `unit: 'seconds'`
- New PR → Arena PR feed + squad notification + tree milestone

**Run Schema Fields on WorkoutLog** (add before any other code):
```
runDistanceM, runDurationS, runPaceSPerKm, runType,
runDistancePreset, runRoutePolyline, runSplitPaces
```

> V2 unlocks: Background GPS · V2.5: Station-to-Run Timer, wearables

### Feature 4 — waliFit Calendar
- Daily view: today's workout/run + nutrition + tree status
- Weekly view: training/rest days, completed vs upcoming, streak visibility
- Monthly view: colour-coded states (completed/rest/missed/upcoming)
- Time-based linking: AI plans map to real dates, streak is timezone-aware
- Late logging window: accepts logs until 2am local for previous day

> V2 unlocks: Squad challenge deadlines, shared programme sessions

---

## SECTION C — Gamification

### Feature 3 — Vitality Garden

**Vitality Tree** — central home screen presence. Primary retention mechanic.
- 6 stages: Wilted (0–15) · Recovering (16–35) · Sprout (36–55) · Growing (56–75) · Thriving (76–90) · Full Vitality (91–100)

**Daily Health Score Formula**
```
totalScore = (steps/stepsGoal * 0.40) + (proteinG/proteinTargetG * 0.30) + (waterMl/waterTargetMl * 0.30)
```
Each pillar capped at 1.0. On rest days activity pillar = 0.5 (neutral) — tree never penalises recovery.

**Training Day vs Rest Day Logic**
- Training days: all 3 pillars active
- Rest days: activity = 0.5 neutral. Hydration + protein still count.
- Schedule set in onboarding, adjustable via Calendar

**Wilt Mechanic & Streak Freeze**
- Tree drops when goals missed multiple consecutive days
- At-risk notification fires evening before streak breaks
- Freeze tokens earned at: 7, 30, 60, 100, 180, 365 day milestones
- One token = `isFreezeDay = true` → streak doesn't break

**Consistency Streak**
- Timezone-aware (Luxon: `DateTime.now().setZone(timezone)`)
- Visible to squad members in Arena

> V2 unlocks: Tree Biomes · Squad Forests · Weekly Challenges · Seed Economy

---

## SECTION D — Nutrition Foundation

### Feature 6 — Simple Nutrition Logger (V1 only)
Intentionally minimal — just enough to feed the Vitality Tree protein + hydration pillars.

- Daily protein: log total grams, incrementally throughout day
- Daily hydration: one-tap glass addition from home screen
- Both accessible from home screen in one tap
- Feeds DailyScore.protein (30%) and DailyScore.hydration (30%)
- PATCH `/api/v1/nutrition/simple/:date` → server recalculates DailyScore → tree updates

> V2 unlocks: Smart Fuel (meal parsing, barcode scanner, food rating Green/Yellow/Red)

---

## SECTION E — The Arena

### Feature 8 — The Arena
One social layer, two squad flavours. Workout Squads and Run Clubs share the same infrastructure.

**Workout Squads**
- Create/join by code. Max 30 members (V1).
- Training leaderboard: workouts completed, vitality score, streak, weekly PRs
- Group messaging (text-only V1)
- Deep link invite

**Run Clubs** — `Squad` with `squadType = 'run_club'`
- Run leaderboard: best times per standard distance
- `SELECT MIN(value) FROM PRRecord WHERE exerciseName IN (...) AND userId IN (...)`
- Weekly km total as secondary metric
- Run challenges: admin posts distance + deadline, members submit times

**Arena Leaderboard** — two tabs: Training + Run. Present in ALL squads.
- Workout Squad member who runs → still appears on Run tab
- Run Club member who lifts → still appears on Training tab

**PR Feed** — auto-generated events. Users never post manually.
- Strength PR, run PR, streak milestone, tree growth
- Reactions: Cheer and Nudge

**Arena Event Chain**
1. Workout/run completes → server checks PRRecord for new best
2. If PR → ArenaEvent row created → squad push notification
3. PR in feed with Cheer/Nudge buttons
4. Optimistic local increment + POST `/arena/events/:id/reactions`
5. Squad leaderboard re-ranks

**Friend System**
- States: None → Pending → Friends → Blocked
- DMs only after mutual friendship
- Text-only V1

> V2 unlocks: Squad Forests, Squad Challenges, Shared Programmes, waliFit Commons

---

## SECTION F — UX & Utility

### Feature 9 — Rest Timer
- Start with one tap after logging a set
- Configurable per exercise
- Background alert via `expo-notifications` — fires even with screen locked
- Haptic alert on completion
- Fully offline — no network dependency
- Zustand store consumed by ActiveWorkoutScreen

### Feature 10 — Smart Notifications
**Types:** workout reminders · hydration nudges · streak at-risk · squad activity · cold-start coach

**Permission timing — critical:**
- Request AFTER first workout completion
- NEVER at app launch (iOS denial rate much higher)
- NEVER during onboarding
- Fallback: in-app banner if permission denied

### Feature 11 — Offline Mode
**Works fully offline:**
- Active workout logging (MMKV queue)
- Rest timer
- Exercise library (cached on first load)
- Today's workout from active plan (cached on open)
- GPS run tracking (on-device, syncs on reconnect)
- Vitality Tree + streak (local state)
- Calendar view (cached schedule)
- Protein + hydration logging (queued)

**Sync on reconnect:** auto-upload → server recalculates streak + scores → sync status indicator shown

---

## SECTION G — Settings & Legal

### Feature 7 — Settings Screen
Apple will reject without in-app account deletion. Not optional.

**Profile & Preferences:** display name, photo, units, targets, training schedule, rest timer default

**Notification Settings:** per-type toggles — never all-or-nothing

**Account Management:**
- Export data: downloadable JSON (GDPR)
- Delete account: in-app required. Soft-delete immediately. Hard-delete all data in 30 days. Type "DELETE" to confirm.

**Legal & Privacy:** Privacy Policy link · Terms of Service link · AI Disclaimer · AI training data opt-out

**AI Processing Disclosure (required for 2026 App Store):**
- On-device: GPS, rest timer, tree, streak, exercise library, offline logging
- Sent to Anthropic: Wali AI messages, training context, workout history
- Sent to Google: nutrition parsing, food photos, simple questions, onboarding import
- Sent to waliFit servers: workout logs, run data, squad activity, messages

---

## V1 Feature Build Order

| # | Feature | Phase | Effort |
|---|---|---|---|
| 5 | Onboarding & Profile | 1 | 1 week |
| 2 | Hybrid Performance Engine | 2 | 2 weeks |
| 4 | waliFit Calendar | 3 | 1 week |
| 6 | Simple Nutrition Logger | 4 | 3 days |
| 3 | Vitality Garden | 5 | 1 week |
| 1 | Wali AI | 6 | 1–2 weeks |
| 12 | WaliRun | 7 | 5–7 days |
| 7 | Settings Screen | 8 | 1 week |
| 9 | Rest Timer | 9 | 3 days |
| 10/11 | Notifications + Offline | 10 | 1 week |
| 8 | The Arena | 11 | 2 weeks |

**Total solo: 15–17 weeks. With two devs: 7–9 weeks.**
**Build Phases 1–5 first. Validate Vitality Tree end-to-end before Arena or WaliRun.**

---

## V1.5 — Athlete Journal + Wali AI Memory

Ships post-launch. 3–4 days engineering. No new screens. No new tables.

**Schema ships in V1 (not V1.5) — empty, nullable, zero user impact:**
- `WorkoutLog.sessionRpe Int?`
- `WorkoutLog.notes String?`
- `UserMemory` table (full spec in Technical Architecture Section 12)

### 13.1 Session Notes — WorkoutCompleteScreen
- RPE chips (1–10, session-level) above Save & finish button
- Free-text notes field (max 500 chars), optional, skip always visible
- PATCH `/workouts/:id { sessionRpe, notes }` through offline sync queue
- File: `react-native/screens/WorkoutCompleteScreen.tsx`

### 13.2 Live Notes FAB — ActiveWorkoutScreen
- Pencil icon top-right header → compact bottom sheet
- Saved to `activeWorkoutStore.notes` (Zustand + MMKV)
- Carries forward pre-filled into WorkoutCompleteScreen
- File: `react-native/screens/ActiveWorkoutScreen.tsx`

### 13.3 Journal Tab — CoachScreen
- Third tab: Chat · Program · Journal
- Reverse-chronological entries grouped by week
- RPE colour-coded: 1–4 green · 5–7 amber · 8–10 red
- Wali AI reads journal as context — add `recentNotes` to `buildUserContext()` in `src/waliAI/context/builder.ts`
- Fetch: `GET /workouts?hasNotes=true&limit=30`
- File: `react-native/screens/CoachScreen.tsx`

### 13.4 Calendar Day Detail Notes
- Collapsed "📝 Session notes" section on existing day detail modal
- No new API call — notes + sessionRpe already on WorkoutLog response
- File: `react-native/screens/CalendarScreen.tsx`

**Build order: 13.1 → 13.3 → 13.2 → 13.4**

**What is NOT in V1.5:** tags, folders, rich text, pinned notes, standalone Notes tab, note search, run notes, AI-generated summaries

---

## Release Map

| Release | What Ships |
|---|---|
| **V1** | All 12 features above. 100% free. |
| **V1.5** | Athlete Journal + Wali AI Memory System |
| **V2** | Smart Fuel · Tree Biomes · Squad Forests · RPE-Linked Rest · Female Training · Progress & Analytics · Background GPS · waliFit Commons · Widget · Referral |
| **V2.5** | Global Arena · Adaptive AI · Station-to-Run · Vision Meal Scanner · Wearables · Subscription tiers (Pro + Elite via RevenueCat) |
| **V3** | Bar Path Tracking · Velocity Loss Monitoring · AI Form Coach (computer vision) |

---

## V2 — Coaching Programme, Check-In Snapshots & Badges

Three connected V2 features forming a complete retention loop.

### Feature 14 — Coaching Programme

- Stateful drafting session in Coach. ProgrammeDraft table backs the draft (not context window).
- Each conversational refinement overwrites `draftData`. Draft = scratch pad.
- Confirmation: Wali AI detects intent → surfaces UI button with programme summary → user taps confirm.
- On confirm: BullMQ writes PlannedSession rows → Calendar populates → `programme:ready` WebSocket.
- Previous programme auto-archives on new confirmation.
- `plannedData` IMMUTABLE. User edits → `modifiedFields` only. Wali AI reads modification patterns as coaching signals.
- Delete (draft): row deleted, no Calendar impact. Delete (active): future sessions cascade-deleted, status → "deleted". Completed workouts and check-ins never deleted.
- Status: `"active" | "archived" | "deleted" | "completed"`. Completed → Gold badge.
- Programme sets protein/water/weight targets and check-in cadence. Analytics: target vs actual.

### Feature 15 — Check-In Snapshots

- Weekly (configurable) Wali AI prompt in Coach. Captures: weight (kg), optional measurements, optional photo, energy 1–10, notes.
- Never called BMI in UI. Weight + measurements only — less contested, legally safer.
- Feeds analytics: weight trend, measurement trend, energy over time, planned vs actual.
- Declining energy over 4 weeks = overtraining signal Wali AI flags before the user does.

### Feature 16 — Badges, Challenge Library & Points System

**Design philosophy:** Pokémon-inspired collection mechanic — serious. Earned by athletic achievement only. No XP bars, no login streaks, no participation trophies. Badges reveal when earned — not a visible checklist.

**The Vitality Tree is NOT part of this system.** It is a personal coaching and health tracking tool. It has no points, no leaderboard connection, no competitive element. Completely separate.

---

**Three interconnected systems:**

```
PASSIVE BADGES      →  fire automatically on athletic events (V1)
CHALLENGE LIBRARY   →  48 challenges across 4 categories, 3 tiers (browsable V1, earnable V2)
POINTS + LEADERBOARD →  competitive ranking, athlete identity, status tiers (V2)
```

---

**Badge tiers:**
- **Iron** — entry, earnable by any new user in their first session
- **Bronze** — requires consistency over days/weeks or completing a full beginner challenge tier
- **Silver** — performance milestones, completing full medium challenge tiers
- **Gold** — elite, most users never earn these
- **Legendary** — complete all 48 challenges. Most users never see this.

**Display rules:**
- PR Feed (global): NEVER shows squad badges. Personal PRs, milestones, Programme Complete only.
- Profile: 3 pinnable badges at top. Full collection by tier below. Squad badges collapsed → expand for per-squad breakdown.
- Badges accumulate across all squads ever joined. Leaving never removes a badge.

---

**What ships in V1 — passive triggers only:**

V1 ships 7 badges triggered automatically by athletic events. No challenge badges. No points. No leaderboard. The challenge library is seeded and browsable — users can see all 48 challenges and plan for them — but cannot earn them until V2.

| Badge | Tier | Trigger |
|---|---|---|
| First Rep | Iron | First `WorkoutLog` saved |
| Personal Record | Iron | First `PRRecord` created |
| 7-Day Streak | Iron | `VitalityState.streak` hits 7 |
| First Run | Iron | First `WaliRun` session saved |
| Squad Joined | Iron | First `SquadMember` row |
| 30-Day Streak | Bronze | `VitalityState.streak` hits 30 |
| Full Vitality | Bronze | `DailyScore.totalScore` ≥ 0.91 (first time) |
| Programme Complete | **Gold** | `CoachingProgramme.status` = `"completed"` — seeded V1, fires V2 |

**The reveal moment:** Bottom sheet modal — badge art, name, tier, date earned. Appears immediately in-app. No confetti. One sound. Stays until dismissed. `badge:awarded` WebSocket drives this. `awardBadge()` is always idempotent.

---

**The Challenge Library — 48 challenges (seeded V1, earnable V2):**

Four categories × 12 challenges (4 beginner + 4 medium + 4 advanced):

**Functional** — movement quality, real-world strength, carrying, hanging, single-leg work
**CrossFit-style (Metcon)** — conditioning + strength combined. Named benchmarks: Cindy, Fran, Helen, Murph, Grace, DT
**Warrior** — grit, endurance, mental toughness. Runs, rucks, streaks, cold protocols
**Strength (Static Lifting)** — pure barbell strength. 1RM attempts, bodyweight ratios, linear progression blocks

Points by difficulty:
- Beginner challenge: 50 pts
- Medium challenge: 150 pts
- Advanced challenge: 500 pts
- Full category mastery (all 12): 2,000 pts bonus
- All 48 complete: 10,000 pts bonus + Legendary badge

Full challenge library: see `waliFit_Challenge_Badge_Points_System.md`

---

**Pop-up challenges (V2):**

App assigns a timed challenge calibrated to the athlete's `trainingAdherence`. Opt-in only. Miss the window — gone forever. Points: Easy 25 / Medium 75 / Hard 200. Scarcity is what makes earning meaningful.

---

**Points + Athlete Identity (V2):**

Challenge points accumulate in `ChallengePoints` table. The distribution across categories determines athlete type — not what the user says, what they actually did:

| Distribution | Athlete Type |
|---|---|
| ≥60% Functional | Functional Athlete |
| ≥60% Metcon | Metcon Athlete |
| ≥60% Warrior | Warrior Athlete |
| ≥60% Strength | Strength Athlete |
| Balanced across all 4 | **Hybrid Athlete** — waliFit's highest identity |
| Functional + Warrior balanced | Tactical Athlete |
| Strength + Metcon balanced | Powerfit Athlete |

Athlete type feeds directly into `UserMemory.athleteType` — Wali coaches them accordingly.

**Status tiers (total all-time points):**

| Tier | Points |
|---|---|
| Recruit | 0 |
| Athlete | 1,000 |
| Competitor | 5,000 |
| Elite | 15,000 |
| Apex | 50,000 |

---

**The Leaderboard (V2):**

- Global rolling 90-day — rewards recent activity, older points decay out
- Weekly — resets Monday, levels the playing field for newer users
- By athlete type — Warriors vs Warriors, Strength vs Strength
- Squad — internal only, never surfaces in global feed

**The Seasonal Open (V2.5):**

Once per year. 5 challenges over 5 weeks. Same CrossFit Open format — released Monday, submitted by Sunday. Your rolling rank seeds your position. Performance in those 5 weeks determines placement. Category brackets ensure fair comparison.

---

**Why challenges and points wait for V2:**

1. No `trainingAdherence` data until V1.5 analytics jobs run — can't calibrate pop-up difficulty
2. No Coaching Programme — can't reference planned sessions in challenge conditions
3. Empty leaderboard is worse than no leaderboard — points need to land with existing data

See `waliFit_Challenge_Badge_Points_System.md` for full 48 challenge descriptions, points tables, badge triggers, schema, and version roadmap.
