# waliFit V1 — Sprint Plan & Backlog

| Sprints | V1 features | User stories | Total points |
|---------|-------------|--------------|--------------|
| 8       | 12          | 65           | 289          |

## How to use this workbook

| Section | What it's for |
|---------|---------------|
| Sprint Plan | High-level summary of all 8 sprints — goal, deliverables, duration, sprint goal statement. |
| Backlog | Every user story with sprint assignment, story points, priority, dependencies, acceptance criteria. This is the working sheet — filter by sprint, status, or feature. |
| Feature Map | All 12 V1 features mapped to which sprint(s) they land in, with effort and dependencies. |
| Roadmap | Week-by-week Gantt timeline showing what's in flight when. |
| Dependencies | Critical path and build order — read this before reordering anything. |
| Risks & Gates | Validation gate after Sprint 3 (Vitality Tree must work end-to-end), top risks, AI compliance gate before launch. |

## Conventions

| Convention | Definition |
|------------|------------|
| Story IDs | WF-### sequential. Numbering follows sprint order — easy to spot out-of-sequence work. |
| Story points | Fibonacci (1, 2, 3, 5, 8, 13). Solo target velocity ~20 SP/sprint with Claude assistance. Two-dev velocity ~40 SP/sprint. |
| Priority | P0 = must ship V1 · P1 = should ship · P2 = nice-to-have / cut candidate. V1 features are P0 by default. |
| Status | Not Started · In Progress · Blocked · In Review · Done. Drop-down enforced via data validation. |
| Dependencies | Story IDs that must be Done before this one starts. Empty = no blocker. |
| Validation gate | After Sprint 3 — Vitality Tree must work end-to-end across hydration + protein + activity pillars across training + rest days. Do not start Sprint 4 until this passes. |

**Source documents:** waliFit_Roadmap_Updated, waliFit_V1_Features_Updated, waliFit_Technical_Architecture (Build Sequence).

---

# Sprint Plan — V1 Build

Eight sprints, run sequentially. Validation gate after Sprint 3. Phases reference Technical Architecture build sequence.

## Sprint 1 — Foundation + Training Core (Pt 1)
- **Phases:** Phase 1 + 2a
- **SP:** 22.0
- **Risk Level:** Med — schema decisions cascade

**Sprint Goal:** Login works end-to-end; users can log a basic workout against a complete schema (run + squad fields included now).

**Key Deliverables:**
- Monorepo, Railway, PostgreSQL, Prisma · Supabase auth (portable JWT pattern) · Deep linking config
- Full Prisma schema including run fields on WorkoutLog and squadType on Squad (do this NOW)
- Onboarding flow with persistent step state + units preference card · displayWeight/storageWeight utils
- Exercise library seeded from wger (cached in MMKV) · Workout logging (sets/reps/weight/RPE)

## Sprint 2 — Training Core (Pt 2) + Calendar
- **Phases:** Phase 2b + 3
- **SP:** 24.0
- **Risk Level:** Low

**Sprint Goal:** Users can build custom workouts, see them on a real calendar, and the streak engine is timezone-aware.

**Key Deliverables:**
- Custom workout builder · Templates (save / duplicate / edit) · Plate math calculator with kg/lbs adapt
- Interval & conditioning support (timed work-rest, rounds, basic HIIT)
- Calendar daily/weekly/monthly views · Time-based linking · Training day vs rest day logic
- Streak engine: timezone-aware, 2am grace window, rest days blocked from penalty

## Sprint 3 — Nutrition + Vitality Tree 🚦
- **Phases:** Phase 4 + 5
- **SP:** 20.0
- **Risk Level:** HIGH — gate sprint

**Sprint Goal:** Vitality Tree works end-to-end. **Validation gate before any further work.**

**Key Deliverables:**
- SimpleNutritionLog: protein input + hydration glasses (one-tap home screen)
- DailyScore engine (hydration 30% + protein 30% + activity 40%) with rest-day neutrality
- Vitality Tree: 5 stages, daily recompute, wilt mechanic
- Streak freeze tokens (earned at 7/30/60/100), evening at-risk notification trigger
- 🚦 **GATE:** validate tree responds correctly across pillars + day types before Sprint 4

## Sprint 4 — Wali AI V1
- **Phases:** Phase 6
- **SP:** 24.0
- **Risk Level:** Med — async jobs + JSON validation

**Sprint Goal:** AI generates personalised plans, answers training questions, edits sessions in chat, and sends a cold-start message.

**Key Deliverables:**
- Provider abstraction (Claude Sonnet + Gemini Flash routing by complexity)
- System prompts: Program Architect, Daily Coach, Workout Adjustment, Cold-Start Coach
- RAG seed: wger 800+ exercises + 40–50 programming principles via pgvector
- BullMQ plan-generation job (async with Socket.io ready notification)
- AI plan editing in calendar · Cold-start fires 1.5s after onboardingComplete · Context builder

## Sprint 5 — WaliRun + Settings
- **Phases:** Phase 7 + 8
- **SP:** 22.0
- **Risk Level:** Med — App Store compliance is non-negotiable

**Sprint Goal:** First-class run sessions ship; the app is App Store-compliant on account, legal, and AI disclosure.

**Key Deliverables:**
- Foreground GPS via expo-location · Standard distances (1mi, 2mi, 3mi, 2K, 5K) + Free Run
- Live pace/distance/time, audio split cues, polyline route storage, post-run stats card
- Run PRs via existing PRRecord schema (exerciseName='5K Run', unit='seconds')
- Settings: profile, units, targets, notification toggles, rest timer default
- Account deletion (30-day soft delete via BullMQ) · Data export (JSON) · Privacy Policy + ToS + AI disclosure

## Sprint 6 — Offline + Notifications + Rest Timer
- **Phases:** Phase 10 + 12
- **SP:** 20.0
- **Risk Level:** Low–Med

**Sprint Goal:** App works at the gym with no WiFi. Push notifications arrive correctly. Rest timer never fails.

**Key Deliverables:**
- MMKV cache for exercise library, today's plan, calendar, tree state
- Offline write queue with queueOrSend() · Sync on reconnect · Sync status indicator
- Firebase FCM · Push permission requested AFTER first workout complete (never at launch / onboarding)
- Notification types: workout reminder, hydration, streak at-risk, squad activity, cold-start coach
- Rest timer: in-set countdown, expo-notifications background alert, haptics, fully offline

## Sprint 7 — The Arena
- **Phases:** Phase 11
- **SP:** 26.0
- **Risk Level:** Med — most feature-dense sprint

**Sprint Goal:** Users can form squads, see each other's PRs, run together, and compete on leaderboards.

**Key Deliverables:**
- Squad creation/join (30 max V1) · squadType='hybrid'|'run_club' · Deep link squad invites
- Training tab + Run tab leaderboards (best times per standard distance, weekly mileage)
- PR Feed: strength PRs, run PRs, streak milestones, tree milestones (all auto-generated)
- Friend system (None → Pending → Friends → Blocked) · Mutual-only DMs · Group messaging (text)
- V1 badge seed (7 badges: First Rep, PR, 7-day, First Run, Squad Joined, 30-day, Full Vitality)

## Sprint 8 — OTA + Polish + QA + Launch
- **Phases:** Phase 13 + 14
- **SP:** 20.0
- **Risk Level:** HIGH — submission cliff

**Sprint Goal:** Shippable build. AI compliance verified. TestFlight beta done. App Store reviewer notes ready.

**Key Deliverables:**
- EAS Update channels (production / preview) · OTA capability validated
- Animations, empty states, app icons, onboarding polish
- AI compliance test harness (50+ edge cases — medical, dangerous advice, mental health adjacent)
- End-to-end QA · TestFlight beta · App Store Review Notes (AI disclosure, account deletion proof)
- V1 GO / NO-GO checklist signed off

**TOTAL: 8 sprints, V1 ships — 178 SP**

---

# Backlog — V1 User Stories

Filter by Sprint, Feature, Priority, or Status. Story points use Fibonacci.

## Sprint 1

### WF-001 — Monorepo Foundation (P0, 5 SP)
**Feature:** Onboarding & Profile · **Epic:** Foundation · **Status:** Not Started

**User Story:** As a developer, I want a monorepo set up with Railway + PostgreSQL + Prisma so backend, mobile, and shared packages share code cleanly.

**Acceptance Criteria:** pnpm workspaces; @walifit/shared compiles; Railway deploys backend; Prisma migrates clean to Postgres.

**Notes:** Phase 1 foundation.

### WF-002 — Complete Prisma Schema (P0, 3 SP)
**Feature:** Onboarding & Profile · **Epic:** Foundation · **Dependencies:** WF-001 · **Status:** Not Started

**User Story:** As a developer, I want the COMPLETE Prisma schema in place day one — including 5 run fields on WorkoutLog and 2 fields on Squad — so no live migrations are needed later.

**Acceptance Criteria:** WorkoutLog has runDistanceM/runDurationS/runPaceSPerKm/runType/runDistancePreset/runRoutePolyline/runSplitPaces. Squad has squadType + runFocusDistance + maxMembers. UserMemory ships empty.

**Notes:** Tech Arch hard requirement: do this BEFORE writing any other code.

### WF-003 — Email Auth (P0, 5 SP)
**Feature:** Onboarding & Profile · **Epic:** Auth · **Dependencies:** WF-001 · **Status:** Not Started

**User Story:** As a user, I want to sign up and log in with email so I can access waliFit.

**Acceptance Criteria:** Supabase Auth via portable JWT pattern (no auth.uid() RLS calls — provider-agnostic). Login + Register screens. JWT verified server-side, request.user.id used downstream.

**Notes:** Portable so we can swap providers later.

### WF-004 — Onboarding Flow (P0, 5 SP)
**Feature:** Onboarding & Profile · **Epic:** Onboarding · **Dependencies:** WF-003 · **Status:** Not Started

**User Story:** As a user, I want to pick my goal, training days, and equipment in under 3 minutes so the app can personalise my experience.

**Acceptance Criteria:** Goal (strength/conditioning/fat loss/muscle gain/hybrid). Experience level. Training days multiselect. Session length. Equipment multiselect. Optional bodyweight, dietary pattern, injuries. <3 min completion.

### WF-005 — Persistent Onboarding State (P0, 3 SP)
**Feature:** Onboarding & Profile · **Epic:** Onboarding · **Dependencies:** WF-004 · **Status:** Not Started

**User Story:** As a user, I want my onboarding progress saved per step so I can close the app mid-flow and resume where I left off.

**Acceptance Criteria:** onboardingComplete + onboardingStep on User. Each step PATCHes server immediately. App reopen routes to incomplete step. Optional steps skippable.

**Notes:** Tech Arch §5.

### WF-006 — Units Preference Card (P0, 3 SP)
**Feature:** Onboarding & Profile · **Epic:** Units · **Dependencies:** WF-004 · **Status:** Not Started

**User Story:** As a user, I want to choose kg or lbs in onboarding (as a card selector, not a toggle) so the app immediately matches my mental model.

**Acceptance Criteria:** Two-card selector in step 1. Default detected from device locale. DB always stores kg/m. displayWeight() + storageWeight() utilities in @walifit/shared. Editable in Settings later.

**Notes:** Default US→lbs, else→kg.

### WF-007 — Multimodal Profile Import (P1, 5 SP)
**Feature:** Onboarding & Profile · **Epic:** Onboarding · **Dependencies:** WF-004 · **Status:** Not Started

**User Story:** As a user, I want to upload a screenshot from Hevy/Strong/MFP/Strava and have my profile pre-filled.

**Acceptance Criteria:** Gemini Vision parses PRs/bodyweight/frequency/goals/recent workouts. User reviews before confirm. Skip always visible. <60s end-to-end.

**Notes:** Stretch — could slip to Sprint 2 if time tight.

### WF-008 — Exercise Library (P0, 5 SP)
**Feature:** Hybrid Performance Engine · **Epic:** Exercise Library · **Dependencies:** WF-002 · **Status:** Not Started

**User Story:** As a user, I want a searchable exercise library so I can find any movement.

**Acceptance Criteria:** 800+ entries seeded from wger API. Search by name/category/muscle group. Movement type + targeted muscles. Cached in MMKV — works offline.

**Notes:** Pull from wger seed script.

### WF-009 — Workout Logging (P0, 8 SP)
**Feature:** Hybrid Performance Engine · **Epic:** Workout Logging · **Dependencies:** WF-002, WF-008 · **Status:** Not Started

**User Story:** As a user, I want to log a strength set with reps, weight, and RPE so my workout history is captured accurately.

**Acceptance Criteria:** Active workout screen. Logs: exercise, sets, reps, weight (in user's units, stored kg), per-set RPE 1–10. Notes per session. Mark completion. Timestamped to calendar date.

**Notes:** Core flow — feeds tree activity pillar.

### WF-010 — Daily Targets (P0, 2 SP)
**Feature:** Onboarding & Profile · **Epic:** Targets · **Dependencies:** WF-006 · **Status:** Not Started

**User Story:** As a user, I want a daily protein target and water target set during onboarding so the tree has goals to score against.

**Acceptance Criteria:** Protein g/day input. Water in glasses (default) or ml/fl oz per units. Wali AI suggests, user can override. Editable in Settings.

## Sprint 2

### WF-011 — Custom Workout Builder (P0, 5 SP)
**Feature:** Hybrid Performance Engine · **Epic:** Custom Workout Builder · **Dependencies:** WF-008 · **Status:** Not Started

**User Story:** As a user, I want to build custom workouts from scratch with sets, reps, rest, and intervals so I can structure my own training.

**Acceptance Criteria:** Builder screen. Add exercises from library or create ad hoc. Set reps/rest/intervals per exercise. Mix strength + conditioning. Save / duplicate / edit templates.

### WF-012 — Plate Math Calculator (P0, 3 SP)
**Feature:** Hybrid Performance Engine · **Epic:** Plate Math · **Dependencies:** WF-006 · **Status:** Not Started

**User Story:** As a user lifting in the gym, I want a plate calculator so I know what to load for any target weight.

**Acceptance Criteria:** Enter target weight → exact plate distribution. Visual bar-loading guide. Standard barbell. kg / lbs follows units pref.

**Notes:** calculatePlates() in @walifit/shared.

### WF-013 — Conditioning Logging (P0, 5 SP)
**Feature:** Hybrid Performance Engine · **Epic:** Conditioning · **Dependencies:** WF-009 · **Status:** Not Started

**User Story:** As a hybrid athlete, I want to log timed and rounds-based conditioning so my full training is captured (not just barbell work).

**Acceptance Criteria:** Timer-based work/rest format. Rounds-based logging. Basic HIIT. Sessions appear in workout history.

### WF-014 — Calendar Daily View (P0, 5 SP)
**Feature:** waliFit Calendar · **Epic:** Daily View · **Dependencies:** WF-008, WF-009 · **Status:** Not Started

**User Story:** As a user, I want a daily view showing today's workout, nutrition targets, and tree status so I have a single home for the day.

**Acceptance Criteria:** Today's scheduled workout/run. Training day vs rest day clearly labelled. Hydration progress + protein progress. Tree status + today's score.

### WF-015 — Calendar Weekly + Monthly (P0, 5 SP)
**Feature:** waliFit Calendar · **Epic:** Weekly + Monthly · **Dependencies:** WF-014 · **Status:** Not Started

**User Story:** As a user, I want weekly and monthly views to see my training rhythm and streak runs at a glance.

**Acceptance Criteria:** Weekly: training vs rest days, completed vs upcoming, streak continuity, nutrition consistency dots. Monthly: colour-coded states (completed/rest/missed/upcoming), streak runs, PR history browsable by date.

### WF-016 — Time Linking & Timezone Logic (P0, 5 SP)
**Feature:** waliFit Calendar · **Epic:** Time Linking · **Dependencies:** WF-014, WF-015 · **Status:** Not Started

**User Story:** As a developer, I want plans/logs/streaks anchored to real dates with timezone-aware logic so the calendar doesn't misfire across timezones or DST.

**Acceptance Criteria:** AI plans map to real dates on creation. Logs timestamped per session. Streak calculation in user's local timezone. Late-log grace until 2am local. Rest days don't penalise tree.

**Notes:** Tech Arch §3.

## Sprint 3

### WF-017 — Protein Logging (P0, 3 SP)
**Feature:** Simple Nutrition Logger · **Epic:** Protein · **Dependencies:** WF-010 · **Status:** Not Started

**User Story:** As a user, I want to log total daily protein in grams (incrementally) so the tree has a protein signal.

**Acceptance Criteria:** One-tap home screen access. Add 30g, then 40g later — additive. Progress bar vs daily target. Saved per date. Feeds DailyScore.protein (30%).

**Notes:** SimpleNutritionLog model.

### WF-018 — Hydration Logging (P0, 3 SP)
**Feature:** Simple Nutrition Logger · **Epic:** Hydration · **Dependencies:** WF-010 · **Status:** Not Started

**User Story:** As a user, I want to log water in glasses (default) or ml/fl oz per my units so hydration counts toward my daily score.

**Acceptance Criteria:** One-tap glass addition on home. Progress ring vs target. Per-date storage. Feeds DailyScore.hydration (30%).

### WF-019 — Daily Score Engine (P0, 5 SP)
**Feature:** Vitality Garden · **Epic:** Daily Score · **Dependencies:** WF-017, WF-018, WF-009 · **Status:** Not Started

**User Story:** As a developer, I want a DailyScore engine that combines hydration + protein + activity per the documented weights so the tree has a single number to grow against.

**Acceptance Criteria:** DailyScore = hydration*0.3 + protein*0.3 + activity*0.4. Activity = workout/run completion on training days; exactly 0.5 (neutral) on rest days. Recomputes after every relevant log.

**Notes:** Validate this math first — everything else depends on it.

### WF-020 — Tree States (P0, 5 SP)
**Feature:** Vitality Garden · **Epic:** Tree States · **Dependencies:** WF-019 · **Status:** Not Started

**User Story:** As a user, I want my tree to grow or wilt across 5 stages based on my consistency so I see my habits reflected visually.

**Acceptance Criteria:** States: Wilted → Recovering → Sprout → Growing → Full Vitality. Stage transitions tied to rolling daily score history. Always visible on home. Wilt mechanic on multi-day misses.

**Notes:** Visual on home screen.

### WF-021 — Streak + Freeze Tokens (P0, 5 SP)
**Feature:** Vitality Garden · **Epic:** Streak + Freeze · **Dependencies:** WF-020 · **Status:** Not Started

**User Story:** As a user, I want a streak with freeze tokens earned at milestones so a single bad day doesn't erase weeks of work.

**Acceptance Criteria:** Daily streak count tied to tree stage. Freeze tokens earned at 7/30/60/100. One token = skip a day without breaking streak. 2am grace window. Streak at-risk evening notification trigger.

### WF-022 — Training/Rest Day Logic (P0, 3 SP)
**Feature:** Vitality Garden · **Epic:** Training/Rest Logic · **Dependencies:** WF-019, WF-016 · **Status:** Not Started

**User Story:** As a user, I want rest days to never penalise my tree so planned recovery is rewarded, not punished.

**Acceptance Criteria:** User sets training schedule in onboarding (editable weekly via Calendar). Activity pillar inactive on rest days; hydration + protein still count. Optional rest-day mobility/walk logged as bonus.

### WF-023 — 🚦 Validation Gate (P0, 2 SP)
**Feature:** Vitality Garden · **Epic:** GATE · **Dependencies:** WF-019, WF-020, WF-021, WF-022 · **Status:** Not Started

**User Story:** As the team, we will not start Sprint 4 until the Vitality Tree validation gate passes end-to-end across every pillar and day type.

**Acceptance Criteria:** Manual + automated test pass: tree responds correctly to (1) all-pillars-hit training day, (2) miss-activity rest day, (3) miss-protein training day, (4) freeze token used, (5) timezone change at 1:55am local. All five scenarios green.

**Notes:** 🚦 GATE — do not skip.

## Sprint 4

### WF-024 — AI Provider Abstraction (P0, 5 SP)
**Feature:** Wali AI · **Epic:** Provider Abstraction · **Status:** Not Started

**User Story:** As a developer, I want a provider abstraction layer routing complex prompts to Claude Sonnet and high-volume tasks to Gemini Flash so we control cost and latency.

**Acceptance Criteria:** src/waliAI/ structure. Complexity classifier routes simple Q&A to Gemini Flash, complex coaching to Claude Sonnet. Single interface from app code (model is commodity, routing is IP).

**Notes:** Tech Arch §6.

### WF-025 — Context Builder (P0, 5 SP)
**Feature:** Wali AI · **Epic:** Context Builder · **Dependencies:** WF-024 · **Status:** Not Started

**User Story:** As a developer, I want a context builder that injects the user's full athlete profile into every AI call so responses are personalised.

**Acceptance Criteria:** Builds: ATHLETE PROFILE + ACTIVE PLAN + RECENT WORKOUTS (14d) + NUTRITION 7d AVERAGES + streak + tree stage. Used on every Wali AI invocation.

**Notes:** buildUserContext() per Tech Arch.

### WF-026 — RAG Knowledge Base (P0, 5 SP)
**Feature:** Wali AI · **Epic:** RAG Knowledge Base · **Dependencies:** WF-008, WF-024 · **Status:** Not Started

**User Story:** As a user, I want AI answers grounded in waliFit's vetted content so responses are trustworthy and not hallucinated.

**Acceptance Criteria:** Exercise library (800+ from wger) embedded via pgvector on existing Postgres. 40–50 manually-written programming principles (progressive overload, deload, conditioning zones, hybrid programming). Top-K retrieval injected into prompt context.

**Notes:** ~$5/month at 1k users.

### WF-027 — Program Architect (P0, 8 SP)
**Feature:** Wali AI · **Epic:** Program Architect · **Dependencies:** WF-024, WF-025, WF-026 · **Status:** Not Started

**User Story:** As a user, I want Wali AI to generate a 4–6 week training block from my goals + schedule + equipment.

**Acceptance Criteria:** Returns structured TrainingPlan JSON validated against schema. Beginner→advanced calibrated. Sessions map to real calendar dates on creation. Async via BullMQ + Socket.io 'plan:ready' notification.

**Notes:** Async — UI doesn't block.

### WF-028 — Daily Coach Chat (P0, 5 SP)
**Feature:** Wali AI · **Epic:** Daily Coach Chat · **Dependencies:** WF-024, WF-025, WF-026 · **Status:** Not Started

**User Story:** As a user, I want to ask Wali AI training/nutrition/recovery questions in chat with full context.

**Acceptance Criteria:** Chat screen. Full user context injected per call. Tone direct + concise. Hard rules: no diagnosis, no medication recs, escalate medical to professional. AI disclaimer banner always visible.

### WF-029 — Workout Adjustment (P0, 3 SP)
**Feature:** Wali AI · **Epic:** Workout Adjustment · **Dependencies:** WF-028 · **Status:** Not Started

**User Story:** As a user, I want to ask Wali AI to shorten/expand today's workout or substitute equipment in chat — no separate screen.

**Acceptance Criteria:** Lives inside Daily Coach Chat. Volume adjust on request. Movement substitution for missing equipment. Switch between gym ↔ home formats.

### WF-030 — Cold-Start Coach (P0, 3 SP)
**Feature:** Wali AI · **Epic:** Cold-Start · **Dependencies:** WF-028, WF-005 · **Status:** Not Started

**User Story:** As a new user, I want Wali AI to send the first message right after onboarding so the coaching relationship starts from a question I want to answer.

**Acceptance Criteria:** Fires automatically when onboardingComplete=true via BullMQ with 1.5s delay. Personalised to stated goal. Always exactly ONE follow-up question. Delivered as push notification AND in-app message.

### WF-031 — AI Plan Editing (P0, 5 SP)
**Feature:** Wali AI · **Epic:** AI Plan Editing · **Dependencies:** WF-027, WF-013 · **Status:** Not Started

**User Story:** As a user, I want to edit any exercise/set/rep in an AI-generated plan and ask Wali AI to revise sections.

**Acceptance Criteria:** Edit any exercise/set/rep inline on calendar/plan view. Chat command 'make this more conditioning-focused' triggers section regen. Combine manual + AI blocks.

## Sprint 5

### WF-032 — GPS Tracking (P0, 8 SP)
**Feature:** WaliRun · **Epic:** GPS Tracking · **Dependencies:** WF-002 · **Status:** Not Started

**User Story:** As a runner, I want live foreground GPS tracking with current pace, average pace, distance, and time so I have all the run feedback I need on screen.

**Acceptance Criteria:** expo-location + Haversine. Screen stays on (foreground only V1). Live: current pace, avg pace, elapsed distance, elapsed time. Audio cues at every km / mile split. Route stored as polyline.

**Notes:** Background GPS = V2.

### WF-033 — Distance Modes (P0, 3 SP)
**Feature:** WaliRun · **Epic:** Distance Modes · **Dependencies:** WF-031 · **Status:** Not Started

**User Story:** As a runner, I want standard distance modes (1mi, 2mi, 3mi, 2K, 5K) plus Free Run available regardless of my units preference.

**Acceptance Criteria:** All 5 standard distances always available + Free Run. Auto-stop at target distance. Both metric AND imperial pace shown regardless of units pref.

### WF-034 — Run Stats Report (P0, 5 SP)
**Feature:** WaliRun · **Epic:** Run Stats Report · **Dependencies:** WF-031, WF-032 · **Status:** Not Started

**User Story:** As a runner, I want a stats report immediately after every run so I see how I did before doing anything else.

**Acceptance Criteria:** Distance, total time, avg pace, fastest split, slowest split, splits chart, effort label (Easy/Moderate/Hard/Max), route map from polyline, PR delta line. One-tap share card. All client-side.

### WF-035 — Run PRs (P0, 3 SP)
**Feature:** WaliRun · **Epic:** Run PRs · **Dependencies:** WF-033 · **Status:** Not Started

**User Story:** As a runner, I want fastest times per standard distance auto-detected as PRs so I never have to track them manually.

**Acceptance Criteria:** PRRecord schema unchanged (exerciseName='5K Run', unit='seconds'). New PR triggers PR feed post + squad notification + tree milestone. All-time bests visible per distance.

### WF-036 — Solo Run Stats (P0, 3 SP)
**Feature:** WaliRun · **Epic:** Solo Stats · **Dependencies:** WF-033 · **Status:** Not Started

**User Story:** As a solo runner with no squad, I still want full weekly run stats and pace trends.

**Acceptance Criteria:** Weekly: total distance, total time, runs count, avg pace trend. Pace trend per distance month-over-month. No squad required.

### WF-037 — Settings Profile + Prefs (P0, 5 SP)
**Feature:** Settings Screen · **Epic:** Profile + Prefs · **Dependencies:** WF-006 · **Status:** Not Started

**User Story:** As a user, I want a Settings screen where I can change my name, photo, units, daily targets, training schedule, and default rest timer.

**Acceptance Criteria:** Profile fields editable. Units segmented control with instant UI update (no restart). Targets editable. Training schedule overrides onboarding. Default rest timer duration.

### WF-038 — Notification Preferences (P0, 2 SP)
**Feature:** Settings Screen · **Epic:** Notification Prefs · **Dependencies:** WF-038 · **Status:** Not Started

**User Story:** As a user, I want per-type notification toggles so I can mute hydration nudges without losing streak alerts.

**Acceptance Criteria:** Toggles per type: workout reminders, hydration, streak alerts, squad activity. Reminder time settings. Never all-or-nothing.

### WF-039 — Account Deletion (P0, 5 SP)
**Feature:** Settings Screen · **Epic:** Account Deletion · **Dependencies:** WF-003 · **Status:** Not Started

**User Story:** As a user, I must be able to delete my account from inside the app — App Store mandates this.

**Acceptance Criteria:** Deletion screen with confirmation + 30-day deletion date stated clearly. Soft-delete immediate. Hard-delete after 30 days via BullMQ job. Account hidden everywhere immediately.

**Notes:** App Store hard requirement.

### WF-040 — Data Export + Legal (P0, 3 SP)
**Feature:** Settings Screen · **Epic:** Data Export + Legal · **Dependencies:** WF-040 · **Status:** Not Started

**User Story:** As a user, I want to export my data as JSON and access Privacy Policy, ToS, AI disclaimer, and AI-training opt-out.

**Acceptance Criteria:** GDPR JSON export of all logs/nutrition/settings. Privacy Policy live URL. ToS live URL. AI disclaimer (Wali AI is not medical). Manage AI training opt-out toggle.

### WF-041 — AI Disclosure Screen (P0, 2 SP)
**Feature:** Settings Screen · **Epic:** AI Disclosure · **Dependencies:** WF-041 · **Status:** Not Started

**User Story:** As a user, I deserve a clear screen showing what runs on-device vs sent to Anthropic vs sent to Google vs sent to waliFit servers.

**Acceptance Criteria:** Disclosure screen lists: on-device (GPS, rest timer, tree, library, offline log), Anthropic (Wali AI messages, training context), Google (nutrition parsing, photos, simple Q&A), waliFit servers (logs, runs, squad activity, messages).

**Notes:** 2026 App Store compliance.

## Sprint 6

### WF-042 — Local Cache (P0, 5 SP)
**Feature:** Offline Mode · **Epic:** Local Cache · **Dependencies:** WF-008, WF-014 · **Status:** Not Started

**User Story:** As a user at the gym with no WiFi, I want every core workout flow to work offline.

**Acceptance Criteria:** MMKV cache for: exercise library, today's plan, calendar (current week + month), tree state, streak. Cached on first load + refreshed on open.

### WF-043 — Active Workout Offline (P0, 5 SP)
**Feature:** Offline Mode · **Epic:** Active Workout Offline · **Dependencies:** WF-044, WF-009 · **Status:** Not Started

**User Story:** As a user mid-workout, I want logging sets/reps/weights/notes + rest timer + tree display + protein/water input to all work offline.

**Acceptance Criteria:** Active workout screen fully local. Rest timer fully local. Tree + streak read from local state. Protein/water inputs queued for sync.

### WF-044 — Sync Queue (P0, 5 SP)
**Feature:** Offline Mode · **Epic:** Sync Queue · **Dependencies:** WF-045 · **Status:** Not Started

**User Story:** As a user reconnecting, I want all my offline activity to sync automatically with no data loss.

**Acceptance Criteria:** queueOrSend() offline queue. Auto-sync on reconnect. Streak + DailyScore recalculated server-side post-sync. No data loss if app closed before reconnect. Sync status indicator visible.

### WF-045 — Notification Permission Timing (P0, 3 SP)
**Feature:** Smart Notifications · **Epic:** Permission Timing · **Dependencies:** WF-046 · **Status:** Not Started

**User Story:** As a user, I should only be asked for push permission AFTER I complete my first workout — never at launch or onboarding.

**Acceptance Criteria:** Permission requested only when first WorkoutLog row is saved. Never at launch (kills denial rate). Never during onboarding. In-app banner fallback if denied.

**Notes:** Critical for iOS denial rate.

### WF-046 — Notification Types (P0, 5 SP)
**Feature:** Smart Notifications · **Epic:** Notification Types · **Dependencies:** WF-047 · **Status:** Not Started

**User Story:** As a user, I want timely notifications: workout reminder, hydration nudge, streak at-risk, squad activity, and Wali AI cold-start.

**Acceptance Criteria:** Workout reminder on training days at user time. Hydration mid-day (pauses if target hit). Streak at-risk evening. Squad activity (PRs, reactions, messages). Cold-start coach push.

**Notes:** Firebase FCM.

### WF-047 — Rest Timer (P0, 3 SP)
**Feature:** Rest Timer · **Epic:** In-Set Timer · **Dependencies:** WF-009 · **Status:** Not Started

**User Story:** As a user, I want a rest timer I can start with one tap after logging a set, with background alert when it ends.

**Acceptance Criteria:** One-tap start after set log. Configurable duration per exercise. Background alert via expo-notifications (fires even with screen locked). Haptic alert. Continues if user navigates away. Fully offline.

## Sprint 7

### WF-048 — Squad Create/Join (P0, 5 SP)
**Feature:** The Arena · **Epic:** Squad Create/Join · **Dependencies:** WF-001 · **Status:** Not Started

**User Story:** As a user, I want to create or join a squad with a join code, capped at 30 members for V1.

**Acceptance Criteria:** Squad creation form (name, optional avatar). Join via code OR deep link (opens directly to join screen). 30-member cap. squadType field defaults 'hybrid'.

**Notes:** Deep link config from Sprint 1.

### WF-049 — Run Clubs (P0, 3 SP)
**Feature:** The Arena · **Epic:** Run Clubs · **Dependencies:** WF-051 · **Status:** Not Started

**User Story:** As a runner, I want to join a Run Club using the same squad infrastructure with a focus distance and run leaderboard.

**Acceptance Criteria:** Squad with squadType='run_club' + optional runFocusDistance ('1mi'|'2mi'|'3mi'|'2K'|'5K'|'all'). Run challenges: admin posts distance + deadline, members submit times.

**Notes:** Reuses squad infra entirely.

### WF-050 — Leaderboards (P0, 5 SP)
**Feature:** The Arena · **Epic:** Leaderboards · **Dependencies:** WF-051, WF-052 · **Status:** Not Started

**User Story:** As a squad member, I want Training and Run leaderboard tabs in every squad — even cross-type — so anyone who lifts AND runs is visible across both.

**Acceptance Criteria:** Two tabs per squad: Training (workouts done, vitality score, streaks, weekly PRs) + Run (best times per distance via SELECT MIN(value) FROM PRRecord WHERE exerciseName IN run distances; weekly mileage). Visible in BOTH squad types.

### WF-051 — PR Feed (P0, 5 SP)
**Feature:** The Arena · **Epic:** PR Feed · **Dependencies:** WF-053 · **Status:** Not Started

**User Story:** As a squad member, I want an auto-generated feed of strength PRs, run PRs, streak milestones, and tree milestones — never manual posts.

**Acceptance Criteria:** Strength PR posts. Run PR posts ('5K: 24:31 — 45s faster'). Streak milestone posts. Tree-reached-Full-Vitality posts. Reactions: Cheer + Nudge. All auto-generated from real events.

### WF-052 — Friend System (P0, 5 SP)
**Feature:** The Arena · **Epic:** Friend System · **Dependencies:** WF-051 · **Status:** Not Started

**User Story:** As a user, I want a friend system with states None → Pending → Friends → Blocked, where DMs unlock only after mutual acceptance.

**Acceptance Criteria:** Friendship states + transitions. DMs unlock on mutual friendship only. Username search + invite link. Block hides everywhere bidirectionally.

### WF-053 — Messaging (P0, 5 SP)
**Feature:** The Arena · **Epic:** Messaging · **Dependencies:** WF-055 · **Status:** Not Started

**User Story:** As a squad member, I want group messaging in every squad/run club + 1:1 DMs with friends — text-only in V1.

**Acceptance Criteria:** Group chat per squad. 1:1 DMs only between mutual friends. Text-only V1 (no images/files). Squad activity notifications fire to members.

### WF-054 — V1 Badges (P0, 3 SP)
**Feature:** The Arena · **Epic:** V1 Badges · **Dependencies:** WF-053, WF-019 · **Status:** Not Started

**User Story:** As a user, I want to earn the 7 V1 badges for hitting passive milestones (no challenges in V1).

**Acceptance Criteria:** First Rep · Personal Record · 7-Day Streak · First Run · Squad Joined · 30-Day Streak · Full Vitality. Earned via passive event triggers only (no challenge cards V1 — those need V2 Coaching Programme).

**Notes:** Programme Complete badge seeded but fires V2.

## Sprint 8

### WF-055 — OTA Setup (P0, 3 SP)
**Feature:** Polish · **Epic:** OTA Setup · **Status:** Not Started

**User Story:** As an operator, I want EAS Update channels configured so we can push JS-only fixes without an App Store submission.

**Acceptance Criteria:** eas.json configured with production + preview channels. eas update push tested end-to-end. Native deps frozen pre-launch (any native add = full submission).

**Notes:** Tech Arch deployment section.

### WF-056 — Visual Polish (P1, 5 SP)
**Feature:** Polish · **Epic:** Visual Polish · **Status:** Not Started

**User Story:** As a user, I want polished animations, empty states, app icons, and onboarding visuals.

**Acceptance Criteria:** Tree growth/wilt animations. Empty states across all screens. App icon variants (iOS + Android). Onboarding visual polish. Loading skeletons.

### WF-057 — AI Compliance Test Harness (P0, 5 SP)
**Feature:** QA · **Epic:** AI Compliance Test Harness · **Dependencies:** WF-024 · **Status:** Not Started

**User Story:** As an operator, I MUST verify Wali AI never gives medical diagnosis, dangerous advice, or harmful mental-health responses before submission.

**Acceptance Criteria:** 50+ edge cases run via testAICompliance.ts: medical diagnosis attempts, dangerous weight loss, training-through-pain, mental-health-adjacent. All cases pass mustContain/mustNotContain checks. CI-blocking.

**Notes:** Tech Arch §AI Compliance — non-negotiable.

### WF-058 — End-to-End Test (P0, 8 SP)
**Feature:** QA · **Epic:** End-to-End Test · **Status:** Not Started

**User Story:** As QA, I want a full E2E test pass covering the critical user flows on real devices.

**Acceptance Criteria:** Onboarding → first workout → cold start → calendar → tree growth across 7 days → streak → run → PR → squad join → notification permission → account deletion → offline gym scenario. Pass on iOS + Android.

### WF-059 — TestFlight Beta (P0, 5 SP)
**Feature:** QA · **Epic:** TestFlight Beta · **Dependencies:** WF-066 · **Status:** Not Started

**User Story:** As a beta tester, I want to use waliFit on TestFlight for at least 1 week before public launch.

**Acceptance Criteria:** TestFlight build live. 10–25 beta testers. Crashalytics + bug-report channel. Top P0 + P1 bugs fixed before submission.

### WF-060 — App Store Review Notes (P0, 2 SP)
**Feature:** Submission · **Epic:** App Store Review Notes · **Dependencies:** WF-040, WF-041, WF-067 · **Status:** Not Started

**User Story:** As an operator, I want App Store reviewer notes prepped covering AI disclosure, account deletion proof, and demo credentials.

**Acceptance Criteria:** Reviewer notes doc: AI disclosure summary, account deletion walkthrough screenshots, demo account credentials, list of third-party AI providers (Anthropic, Google), data export demo.

### WF-061 — GO/NO-GO Checklist (P0, 2 SP)
**Feature:** Launch · **Epic:** GO/NO-GO · **Dependencies:** WF-064, WF-065, WF-066, WF-067, WF-068 · **Status:** Not Started

**User Story:** As the team, I want a final GO/NO-GO checklist signed off before submitting to App Store.

**Acceptance Criteria:** Checklist: tree validates, AI compliance suite green, account deletion works, legal URLs live, AI disclosure complete, OTA tested, crash-free rate >99% on TestFlight, all P0 bugs closed.

**Notes:** 🚦 Final gate.

## Sprint Story Point Totals

| Sprint | S1 | S2 | S3 | S4 | S5 | S6 | S7 | S8 | TOTAL |
|--------|----|----|----|----|----|----|----|----|-------|
| Story Points | 44 | 28 | 26 | 39 | 39 | 26 | 31 | 30 | 263 |

---

# Feature Map — V1 Feature → Sprint

All 12 V1 features. Stories pulled live from Backlog. Validates nothing was missed.

| # | V1 Feature | Section | Primary Sprint(s) | Phase | Effort (doc) | Stories | SP |
|---|------------|---------|-------------------|-------|--------------|---------|-----|
| 1 | Wali AI | AI & Coaching | Sprint 4 | Phase 6 | 1–2 weeks | 8 | 39 |
| 2 | Hybrid Performance Engine | Training Core | Sprint 1–2 | Phase 2 | 2 weeks | 5 | 26 |
| 3 | Vitality Garden | Gamification | Sprint 3 🚦 | Phase 5 | 1 week | 5 | 20 |
| 4 | waliFit Calendar | Training Core | Sprint 2 | Phase 3 | 1 week | 3 | 15 |
| 5 | Onboarding & User Profile | AI & Coaching | Sprint 1 | Phase 1 | 1 week | 0 | 0 |
| 6 | Simple Nutrition Logger | Nutrition Foundation | Sprint 3 | Phase 4 | 3 days | 2 | 6 |
| 7 | Settings Screen | Legal Compliance | Sprint 5 | Phase 8 | 1 week | 5 | 17 |
| 8 | The Arena | Social | Sprint 7 | Phase 11 | 2 weeks | 7 | 31 |
| 9 | Rest Timer | UX & Utility | Sprint 6 | Phase 12 | 3 days | 1 | 3 |
| 10 | Smart Notifications | UX & Utility | Sprint 6 | Phase 10 | 1 week | 2 | 8 |
| 11 | Offline Mode | UX & Utility | Sprint 6 | Phase 10 | 1 week | 3 | 15 |
| 12 | WaliRun (incl. Run Clubs) | Training Core | Sprint 5 (+7 for Run Clubs) | Phase 7 + 11 | 5–7 days + 1 day | 0 | 0 |
| | **TOTAL** | | | | | **41** | **180** |

---

# Roadmap — Build Flow

Workstreams in the order they kick off. Each workstream starts in the sprint marked with ▶ and continues until its scope is delivered. The 🚦 validation gate sits between Sprint 3 and Sprint 4.

| Workstream / Feature | Starts In |
|----------------------|-----------|
| Foundation (auth, schema, monorepo) | Sprint 1 ▶ |
| Onboarding & Profile | Sprint 1 ▶ |
| Hybrid Performance Engine | Sprint 1 ▶ |
| waliFit Calendar | Sprint 2 ▶ |
| Simple Nutrition Logger | Sprint 3 ▶ |
| Vitality Garden (Tree, score, streak) 🚦 | Sprint 3 ▶ |
| **VALIDATION GATE** | After Sprint 3 🚦 |
| Wali AI V1 (Architect, Chat, RAG, Cold-Start) | Sprint 4 ▶ |
| WaliRun (GPS, distances, stats, PRs) | Sprint 5 ▶ |
| Settings + Legal + Account Deletion | Sprint 5 ▶ |
| Offline Mode + Sync | Sprint 6 ▶ |
| Smart Notifications | Sprint 6 ▶ |
| Rest Timer | Sprint 6 ▶ |
| The Arena (squads, leaderboards, PR feed, friends) | Sprint 7 ▶ |
| V1 Badges + Run Clubs | Sprint 7 ▶ |
| OTA + Polish + Animations | Sprint 8 ▶ |
| AI Compliance Suite + E2E QA | Sprint 8 ▶ |
| TestFlight Beta | Sprint 8 ▶ |
| App Store Submission | Sprint 8 ▶ (final) |

## Build Flow at a Glance

```
Sprint 1  →  Foundation · Onboarding · Hybrid Performance Engine
              ↓
Sprint 2  →  Calendar · Custom Workout Builder · Conditioning
              ↓
Sprint 3  →  Nutrition Logger · Vitality Garden 🚦
              ↓
              🚦 VALIDATION GATE — Tree must pass before Sprint 4
              ↓
Sprint 4  →  Wali AI V1 (Provider, Context, RAG, Architect, Chat, Cold-Start)
              ↓
Sprint 5  →  WaliRun · Settings · Account Deletion · Legal · AI Disclosure
              ↓
Sprint 6  →  Offline Mode · Smart Notifications · Rest Timer
              ↓
Sprint 7  →  The Arena (Squads, Leaderboards, PR Feed, Friends, Badges, Run Clubs)
              ↓
Sprint 8  →  OTA · Polish · AI Compliance Suite · E2E QA · TestFlight · Submission
```

---

# Dependencies — Critical Path & Build Order

Read this before reordering work. Skipping the build order causes live migrations and rework.

## 1. Schema First — Before ANYTHING ELSE
**What:** Complete Prisma schema with run fields on WorkoutLog (7 fields) and squadType + runFocusDistance + maxMembers on Squad.

**Why:** Adding tables/columns after users have data requires a live migration. 30 min now saves hours later. UserMemory table also ships empty in V1.

**Risk if skipped:** Live migration in production. Hours of pain. Possible data loss.

## 2. Vitality Tree Before Wali AI
**What:** Vitality Tree fully validated end-to-end across all 5 gate scenarios.

**Why:** Tree validation is the hard contract — it's the product's identity differentiator. AI work depends on context that includes streak + tree stage. Fix the tree first.

**Risk if skipped:** AI ships with a broken context signal. Confusing UX. Loop doesn't close.

## 3. Wali AI + WaliRun + Tree Before The Arena (Sprint 7)
**What:** Wali AI + WaliRun + Vitality Tree all working.

**Why:** PR Feed posts are auto-generated from real PR events (strength + run + tree). Run Clubs need run PRs. No social value if there's no source data.

**Risk if skipped:** Empty feeds. Squad joins with nothing to compete on. Bad first impression.

## 4. Run Schema Fields Before WaliRun Feature Work
**What:** Run schema fields on WorkoutLog (already covered in #1).

**Why:** Tech Arch directive: add fields BEFORE writing other code. Not optional.

**Risk if skipped:** Schema rework + migration.

## 5. First Workout Completion Before Push Permission Ask
**What:** First workout completion event before requesting push permission.

**Why:** iOS denial rate is much higher when permission is requested at launch or onboarding. Ask AFTER first completed workout.

**Risk if skipped:** Massive permission denial. Loss of primary re-engagement channel.

## 6. Compliance Stack Before App Store Submission
**What:** Account deletion + AI compliance suite + AI disclosure + Privacy Policy + ToS all live.

**Why:** Apple WILL reject without in-app account deletion. AI category requires safety guardrails. 2026 AI disclosure compliance.

**Risk if skipped:** Submission rejected. 2-week minimum delay per resubmission cycle.

## 7. TestFlight Beta Before Public Push
**What:** TestFlight beta with at least 1 week of soak time.

**Why:** Surfaces real-device crashes the simulator misses. Surfaces gym-WiFi edge cases. Surfaces battery drain on GPS runs.

**Risk if skipped:** Public 1-star reviews. Day-1 churn.

## 8. AI Compliance Test Suite Before Wali AI Ships
**What:** AI compliance test suite running and green.

**Why:** Hard requirement for AI category review. 50+ edge cases must pass before submission. Run via npx ts-node src/scripts/testAICompliance.ts in CI.

**Risk if skipped:** Submission rejected. Possible content moderation flag on developer account.

---

# Risks & Gates

Two hard gates: Sprint 3 (Vitality Tree) and Sprint 8 (AI compliance + GO/NO-GO).

| Risk / Gate | Sprint | Likelihood | Impact | Mitigation | Owner |
|-------------|--------|------------|--------|------------|-------|
| 🚦 **GATE:** Vitality Tree must validate end-to-end across pillars × day types × edge cases (timezone, freeze token). | S3 | Certain | Critical | Block all Sprint 4 work until 5 documented test scenarios pass. Manual + automated. Tree is the product's primary differentiator — getting it wrong invalidates retention. | Tech lead |
| 🚦 **GATE:** AI compliance test suite must pass before App Store submission. | S8 | Certain | Critical | 50+ edge cases via testAICompliance.ts in CI. Block submission on any failure. Categories: medical diagnosis, dangerous advice, mental-health-adjacent, supplements/medication. Hard rules in system prompt enforced. | Tech lead |
| Schema additions retrofitted after launch require live migrations. | S1 | High if skipped | High | Add ALL run fields, squadType, maxMembers, UserMemory table on Day 1 — even though they're empty until later sprints. 30 minutes now vs hours of pain later. | Tech lead |
| AI cost overrun (Claude Sonnet expensive per call). | S4 | Medium | Medium | Provider abstraction routes simple Q&A to Gemini Flash. Complexity classifier first. Budget alert at $X/week. RAG keeps responses grounded so we don't pay for hallucination cleanup. | Tech lead |
| Push permission denial rate (iOS) cripples re-engagement. | S6 | High | High | Request permission AFTER first workout complete — never at launch or onboarding. In-app banner fallback for users who deny. Track grant rate in analytics. | Product |
| App Store rejection on first submission (AI category, account deletion, AI disclosure). | S8 | Medium | High | Account deletion in-app (working before submission). AI disclosure screen complete. Reviewer notes: AI provider list, demo creds, deletion walkthrough, AI safety summary. Allow 2 weeks buffer. | Product |
| Solo developer burnout / under-velocity. | All | Medium | High | Realistic 20 SP/sprint target. Cut multimodal profile import (P1) if Sprint 1 slips. Cut visual polish (P1) if Sprint 8 slips. Never cut compliance or core loop work. | Self / team |
| Vitality Tree feels gimmicky to power users. | Post-launch | Low | Medium | V1 ships free → optimize for retention signal not power-user love. V2 Tree Biomes (Oak/Willow/Bamboo) lets users self-select. Watch D7/D30 retention by feature usage segment. | Product |
| Background GPS limits foreground-only run UX (screen-on drains battery). | S5 | Medium | Medium | Document this in run UX. Show prominent battery warning before long runs. V2 ships background GPS — set expectations. | Product |
| Squad invite deep links break in iOS Universal Links / Android App Links setup. | S7 | Medium | Medium | Configure deep linking in Sprint 1 (Phase 1) — not Sprint 7. Test on both platforms before squad work begins. | Tech lead |
| Streak timezone bug — user travels, streak breaks unfairly. | S3 | Medium | High | Streak engine is timezone-aware from Day 1 (per Tech Arch). 2am grace window. Test across DST + timezone change scenarios in validation gate. | Tech lead |
