# waliFit — Product Roadmap V1 → V3
> Hybrid Athlete Operating System
> Version 2.0 · April 2026 · Internal Reference

---

## Product Identity

waliFit is a Hybrid Athlete OS combining AI coaching, workout building, nutrition intelligence, gamified consistency, and competitive social. The moat is integration — all features unified under one identity anchored by the Vitality Tree, which no major competitor owns.

| Dimension | Definition |
|---|---|
| Primary target | Hybrid athletes — strength + conditioning, Hyrox-style events, combined performance |
| Secondary target | Serious gym-goers wanting accountability and structure |
| Positioning | Whoop's data density + Strava's social energy + Hevy's workout functionality, unified by Vitality Tree gamification |
| AI identity | Wali AI — Claude Sonnet (complex reasoning) + Gemini Flash (volume). Lives in `src/waliAI/` |
| Core loop | Train → Log → Progress → Compete → Repeat |

**Design tokens:**
```
primary:          #0BBFBD  (teal)
primaryFg:        #002f2f  (ALWAYS dark on teal — never white)
primaryLight:     #3FD9D7
primaryDark:      #0D6D6B
background:       #0a0f0f
backgroundAlt:    #050A0A
card:             #161b1b
popover:          #1a1f1f
border:           #2f3636
energy:           #f59e0b  (effort, protein, warnings)
hydration:        #60a5fa  (water, running)
growth:           #84cc16
accent.blue:      #3b82f6
accent.purple:    #8b5cf6
destructive:      #ef4444
foreground:       #ececec
mutedForeground:  #9ca3af
```

---

## Release Strategy

waliFit launches **100% free**. Monetization only at V2.5 — never by gating existing functionality.

- **Growth Phase (V1–V2):** Free. Focus on acquisition, retention, product-market fit.
- **Monetization Phase (V2+):** Premium tier for new V2.5 features only. Everything from V1 + V2 stays free permanently.

---

## V1 — Launch

**Goal:** Ship complete core experience in one launch. Training + AI + Vitality Tree + WaliRun + full social layer all together. Social accountability from day one — a streak your squad can see is far more powerful than one only you know about.

### Feature 1 — Wali AI
Central AI coaching. Claude Sonnet for complex, Gemini Flash for volume. Cold-start message fires 1.5s after onboarding completes. Program Architect generates JSON plans → mapped to calendar PlannedSession rows.

### Feature 2 — Hybrid Performance Engine
Workout and training core. Log sets/reps/weight/RPE. Custom builder. AI plan editing. 800+ exercise library (offline). Plate calculator. Interval/conditioning support.

Run schema fields on WorkoutLog (add before anything else):
`runDistanceM · runDurationS · runPaceSPerKm · runType · runDistancePreset · runRoutePolyline · runSplitPaces`

### Feature 3 — Vitality Garden
Living digital tree on home screen. Daily health score: steps 40% + protein 30% + hydration 30%. 6 stages: Wilted → Recovering → Sprout → Growing → Thriving → Full Vitality. Rest days: activity = 0.5 neutral. Streak freeze tokens at 7/30/60/100/180/365 day milestones.

### Feature 4 — waliFit Calendar
Daily/weekly/monthly views. AI plans map to real dates. Streak is timezone-aware. Late logging window: 2am local. Rest days blocked from tree penalty.

### Feature 5 — Onboarding & Profile
Under 3 minutes. Each step saves immediately to server. Units: kg or lbs (DB always stores kg). Multimodal import: Gemini Vision reads Hevy/Strava/MFP/Strong screenshots.

### Feature 6 — Simple Nutrition Logger
V1 is intentionally minimal. Daily protein grams + daily water. One-tap from home screen. Feeds Vitality Tree pillars. Replaced by Smart Fuel in V2 — both models can coexist.

### Feature 7 — Settings Screen
Apple-required features: in-app account deletion (type "DELETE", soft-delete → hard-delete 30 days), GDPR data export, AI processing disclosure. Per-type notification toggles.

### Feature 8 — The Arena
Workout Squads + Run Clubs on same infrastructure. Two-tab leaderboard (Training + Run) in every squad. Auto-generated PR feed (Cheer + Nudge reactions). Friend system with mutual DMs. Deep link invites. Max 30 members V1.

### Feature 9 — Rest Timer
In-set countdown, background expo-notifications (fires locked screen), haptics, fully offline.

### Feature 10 — Smart Notifications
Request permission AFTER first workout — never at launch. Types: workout reminders, hydration nudges, streak at-risk, squad activity, cold-start coach message.

### Feature 11 — Offline Mode
Workout logging + rest timer + exercise library + GPS + vitality display + calendar + nutrition all work offline. MMKV queue syncs on reconnect. App kill must never lose a set.

### Feature 12 — WaliRun
Foreground GPS. Standard distances (1mi, 2mi, 3mi, 2K, 5K + Free Run). Auto-stop at target. Run stats report immediately post-run. Run PRs via PRRecord (`unit: 'seconds'`). Run Clubs via `squadType: 'run_club'`.

**V1 Build Order:**
1. Auth + Onboarding
2. Workout Logging (include all run schema fields now)
3. Calendar
4. Nutrition Logger
5. **Vitality Tree — VALIDATE END-TO-END BEFORE CONTINUING**
6. Wali AI
7. WaliRun
8. Settings + Legal
9. Offline + Notifications
10. Arena (build last — reads everything)
11. Rest Timer + Polish

Total solo: ~15–17 weeks. With two devs: ~7–9 weeks.

---

## V1.5 — Athlete Journal + Wali AI Memory

Post-launch. 3–4 days engineering. No new screens. No new tables. Schema ships empty in V1.

**Why Journal and Memory together:** Journal captures the raw signal. Memory extracts the coaching insight and permanently injects it into future Wali AI conversations. The longer a user trains with waliFit, the better Wali AI coaches them.

**Athlete Journal (Feature 13)**
- Session Notes: RPE chips (1–10) + free text on WorkoutCompleteScreen
- Live Notes FAB: pencil icon in ActiveWorkoutScreen → Zustand → carries forward pre-filled
- Journal tab in CoachScreen: reverse-chronological, RPE colour-coded, Wali AI reads as context
- Calendar day detail: collapsed notes section (no new API call)
- Build order: 13.1 → 13.3 → 13.2 → 13.4

**Wali AI Memory System**
- `UserMemory` table ships empty in V1 Prisma schema
- BullMQ `memoryUpdate` job ships in V1.5 — uses Claude Haiku (~$0.0003/update)
- After every conversation: extracts key insights, communication style, struggles, breakthroughs
- Context builder injects growing coaching profile above workout data on every call
- Three triggers: conversation end (60s delay) · PR detected · pain/injury keyword (immediate)
- Compound effect: conversation 1 = generic personalisation. After 10 = knows preferences. After 50 = a coach who has watched you for months.
- Cost: ~$0.90/week at 1,000 active users

---

## V2 — Intelligence Depth & Retention

**Goal:** Add nutrition intelligence, a persistent Coaching Programme, Check-In Snapshots, and a Badge & Challenge system. Three connected features form the core retention loop: Wali AI builds a programme → Calendar fills → user trains → weekly check-ins track progress → analytics show target vs actual → badges reward milestones → squad sees badges on profile → social proof pulls others in. Build on what already exists — no new infrastructure.

### Feature 13 — Coaching Programme
Stateful drafting session in Coach. Wali AI generates a named multi-month programme through iterative conversation. Draft backed by `ProgrammeDraft` table (not context window — 150+ sessions cannot live in a context window reliably). Each refinement overwrites `draftData`.

Confirmation requires a UI button tap — not just typed words. Prevents false positives. Wali AI surfaces a summary card: "Ready to create this? Here's what I'll build." On confirm: BullMQ writes `PlannedSession` rows → Calendar populates → WebSocket emits `programme:ready`. Previous active programme auto-archives.

`plannedData` on every `PlannedSession` is **IMMUTABLE** — never update it. User edits write to `modifiedFields` only. Wali AI reads modification patterns as coaching signals: consistently reducing Monday volume = fatigue. Always swapping an exercise = stop programming it.

Delete (draft): row deleted, no Calendar impact. Delete (active): future sessions cascade-deleted, programme status → "deleted" (soft delete, never hard delete). Completed workouts and check-ins are user data — never deleted. Status: `"active" | "archived" | "deleted" | "completed"`. `completed` triggers Gold Programme Complete badge.

Programme also sets: protein target (g/day), water target (ml/day), weight goal (kg), check-in cadence. Analytics surface target vs actual over the full programme duration.

### Feature 14 — Check-In Snapshots
Weekly (configurable) Wali AI prompt in Coach. Captures: body weight (kg), optional measurements (waist, chest, hip, arm, thigh), optional progress photo, energy level 1–10, free-text note.

Never called BMI in the UI — weight + measurements only. Less contested, more actionable, legally safer for a non-clinical app.

Feeds analytics: weight trend, measurement trend, energy over time, planned vs actual vs goal. Wali AI reads declining energy over 4 consecutive check-ins as an overtraining signal — flags it before the user does.

### Feature 15 — Badges & Challenge System
Pokémon-inspired collection mechanic — serious, not gamified. Every badge earned by athletic achievement. No XP bars, no daily login rewards, no badge for opening the app. Badges reveal themselves when earned — not a checklist to work through.

**Four tiers:**
- **Iron** — Entry. Always earnable. First workout, first PR, 7-day streak, first run, squad joined.
- **Bronze** — Consistency. 30-day streak, 50 workouts, first month of programme complete, first Full Vitality day.
- **Silver** — Performance. 5K under 25 min, 3 months of programme complete, squad challenge winner.
- **Gold** — Elite. Most users never get these. Programme Complete (all 6 months), 365-day streak, 5K under 20 min, seasonal champion. Dark background, minimal design, date earned. Understated but unmistakable.

**Programme Complete is the Gold badge that caps a 6-month commitment.** It is the highest-prestige badge in the app and the strongest long-term retention mechanic. Users who know it exists at 6 months will come back.

**Scope rules:**
- PR Feed (global): personal PRs, personal milestones, tree advancement, programme completed. Squad badges NEVER appear here.
- Squad screen: challenge outcomes, who won. Internal to that squad only.
- Profile: 3 pinned badges at top (user chooses). Full collection by tier. Squad badges collapsed (count + breakdown per squad). Accumulate across all squads ever joined — leaving never removes a badge.

**Challenge system:** 48 challenges across 4 categories (Functional, CrossFit-style, Warrior, Strength) × 3 tiers (Beginner, Medium, Advanced). Pop-up challenges assigned by app — timed window, opt-in, miss it and it's gone. Library challenges permanent — user chases them when ready.

**`awardedAt` from `workout.completedAt` NOT submission time — offline sync edge case must be tested explicitly before launch.**

**The Vitality Tree has NO connection to points or leaderboard.** Personal coaching tool only. Completely separate system.

**Challenge library is NOT earnable in V1.** Seeded and browsable (`isActive = false`). No points engine. No leaderboard. Challenge completion tracking activates in V2.

**V1 ships 7 passive badge triggers only, seeded in `prisma/seed.ts`:**

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

**Points system (V2):** Library challenge Beginner 50 pts / Medium 150 pts / Advanced 500 pts. Pop-up Easy 25 / Medium 75 / Hard 200. Category mastery bonus 2,000 pts. All 48 complete: 10,000 pts + Legendary badge.

**Athlete identity (V2):** Point distribution across categories determines athlete type — Functional / Metcon / Warrior / Strength / Hybrid / Tactical / Powerfit. Cannot be chosen. Earned. Feeds `UserMemory.athleteType` — Wali coaches accordingly.

**Status tiers (V2):** Recruit → Athlete (1K pts) → Competitor (5K) → Elite (15K) → Apex (50K). Permanent.

**Leaderboard (V2):** Global rolling 90-day / Weekly (resets Monday) / By athlete type / Squad (internal only, never global).

**Seasonal Open (V2.5):** Once per year. 5 challenges over 5 weeks. CrossFit Open format. Category brackets by athlete type.

**Versioned scope:**
- V1: 7 passive badge triggers. Challenge library browsable only. No points. No leaderboard.
- V2: Points live. Library earnable. Pop-up challenges. Leaderboard. Athlete type. Status tiers. Challenge badges (Iron → Bronze → Silver → Gold → Legendary).
- V2.5: Seasonal Open. By-type leaderboard. Gear/discount partnerships.
- V3: Wali AI-generated personalised challenges. Prize pool infrastructure.

See `waliFit_Challenge_Badge_Points_System.md` for full 48 challenge library and complete schema.

### Feature 16 — Smart Fuel
Full nutrition intelligence. Text parsing, barcode scanner (Open Food Facts + Nutritionix fallback), food performance rating (Green/Yellow/Red), ingredient analysis. Ships V2 to avoid a half-built nutrition experience at launch.

### Feature 17 — Tree Biomes
Unlock tree type based on training style: Oak (strength), Willow (conditioning), Bamboo (hybrid). Visual differentiation. Earnable, not purchasable.

### Feature 18 — Squad Forests
All squad member trees rendered in a shared visual space. Wilting trees visible to everyone — social accountability layer made visual.

### Feature 19 — Female Training Considerations
Menstrual cycle phase input → phase-aware training and recovery recommendations from Wali AI. Optional — never mandatory.

### Feature 20 — Progress & Analytics
Strength trend charts, PR vault, body metrics (weight, measurements, progress photos), performance dashboard. GPS pace trend charts per distance. Programme analytics: planned vs actual per session, modification patterns, adherence trend over 6 months.

### Feature 21 — waliFit Commons
Global advice feed with Wali AI responses. Community knowledge base. Expanded feed interactions (comments, threaded replies).

### Feature 22 — Home Screen Widget + Referral System
iOS/Android widget showing streak, tree stage, today's workout. Referral programme.

---

## V2.5 — Competition

**Goal:** Platform-wide competition, monetization, and wearable integration.

### Feature 20 — Global Arena
Platform-wide ranked leaderboards by location and social group. Co-brandable with Hyrox/event partners.

### Feature 21 — Adaptive AI (Program Evolution Engine)
Wali AI analyses full workout history to auto-adjust plan difficulty, detect deload needs, and evolve programming without user input.

### Feature 22 — Station-to-Run Timer
Tracks compromised run pace immediately post-strength station. Designed for Hyrox-style events. Co-brandable.

### Feature 23 — Vision Meal Scanner
Photo → macro estimation via Gemini Vision. Feeds Smart Fuel directly.

### Feature 24 — Wearable Integration
Apple Watch, Garmin, HRV coaching. Recovery and deload suggestions from HRV data.

### Feature 25 — Subscription Tiers (Pro + Elite)
Via RevenueCat (iOS + Android). Added to Settings screen. V1 + V2 features always free. Pro/Elite gates new V2.5 features only.

---

## V3 — Mechatronics

waliFit's long-term technical moat. Computer vision leveraging mechatronics background.

### Feature 26 — Bar Path Tracking
Camera tracks barbell path during compound lifts. Flags deviations from ideal path.

### Feature 27 — Velocity Loss Monitoring
Detects fatigue via velocity loss across sets. Suggests set termination before form breakdown.

### Feature 28 — AI Form Coach
Real-time movement analysis. Phase-by-phase feedback. First AI coaching system built on an engineer's mechatronics background, not just software heuristics.

---

## Infrastructure Scale Path

| Users | Stack | Monthly cost |
|---|---|---|
| 0–2,000 | Railway + Supabase Auth (free) + Upstash (free) | ~$45–65 |
| 2,000–10,000 | Railway + Supabase Pro ($25) + Upstash fixed ($10) | ~$150–300 |
| 10,000+ | Evaluate Render (predictable billing) | ~$300–600 |
| Enterprise | AWS (ECS + RDS + Clerk/BetterAuth) — only on compliance trigger | custom |

Break-even at V1 launch: **5–7 paying subscribers at $9.99/month.**
