# waliFit — Challenge Library, Badge System & Points Architecture
## Internal Reference · v1.0

---

## What Ships in V1 vs V2

This is the most important section. Read this first.

### V1 — What actually ships

**Passive badges only. No points. No leaderboard. Challenge library is browsable but not earnable.**

| Feature | V1 Status | Notes |
|---|---|---|
| Challenge library (48 challenges) | ✅ Seeded, browsable | Users can see them, plan for them — cannot earn them yet |
| Pop-up challenges | ❌ Not in V1 | Requires points engine + Coaching Programme |
| Points engine | ❌ Not in V1 | Nothing to attach points to without challenges |
| Leaderboard | ❌ Not in V1 | No points = no leaderboard |
| Athlete type classification | ❌ Not in V1 | Derives from challenge point distribution |
| Status tiers | ❌ Not in V1 | Derives from total points |
| Passive badges (7) | ✅ Full trigger system | Fire automatically on athletic events |
| Challenge badges | ❌ Not in V1 | Fire when challenges are completed in V2 |
| Programme Complete (Gold) | ✅ Seeded in V1 | Trigger fires in V2 when Coaching Programme exists |

### Why challenges wait for V2

Three reasons and all three are genuine blockers:

**1. No pop-up challenge without behavioural data.** A pop-up challenge is only meaningful if it's calibrated to the athlete. "Complete a 5K this week" means nothing to someone who runs 30K a week and is too hard for someone who has never run. `trainingAdherence` from the V1.5 analytics jobs is required to calibrate difficulty. That data doesn't exist until users have been on the platform long enough.

**2. No completion tracking without Coaching Programme reference.** Pop-up challenges like "complete all your planned sessions this week" require planned sessions to exist. That's the Coaching Programme — a V2 feature.

**3. No points without something to attach them to.** Shipping an empty leaderboard is worse than no leaderboard. Points need to mean something from day one they launch. That means launching challenges and points together in V2, not points alone.

### V1 passive badge triggers (ships fully)

These fire automatically. The user does something athletic and the badge appears. No action required.

| Badge key | Tier | Trigger |
|---|---|---|
| `first_rep` | Iron | First WorkoutLog saved |
| `personal_record` | Iron | First PRRecord created |
| `7_day_streak` | Iron | VitalityState.streak = 7 |
| `first_run` | Iron | First RunSession saved |
| `squad_joined` | Iron | First SquadMember row |
| `30_day_streak` | Bronze | VitalityState.streak = 30 |
| `full_vitality` | Bronze | DailyScore.totalScore ≥ 0.91 (first time) |
| `programme_complete` | **Gold** | CoachingProgramme.status = "completed" — seeded V1, fires V2 |

---

## The Challenge Library — Full 48

Four categories. Each category has 12 challenges across three tiers. The challenges are seeded in V1 as static data. Users can browse the full library and plan which ones they want to chase. Completion tracking and points activate in V2.

---

### Category 1 — Functional
**Identity:** Movement quality. Real-world strength. The body working as a system, not just isolated muscles. These challenges test what your training actually built — can you move well, carry things, and handle positions most gym programmes ignore.

#### Beginner (4 challenges)

**F1 — First Steps**
Complete 10,000 steps in a single day.
*Points: 50 · Badge: Iron*
The foundation. If you can't walk 10K steps you're not ready for the rest of this category.

**F2 — Dead Hang**
Hold a dead hang from a pull-up bar for 30 continuous seconds.
*Points: 50 · Badge: Iron*
Grip, shoulder health, and patience. Most people who train never develop real hanging strength.

**F3 — Depth Check**
Complete 20 consecutive bodyweight squats to full depth — hip crease below knee, heels on floor, chest up.
*Points: 50 · Badge: Iron*
Not about weight. About whether your body can actually get into this position cleanly.

**F4 — The Long Walk**
Complete a 5km walk without stopping.
*Points: 50 · Badge: Iron*
Accessible to everyone. No excuses.

---

#### Medium (4 challenges)

**F5 — Get Up**
Complete a full Turkish Get-Up on each side with a weight equivalent to 25% of your bodyweight.
*Points: 150 · Badge: Bronze*
One of the most complete movement tests in existence. Requires strength, mobility, and coordination simultaneously.

**F6 — Carry Day**
Farmer carry your bodyweight (split across two hands) for 50 continuous metres.
*Points: 150 · Badge: Bronze*
If you weigh 80kg, carry 40kg in each hand for 50m. Grip, traps, core, mental toughness. No straps.

**F7 — The 50**
Complete 50 kettlebell swings at 24kg (men) / 16kg (women) in a single session without setting the bell down.
*Points: 150 · Badge: Bronze*
Hip hinge power, conditioning, and grip endurance. The swing is the foundation of everything functional.

**F8 — Three Minutes**
Hold a plank for 3 continuous minutes.
*Points: 150 · Badge: Bronze*
Not a test of core strength alone. A test of breath control, mental endurance, and whether you quit when it gets uncomfortable.

---

#### Advanced (4 challenges)

**F9 — Pistol**
Complete 5 pistol squats on each leg, unassisted, with full depth and control.
*Points: 500 · Badge: Silver*
Single-leg strength, balance, and mobility combined. Most people who lift heavy cannot do a single pistol squat.

**F10 — Heavy Carry**
Farmer carry your bodyweight for 200 continuous metres. No setting down.
*Points: 500 · Badge: Silver*
The medium challenge doubled in distance. By this point grip is failing and your whole body is working.

**F11 — Ruck**
Complete a 5km ruck carry with a pack weighing at least 20kg.
*Points: 500 · Badge: Silver*
Military-origin. Tests sustained loaded movement over distance. Not glamorous. Brutally effective.

**F12 — The Century**
Complete 100 kettlebell swings at 32kg (men) / 24kg (women) without setting the bell down.
*Points: 500 · Badge: Silver*
The advanced version of F7. At this weight and rep count, you're in real conditioning territory.

---

### Category 2 — CrossFit-Style (Metcon)
**Identity:** Conditioning + strength, combined and simultaneous. These challenges are named benchmarks or structured workouts that test how well your engine and your muscles work together under fatigue. Borrowed from CrossFit methodology because it works — but the culture here is waliFit's own.

#### Beginner (4 challenges)

**C1 — Cindy**
Complete the workout "Cindy": 20-minute AMRAP of 5 pull-ups, 10 push-ups, 15 bodyweight squats. Log your total rounds.
*Points: 50 · Badge: Iron*
The most famous AMRAP in conditioning. Every athlete should know their Cindy score.

**C2 — The Hundred**
Complete 100 burpees for time. Log your finishing time.
*Points: 50 · Badge: Iron*
Simple. Brutal. Honest. No equipment. No excuses. Your time tells you exactly where you stand.

**C3 — The Erg**
Row 2,000m on a rowing machine. Log your time.
*Points: 50 · Badge: Iron*
The universal conditioning benchmark. Two kilometres on the erg is the same everywhere in the world.

**C4 — EMOM Entry**
Complete a 10-minute EMOM: 5 push-ups + 10 bodyweight squats at the top of every minute for 10 minutes.
*Points: 50 · Badge: Iron*
Introduction to interval structure. Every minute on the minute teaches pacing and discipline.

---

#### Medium (4 challenges)

**C5 — Fran**
Complete "Fran": 21-15-9 reps of thrusters (43kg men / 29kg women) and pull-ups for time.
*Points: 150 · Badge: Bronze*
The most famous CrossFit benchmark. A good Fran time is under 5 minutes. A first Fran time is just finishing.

**C6 — Helen**
Complete "Helen": 3 rounds for time of a 400m run, 21 kettlebell swings at 24kg (men) / 16kg (women), 12 pull-ups.
*Points: 150 · Badge: Bronze*
Run, swing, pull. Three movements. Three rounds. Deceptively hard on the lungs.

**C7 — The Long Erg**
Row 5,000m for time.
*Points: 150 · Badge: Bronze*
The 2K tells you about your anaerobic capacity. The 5K tells you about your engine.

**C8 — Beat Yourself**
Complete any 20-minute AMRAP, log your score, then repeat the same AMRAP within 14 days and beat your previous round count.
*Points: 150 · Badge: Bronze*
Not about the score. About improvement. The only opponent is your previous self.

---

#### Advanced (4 challenges)

**C9 — Murph**
Complete "Murph": 1 mile run, 100 pull-ups, 200 push-ups, 300 bodyweight squats, 1 mile run. For time. With a 9kg vest if available.
*Points: 500 · Badge: Silver*
The most iconic hero WOD. Named after Navy SEAL Michael Murphy. Most athletes finish in 45–90 minutes. The vest is optional but the full distance is not.

**C10 — Grace**
Complete "Grace": 30 clean and jerks at 60kg (men) / 43kg (women) for time.
*Points: 500 · Badge: Silver*
Thirty barbell cycling reps at a weight that matters. Under 2 minutes is elite. Under 5 is respectable.

**C11 — DT**
Complete "DT": 5 rounds for time of 12 deadlifts, 9 hang power cleans, 6 push jerks at 70kg (men) / 47kg (women).
*Points: 500 · Badge: Silver*
Another hero WOD. Barbell cycling under fatigue with real weight. One barbell, three movements, five rounds.

**C12 — The Thirty**
Complete a 30-minute AMRAP of your choice. Log every round, every rep. Submit your total score.
*Points: 500 · Badge: Silver*
Half an hour of sustained work. The longest standard AMRAP. Pacing is everything — most people go too hard in the first ten minutes.

---

### Category 3 — Warrior
**Identity:** Grit. Endurance. Mental toughness. These challenges are less about physical capacity and more about the decision to keep going when stopping is an option. Named "Warrior" because that's what they demand — not aggression, but refusal.

#### Beginner (4 challenges)

**W1 — First 5K**
Complete a 5km run without stopping. Any pace. Any surface.
*Points: 50 · Badge: Iron*
The entry point to every endurance journey. Everyone remembers their first.

**W2 — Early Riser**
Train at 6am or earlier, 5 times within a single calendar month.
*Points: 50 · Badge: Iron*
Not about the workout. About the decision to show up before the world wakes up. Log the session — time-stamped.

**W3 — The Streak**
Complete 14 consecutive days of any logged training activity.
*Points: 50 · Badge: Iron*
Two weeks. No gaps. A short taste of what consistency actually requires.

**W4 — Cold Protocol**
Complete a cold shower every morning for 7 consecutive days. Manual log with confirmation.
*Points: 50 · Badge: Iron*
Uncomfortable by design. Teaches the small daily discipline that carries over into everything else.

---

#### Medium (4 challenges)

**W5 — Ten K**
Complete a 10km run without stopping.
*Points: 150 · Badge: Bronze*
Double the distance of the beginner challenge. The point where running becomes a different kind of test.

**W6 — The Month**
Complete 30 consecutive days of logged training. No rest days count — active rest (walk, mobility, swim) is fine.
*Points: 150 · Badge: Bronze*
A full month. The longest streak most athletes ever attempt deliberately.

**W7 — Ruck Ten**
Complete a 10km ruck carry with a pack weighing at least 10kg.
*Points: 150 · Badge: Bronze*
Loaded movement over serious distance. Two hours minimum for most people. Monotonous, grinding, effective.

**W8 — The Gauntlet**
Complete 5 training sessions in a single week, for 4 consecutive weeks.
*Points: 150 · Badge: Bronze*
Twenty sessions in a month. Requires planning, recovery management, and commitment. This is what a real training block looks like.

---

#### Advanced (4 challenges)

**W9 — Half**
Complete a half marathon — 21.1km — without stopping. Race or training run. Verified by GPS log.
*Points: 500 · Badge: Silver*
The distance where running becomes a different sport. Under 2 hours is solid. Finishing is what counts.

**W10 — Heavy Ruck**
Complete a 20km ruck carry with a pack weighing at least 20kg.
*Points: 500 · Badge: Silver*
Four to six hours of loaded movement. This is military selection territory. Most people have never done anything like it.

**W11 — Hyrox Simulation**
Complete a simulated Hyrox race: 8 rounds of 1km run followed immediately by one workout station (rowing 1000m, ski erg 50m, sled push 25m, sled pull 25m, burpee broad jumps 80m, sandbag lunges 100m, farmers carry 200m, wall balls 75/100 reps). Log total time.
*Points: 500 · Badge: Silver*
waliFit's signature advanced challenge. The full Hyrox experience in training. If you can complete this you are ready to race.

**W12 — The Sixty**
Train every single day for 60 consecutive days. Active rest counts. Zero gaps.
*Points: 500 · Badge: Silver*
Two months of daily commitment. Not about intensity — about showing up without exception. The number that separates athletes who talk about consistency from those who live it.

---

### Category 4 — Strength (Static Lifting)
**Identity:** Pure strength. Barbell sport. The pursuit of moving more weight with more control. These challenges are about the long game — progressive overload, technical mastery, and the patience to build something that takes months to develop.

#### Beginner (4 challenges)

**S1 — First One Rep**
Attempt and log a 1-rep max on any barbell lift of your choice.
*Points: 50 · Badge: Iron*
The foundation of strength training. You need to know your numbers before you can improve them.

**S2 — Bodyweight Squat**
Squat your own bodyweight for 1 clean repetition with full depth.
*Points: 50 · Badge: Iron*
If you weigh 80kg, squat 80kg. Simple benchmark that filters serious from casual in the squat rack.

**S3 — Five by Five**
Complete a 5×5 programme on any compound lift at the same weight for 3 consecutive weeks without missing a session.
*Points: 50 · Badge: Iron*
Not about the weight. About consistency in execution. Twelve sessions. No gaps.

**S4 — Twenty Sessions**
Log 20 consecutive strength-focused training sessions.
*Points: 50 · Badge: Iron*
A month of showing up to the barbell. The minimum commitment before strength gains become visible.

---

#### Medium (4 challenges)

**S5 — 1.5x Squat**
Squat 1.5 times your bodyweight for 1 clean repetition.
*Points: 150 · Badge: Bronze*
At 80kg bodyweight this means a 120kg squat. The threshold where you move from beginner to intermediate in the squat.

**S6 — 1.25x Bench**
Bench press 1.25 times your bodyweight for 1 clean repetition.
*Points: 150 · Badge: Bronze*
At 80kg bodyweight this means a 100kg bench. Statistically less than 5% of people who go to gyms achieve this.

**S7 — 2x Deadlift**
Deadlift 2 times your bodyweight for 1 clean repetition.
*Points: 150 · Badge: Bronze*
At 80kg bodyweight this means a 160kg deadlift. The standard intermediate strength benchmark for the deadlift.

**S8 — The Block**
Complete a 10-week linear progression programme without missing a single scheduled session.
*Points: 150 · Badge: Bronze*
Ten weeks. Every session. This is rarer than most lifters admit. Life happens — this challenge is about not letting it.

---

#### Advanced (4 challenges)

**S9 — 2x Squat**
Squat 2 times your bodyweight for 1 clean repetition.
*Points: 500 · Badge: Silver*
At 80kg bodyweight this means a 160kg squat. Advanced by any standard. This takes most athletes 2–3 years of consistent training to achieve.

**S10 — 1.5x Bench**
Bench press 1.5 times your bodyweight for 1 clean repetition.
*Points: 500 · Badge: Silver*
At 80kg bodyweight this means a 120kg bench. Elite territory for natural athletes.

**S11 — 2.5x Deadlift**
Deadlift 2.5 times your bodyweight for 1 clean repetition.
*Points: 500 · Badge: Silver*
At 80kg bodyweight this means a 200kg deadlift. Less than 1% of athletes who train consistently ever achieve this.

**S12 — The Total**
Achieve a combined squat + bench press + deadlift total of 5 times your bodyweight across your current 1RM records.
*Points: 500 · Badge: Silver*
At 80kg bodyweight: squat + bench + deadlift ≥ 400kg combined. The powerlifting total benchmark. Requires serious development across all three lifts simultaneously.

---

## Points Architecture

### Two types of challenges, one point system

```
POP-UP CHALLENGES (app assigns)
  App surfaces a timed challenge calibrated to your level.
  You have a window to complete it.
  Miss the window — gone forever.
  Points reward the moment.

CHALLENGE LIBRARY (you chase)
  48 challenges live in the app permanently.
  You attempt them whenever you want.
  No windows. No expiry.
  Points reward the achievement.
```

Both feed the same `ChallengePoints` table. The leaderboard reads from both.

### Points by source

| Source | Points | Notes |
|---|---|---|
| Library challenge — Beginner | 50 | One-time. Can't re-earn. |
| Library challenge — Medium | 150 | One-time. |
| Library challenge — Advanced | 500 | One-time. |
| Pop-up challenge — Easy | 25 | Timed window. Miss it = 0 pts. |
| Pop-up challenge — Medium | 75 | Timed window. |
| Pop-up challenge — Hard | 200 | Timed window. |
| Category badge — all Beginner (4) | 250 bonus | Earned once per category. |
| Category badge — all Medium (4) | 750 bonus | Earned once per category. |
| Category Mastery — all 12 | 2,000 bonus | Earned once per category. |
| All 48 challenges complete | 10,000 bonus | Most users never reach this. |

### Points do NOT come from

- Vitality Tree — that is a personal coaching tool, not a competitive one
- Daily scores — separate system
- Just showing up — points require a challenge

---

## Badge System — Full Design

### Two badge tracks

```
TRACK 1 — Passive badges (V1)
  Fire automatically when athletic events happen.
  User does something → badge appears.
  No challenge required.

TRACK 2 — Challenge badges (V2)
  Earned by completing challenges from the library.
  User has to deliberately pursue these.
  Much harder. More prestige.
```

### Track 1 — Passive badges (ships V1)

See V1 section above. 7 badges, all Iron or Bronze.

### Track 2 — Challenge badges (V2)

#### Per-category entry badges (Iron)
Earned when you complete your FIRST challenge in each category.

| Badge | Trigger |
|---|---|
| Functional Initiated | Complete any 1 Functional challenge |
| Metcon Initiated | Complete any 1 CrossFit-style challenge |
| Warrior Initiated | Complete any 1 Warrior challenge |
| Strength Initiated | Complete any 1 Strength challenge |

#### Per-category tier badges (Bronze → Silver → Gold)

| Badge | Tier | Trigger |
|---|---|---|
| Functional Beginner | Bronze | Complete all 4 Functional Beginner challenges |
| Functional Competitor | Silver | Complete all 4 Functional Medium challenges |
| Functional Master | Gold | Complete all 12 Functional challenges |
| Metcon Beginner | Bronze | Complete all 4 Metcon Beginner challenges |
| Metcon Competitor | Silver | Complete all 4 Metcon Medium challenges |
| Metcon Master | Gold | Complete all 12 Metcon challenges |
| Warrior Beginner | Bronze | Complete all 4 Warrior Beginner challenges |
| Warrior Competitor | Silver | Complete all 4 Warrior Medium challenges |
| Warrior Master | Gold | Complete all 12 Warrior challenges |
| Strength Beginner | Bronze | Complete all 4 Strength Beginner challenges |
| Strength Competitor | Silver | Complete all 4 Strength Medium challenges |
| Strength Master | Gold | Complete all 12 Strength challenges |

#### The apex badge (Legendary — above Gold)

**The Complete Athlete**
Complete all 48 challenges across all 4 categories.
Total points from challenges alone: 14,800 pts + 18,000 bonus = 32,800 pts minimum.
Estimated time for a dedicated athlete: 18–24 months.
Design: Black background. Minimal. Date earned. No animation.
This badge should feel like a document, not a celebration.

---

## Athlete Identity Classification

Determined by where your challenge points came from — not what you say, what you did.

```typescript
type AthleteType =
  | 'functional'     // ≥60% of challenge pts from Functional
  | 'metcon'         // ≥60% from CrossFit-style
  | 'warrior'        // ≥60% from Warrior
  | 'strength'       // ≥60% from Strength
  | 'hybrid'         // No category >40% — balanced across all four
  | 'tactical'       // Functional + Warrior combined >60%, balanced between them
  | 'powerfit'       // Strength + Metcon combined >60%, balanced between them
  | 'unclassified'   // Not enough challenge points yet (< 500 pts total)
```

**Why this matters:**

You cannot choose your athlete type. It is earned through the challenges you complete. A user who calls themselves a hybrid athlete but only does strength challenges will be classified as a Strength Athlete. The data decides.

This classification feeds directly into `UserMemory.athleteType` and changes how Wali coaches them.

---

## Status Tiers

Total all-time points determine your tier. Tiers are permanent — you cannot lose a tier once earned.

| Tier | Points required | Unlocks |
|---|---|---|
| **Recruit** | 0 | Access to app |
| **Athlete** | 1,000 | Athlete profile badge. Custom avatar frame. |
| **Competitor** | 5,000 | Early access to seasonal challenges. Competitor profile badge. |
| **Elite** | 15,000 | Priority support. Elite leaderboard. Exclusive badge designs. |
| **Apex** | 50,000 | Permanent top-tier status. Apex profile frame. Lifetime recognition. |

Apex is genuinely rare. At maximum point accumulation from all 48 library challenges plus consistent pop-up challenge completion, reaching Apex takes roughly 18–24 months of serious engagement.

---

## The Leaderboard

Four views. Same underlying data.

```
GLOBAL (rolling 90 days)
  All users. All challenge types.
  Points from last 90 days only — older points decay out.
  Resets continuously. Rewards recent activity.

WEEKLY
  Resets every Monday at 00:00.
  Levels the playing field — new users can compete with veterans.
  The most engaging view for daily active users.

BY ATHLETE TYPE
  Warriors vs Warriors.
  Strength vs Strength.
  Fair comparison between athletes who do similar things.

SQUAD (internal only)
  Never surfaces in global feed.
  Squad members only see squad leaderboard within their squad screen.
```

---

## The Seasonal Open (V2.5)

Once per year. 5 challenges released over 5 weeks.

```
Week 1 challenge released Monday
Submissions close Sunday midnight
Week 2 releases the following Monday
[repeat for 5 weeks]

Final standings published one week after Week 5 closes.
```

Your rolling rank gives you a seeded position going in. But the Open is decided by performance in those 5 weeks — not by historical points. Someone who has been on the app for a month can beat a 2-year veteran if they're better at that week's challenge.

Placement brackets by athlete type. A Warrior Athlete is ranked against other Warrior Athletes. Plus an overall bracket where Hybrid Athletes tend to dominate because they're competent across everything.

---

## Prisma Schema

```prisma
model Challenge {
  id          String  @id @default(cuid())
  key         String  @unique  // e.g. "functional_beginner_1"
  name        String
  category    String  // "functional" | "crossfit" | "warrior" | "strength"
  difficulty  String  // "beginner" | "medium" | "advanced"
  points      Int
  description String
  verifiable  Boolean @default(true)  // false = manual log (e.g. cold showers)
  isActive    Boolean @default(false) // false in V1 — browsable but not earnable

  completions UserChallenge[]
}

model UserChallenge {
  id          String    @id @default(cuid())
  userId      String
  challengeId String
  completedAt DateTime  @default(now())
  evidence    Json?     // GPS data, photo, workout log reference

  user      User      @relation(fields: [userId], references: [id])
  challenge Challenge @relation(fields: [challengeId], references: [id])

  @@unique([userId, challengeId]) // one completion per challenge per user
  @@index([userId])
  @@index([completedAt])
}

model ChallengePoints {
  id          String    @id @default(cuid())
  userId      String
  source      String    // "library_challenge" | "popup_challenge" | "category_bonus" | "apex_bonus"
  category    String?   // "functional" | "crossfit" | "warrior" | "strength"
  difficulty  String?   // "beginner" | "medium" | "advanced"
  points      Int
  earnedAt    DateTime  @default(now())
  expiresAt   DateTime? // for rolling 90-day leaderboard window
  seasonId    String?   // for Open events

  user User @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([earnedAt])
  @@index([category])
  @@index([seasonId])
}

model PopupChallenge {
  id           String    @id @default(cuid())
  userId       String
  challengeKey String    // references a template
  difficulty   String    // calibrated to this user
  points       Int
  opensAt      DateTime
  closesAt     DateTime
  completedAt  DateTime?
  status       String    @default("active") // "active" | "completed" | "expired"

  user User @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([closesAt])
}
```

---

## Version Roadmap

```
V1   SHIPS
     ├── Challenge library seeded (48 challenges)
     ├── isActive = false on all challenges (browsable, not earnable)
     ├── Passive badges: 7 triggers live
     └── programme_complete badge seeded (fires V2)

V2   SHIPS
     ├── isActive = true on all challenges
     ├── Points engine live
     ├── Pop-up challenges (calibrated by trainingAdherence)
     ├── ChallengePoints table active
     ├── Rolling 90-day leaderboard
     ├── Weekly leaderboard
     ├── Athlete type classification
     ├── Status tiers (Recruit → Apex)
     └── Challenge badges (Iron → Bronze → Silver → Gold → Legendary)

V2.5 SHIPS
     ├── Seasonal Open (first event)
     ├── By-athlete-type leaderboard
     ├── Gear/discount partner integrations
     └── Squad leaderboard separated by athlete type

V3   SHIPS
     ├── Wali AI-generated personalised challenges
     ├── Prize pool infrastructure
     └── Cross-squad seasonal competitions
```

---

*waliFit Challenge Library, Badge System & Points Architecture · Internal Reference · v1.0*
