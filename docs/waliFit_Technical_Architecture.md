# waliFit — Technical Architecture
> Internal Engineering Reference v1.0
> Stack: React Native + TypeScript + Railway + WaliAI (Anthropic + Google AI)

---

## CRITICAL RULES — READ FIRST

- All AI SDK imports go through `src/waliAI/` only. Never import Anthropic or Google AI in route handlers.
- Never use AsyncStorage. MMKV encrypted wrapper only.
- Never use Supabase RLS. All data access via Prisma + Fastify.
- Never call `supabase.auth.getUser()` in middleware. Use `jwt.verify()` only.
- Never hardcode hex or spacing. Always import from `react-native/theme.ts`.
- All weights stored in kg in DB. All durations in seconds in DB. UI converts on display.
- Steps are NEVER manually entered. Apple Health / Google Fit only.
- Dark text (#000000 = colors.primaryFg) on primary (#0BBFBD). Never white on teal.
- Every mutation goes through offline sync queue.
- UserMemory table ships in V1 schema (empty). Memory update job ships in V1.5.

---

## 1. System Overview

waliFit is a mobile-first hybrid athlete platform. Single React Native app (iOS + Android), TypeScript backend on Railway, WaliAI routing between Anthropic and Google AI.

**Design principle:** App must feel fast and work offline. AI is an enhancement layer, not a dependency. If all AI calls fail, users can still log workouts, view plan, and track streak.

### Architecture

```
React Native App (iOS + Android)
  Expo SDK · React Navigation · Zustand · React Query · MMKV · Reanimated 3
       ↕ HTTPS / REST + WebSocket
TypeScript Backend on Railway
  Fastify · Prisma ORM · PostgreSQL · Upstash Redis · BullMQ · Zod
  └── src/waliAI/
        Router → Claude Sonnet   (complex tasks)
               → Claude Haiku    (fallback + memory extraction)
               → Gemini Flash    (high volume)
               → Gemini Vision   (meal images, onboarding import)
               → Gemini 1.5 Pro  (long context)

External Services:
  Supabase       auth + file storage
  Firebase FCM   push notifications
  Upstash Redis  BullMQ queues + response caching
  Open Food Facts barcode nutrition data (V2)
  RevenueCat     subscriptions iOS + Android (V2.5)
```

### Technology Decisions

| Layer | Choice | Why |
|---|---|---|
| Mobile | React Native + Expo | Larger JS ecosystem, Expo reduces native config |
| Backend | TypeScript + Fastify | Shared types with frontend, faster than Express |
| Hosting | Railway | Fastest git push to production, ~$45-65/mo at launch. Scale: Railway → Render (10k+ users) → AWS (compliance trigger only) |
| Database | PostgreSQL via Prisma | Relational model suits fitness logs, type-safety |
| Cache/Queues | Upstash Redis + BullMQ | Pay-per-request, free tier 500K commands/mo. Switch to fixed plan at 10M+ ops/mo |
| State mobile | Zustand + React Query | Minimal client state, React Query handles server state |
| Local storage | MMKV encrypted wrapper | 5-10x faster than AsyncStorage, offline logging |
| Auth | Supabase Auth | Apple + Google + PKCE, 50K MAU free. Portable via JWT middleware. Migration: Supabase → Clerk (AWS) → BetterAuth (data residency) |
| Push | Firebase FCM | Free 10M msgs/mo |
| AI primary | Claude Sonnet 4.6 | Best structured reasoning for plans, careful health handling |
| AI secondary | Gemini Flash | Cheapest capable model for volume tasks |

---

## 2. Repository Structure

```
walifit/
├── apps/
│   ├── mobile/              # React Native + Expo
│   │   ├── src/
│   │   │   ├── screens/
│   │   │   ├── components/
│   │   │   ├── navigation/
│   │   │   ├── stores/      # Zustand
│   │   │   ├── hooks/
│   │   │   ├── services/    # API client, local DB
│   │   │   └── utils/
│   │   ├── app.json
│   │   └── package.json
│   └── backend/             # Fastify TypeScript API
│       ├── src/
│       │   ├── routes/
│       │   ├── waliAI/      # ALL AI logic lives here
│       │   │   ├── providers/   # Claude + Gemini adapters
│       │   │   ├── prompts/     # All system prompts
│       │   │   ├── context/     # Context builder
│       │   │   ├── jobs/        # Memory update BullMQ jobs
│       │   │   ├── router.ts    # Task → model routing
│       │   │   └── index.ts     # Public WaliAI interface
│       │   ├── services/
│       │   ├── db/          # Prisma client + migrations
│       │   ├── jobs/        # BullMQ background jobs
│       │   └── middleware/  # Auth, rate limiting, logging
│       ├── prisma/schema.prisma
│       └── package.json
├── packages/
│   └── shared/              # Shared TypeScript types
│       ├── src/types/
│       └── src/schemas/     # Zod schemas (API contracts)
├── pnpm-workspace.yaml
└── package.json
```

---

## 3. Database Schema

### Core Models

```prisma
// prisma/schema.prisma

model User {
  id              String    @id @default(cuid())
  email           String    @unique
  username        String    @unique
  displayName     String
  avatarUrl       String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  deletedAt       DateTime? // soft delete
  deletionDueAt   DateTime? // hard delete 30 days after deletedAt

  // Profile
  goals           String[]  // ["strength", "conditioning"]
  experienceLevel String    // "beginner" | "intermediate" | "advanced"
  trainingDays    String[]  // ["monday", "wednesday", "friday"]
  equipment       String[]
  bodyWeight      Float?    // always kg — UI converts
  injuries        String[]
  treeType        String    @default("oak")

  // Units & targets
  unitSystem      String    @default("metric") // "metric" | "imperial"
  proteinTargetG  Int       @default(150)
  waterTargetMl   Int       @default(2500)

  // Onboarding
  onboardingComplete  Boolean   @default(false)
  onboardingStep      Int       @default(0)

  // Legal
  privacyAcceptedAt   DateTime?
  termsAcceptedAt     DateTime?
  aiTrainingOptOut    Boolean   @default(false)
}

model WorkoutLog {
  id           String    @id @default(cuid())
  userId       String
  name         String
  date         DateTime
  durationMins Int?
  notes        String?       // V1.5 session notes
  sessionRpe   Int?          // V1.5 session RPE 1-10
  exercises    Json          // Array of LoggedExercise
  createdAt    DateTime      @default(now())

  // Run fields — add these before any other code
  runDistanceM       Int?
  runDurationS       Int?
  runPaceSPerKm      Int?
  runType            String?   // easy|tempo|race|interval
  runDistancePreset  String?   // 1mi|2k|2mi|3mi|5k|custom
  runRoutePolyline   String?
  runSplitPaces      Json?     // [{km:1, paceSecKm:340}]
}

model VitalityState {
  id              String    @id @default(cuid())
  userId          String    @unique
  streak          Int       @default(0)
  longestStreak   Int       @default(0)
  treeHealth      Float     @default(100) // 0-100
  treeStage       String    @default("sprout")
  lastActiveDate  DateTime?
  freezeTokens    Int       @default(0)
  timezone        String    @default("UTC")
  updatedAt       DateTime  @updatedAt
}

model DailyScore {
  id           String   @id @default(cuid())
  vitalityId   String
  date         DateTime @db.Date
  hydration    Float    // 0-1
  protein      Float    // 0-1
  activity     Float    // 0-1 on training days; 0.5 neutral on rest days
  isTrainingDay Boolean
  isFreezeDay  Boolean  @default(false)
  totalScore   Float    // hydration*0.3 + protein*0.3 + activity*0.4
  @@unique([vitalityId, date])
}

model SimpleNutritionLog {
  id        String   @id @default(cuid())
  userId    String
  date      DateTime @db.Date
  proteinG  Int      @default(0)
  waterMl   Int      @default(0)
  updatedAt DateTime @updatedAt
  @@unique([userId, date])
}

model PRRecord {
  id           String   @id @default(cuid())
  userId       String
  exerciseName String   // '5K Run', 'Back Squat', '1 Mile Run'
  value        Float    // weight in kg OR time in seconds for runs
  unit         String   // 'kg' | 'seconds' | 'reps'
  workoutLogId String?
  achievedAt   DateTime
}

model Squad {
  id             String   @id @default(cuid())
  name           String
  joinCode       String   @unique @default(cuid())
  createdById    String
  createdAt      DateTime @default(now())
  squadType      String   @default("hybrid") // hybrid|run_club|strength
  runFocusDistance String?
  maxMembers     Int      @default(30)
}

// V1.5 — ships empty in V1, populated by BullMQ job in V1.5
model UserMemory {
  id                 String    @id @default(cuid())
  userId             String    @unique
  coachingSummary    String?
  keyInsights        Json      @default("[]")  // string[]
  communicationStyle String?   // "direct" | "encouraging" | "analytical"
  recurringStruggles Json      @default("[]")  // string[]
  breakthroughs      Json      @default("[]")  // string[]
  sessionRpeHistory  Json      @default("[]")  // {date, workout, rpe}[]
  journalInsights    Json      @default("[]")  // from session notes
  totalConversations Int       @default(0)
  lastConversationAt DateTime?
  updatedAt          DateTime  @updatedAt
}
```

### Vitality Score Formula

```
totalScore = (steps/stepsGoal * 0.40) + (proteinG/proteinTargetG * 0.30) + (waterMl/waterTargetMl * 0.30)
```

Each pillar capped at 1.0. Stages: Wilted 0-15 · Recovering 16-35 · Sprout 36-55 · Growing 56-75 · Thriving 76-90 · Full Vitality 91-100

Rest days: activity pillar = 0.5 (neutral). Tree never penalises planned recovery.

---

## 4. WaliAI Service

**Rule: No route handler ever imports Anthropic or Google AI SDKs. Everything goes through `src/waliAI/index.ts`.**

### AI Task Routing

```typescript
// src/waliAI/router.ts
const providers: Record<AITask, AIProvider> = {
  program_generation:  new ClaudeProvider('claude-sonnet-4-6'),
  coach_chat_complex:  new ClaudeProvider('claude-sonnet-4-6'),
  memory_extraction:   new ClaudeProvider('claude-haiku-4-5-20251001'), // cheap
  coach_chat_simple:   new GeminiProvider('gemini-1.5-flash'),
  workout_adjustment:  new GeminiProvider('gemini-1.5-flash'),
  nutrition_parsing:   new GeminiProvider('gemini-1.5-flash'),
  food_rating:         new GeminiProvider('gemini-1.5-flash'),
  vision_meal_scan:    new GeminiProvider('gemini-1.5-pro-vision'),
  program_evolution:   new GeminiProvider('gemini-1.5-pro'),
  run_coaching:        new GeminiProvider('gemini-1.5-flash'),
  onboarding_import:   new GeminiProvider('gemini-1.5-pro-vision'),
}
```

### Context Builder

Every AI call injects full user context. V1.5 adds UserMemory block at the top:

```typescript
// src/waliAI/context/builder.ts
// V1.5: add memory?: UserMemory | null to ContextInput
// Inject this BEFORE the ## ATHLETE PROFILE section:

${ctx.memory?.coachingSummary ? `
## COACHING RELATIONSHIP (${ctx.memory.totalConversations} conversations)
${ctx.memory.coachingSummary}

What I know about this athlete:
${(ctx.memory.keyInsights as string[]).map(i => `- ${i}`).join('\n')}

Communication style: ${ctx.memory.communicationStyle ?? 'not yet determined'}

Recurring themes:
${(ctx.memory.recurringStruggles as string[]).map(s => `- ${s}`).join('\n')}

Notable breakthroughs:
${(ctx.memory.breakthroughs as string[]).map(b => `- ${b}`).join('\n')}
` : ''}
```

### System Prompts (src/waliAI/prompts/index.ts)

**programArchitect** — Generate structured training plans. Return JSON only. Never prescribe through acute pain. Never extreme deficits.

**dailyCoach** — Daily coaching assistant. Direct, knowledgeable, not preachy. For pain/injury: general guidance + always recommend professional if significant. Never diagnose.

**coldStartCoach** — First message after onboarding. Under 3 sentences. Acknowledge specific goal. Ask exactly ONE question. Never say "How can I help today?"

**memoryExtractor** — Claude Haiku only. Extracts new coaching observations from conversation. Conservative — one real insight beats five guesses. Returns JSON: `{coachingSummary, newKeyInsights, communicationStyle, newStruggles, newBreakthroughs}`

### Memory Update Triggers (V1.5 BullMQ jobs)

```typescript
// Trigger 1: conversation end — 60s delay
await memoryUpdateQueue.add('update', { userId }, { delay: 60_000 })

// Trigger 2: PR detected
await memoryUpdateQueue.add('pr-breakthrough', { userId, exerciseName, value })

// Trigger 3: pain/injury keyword — immediate
const PAIN_SIGNALS = ['pain', 'injury', 'hurt', 'strain', 'sore', 'twinge', 'ache']
if (PAIN_SIGNALS.some(s => message.toLowerCase().includes(s))) {
  await memoryUpdateQueue.add('struggle-detected', { userId, message })
}
```

**Cost:** ~$0.0003/update (Claude Haiku). At 1,000 users × 3 conversations/week = ~$0.90/week.

---

## 5. Backend API Routes

All routes: `/api/v1/` prefix. All authenticated via Supabase JWT middleware.

| Method | Route | Description |
|---|---|---|
| POST | /api/v1/auth/register | Create account, store PP+ToS timestamp |
| POST | /api/v1/onboarding/parse-import | Gemini Vision parses fitness app screenshot |
| GET | /api/v1/users/me | Current user profile |
| PATCH | /api/v1/users/me | Update profile, units, targets |
| DELETE | /api/v1/users/me | Soft delete, hard delete in 30 days |
| GET | /api/v1/users/me/export | JSON export (GDPR) |
| POST | /api/v1/plans/generate | Queue AI plan generation, returns jobId |
| POST | /api/v1/workouts | Log completed workout |
| GET | /api/v1/workouts/prs | All personal records |
| POST | /api/v1/ai/chat | Wali AI chat (rate limited) |
| POST | /api/v1/ai/adjust-workout | Adjust session on the fly |
| GET | /api/v1/nutrition/simple/:date | Daily protein + water (V1) |
| POST | /api/v1/nutrition/simple/:date | Log protein and water (V1) |
| GET | /api/v1/vitality/me | Tree state, streak, freeze tokens |
| POST | /api/v1/vitality/checkin | Submit daily scores |
| POST | /api/v1/vitality/freeze | Use streak freeze token |
| POST | /api/v1/runs | Save completed run |
| GET | /api/v1/runs/prs | Run personal bests per distance |
| POST | /api/v1/squads | Create squad |
| POST | /api/v1/squads/join | Join by code |
| GET | /api/v1/squads/:id/leaderboard | Squad leaderboard |

---

## 6. React Native App

### Navigation Structure

```
Root
├── AuthStack (unauthenticated)
│   ├── AuthScreen (welcome, login, signup, forgot)
│   └── OnboardingFlowScreen
└── AppTabs (authenticated) — 5 tabs
    ├── Home     — Vitality Tree + today's workout + nutrition rings + streak
    ├── Train    — Active plan + workout library + WaliRun (sub-tab)
    ├── Calendar — Monthly/weekly views
    ├── Coach    — Wali AI chat + Program Architect + Journal (V1.5)
    └── Arena    — PR feed + leaderboards + squads + friends
```

### Offline Workout Logging

```typescript
// src/stores/activeWorkout.ts — Zustand + MMKV persist
// Every set logged to local store immediately
// On network reconnect: flushOfflineQueue() syncs all mutations
// App kill during workout MUST NOT lose any set data
```

### Auth Middleware — PORTABLE PATTERN

```typescript
// src/middleware/auth.ts
// Works with Supabase Auth, Clerk, Cognito, BetterAuth
fastify.decorate('authenticate', async (request, reply) => {
  const token = request.headers.authorization?.replace('Bearer ', '')
  if (!token) return reply.status(401).send({ error: 'Unauthorized' })
  const payload = jwt.verify(token, process.env.JWT_SECRET!) as { sub: string }
  request.user = { id: payload.sub }
})

// NEVER: const { data } = await supabase.auth.getUser(token)  ← locks you in
// NEVER: Use Supabase RLS — auth.uid() breaks on provider swap
```

---

## 7. Infrastructure & Hosting

### Service Map at Launch

| Layer | Service | Cost at launch | Notes |
|---|---|---|---|
| Auth | Supabase Auth | Free (50K MAU) | Apple + Google + PKCE. See auth migration path below. |
| Database | Railway PostgreSQL | ~$10-15/mo | Private networking — zero egress to backend |
| Cache/Queues | Upstash Redis | Free → ~$2-5/mo | Pay-per-request. Switch to fixed at 10M+ ops/mo |
| Backend | Railway Fastify + worker | ~$15-20/mo | Set spend alerts |
| File storage | Supabase Storage | Free (1GB) → $25/mo Pro | Upgrade before first real user (free pauses on inactivity) |
| Push | Firebase FCM | Free (10M msgs/mo) | Sufficient through V2 |
| **TOTAL** | | **~$45-65/mo** | Break-even: 5-7 paying subscribers at $9.99/mo |

### Auth Migration Path

**V1 — Supabase Auth** (current)
- Free, 50K MAU, Apple + Google + PKCE
- Sufficient through 50,000 users

**If moving to AWS — Clerk**
- Fully managed, native Expo module, SOC2, 50K MAU free
- Migration: update JWT_SECRET in middleware + swap mobile SDK
- One day of work because waliFit never uses Supabase RLS

**If data residency required — BetterAuth**
- Open-source, self-hostable in AWS VPC
- Use for HIPAA/enterprise contracts requiring auth data in your own account

**Skip Amazon Cognito** — notoriously painful DX. Only justified with dedicated DevOps.

### Hosting Scale Path

- **0–2,000 users** — Railway, ~$45-65/mo, Upstash free tier
- **2,000–10,000 users** — Railway + Supabase Pro ($25/mo), Upstash fixed ($10/mo), ~$150-300/mo
- **10,000+ users** — Evaluate Render (predictable flat-rate billing vs Railway usage-based)
- **Enterprise/compliance trigger** — AWS (ECS/App Runner + RDS + Clerk or BetterAuth). Only move when HIPAA, SOC2, or enterprise B2B contract demands it.

### Non-Negotiable Infrastructure Rules

- Never use Supabase RLS
- Never call `supabase.auth.getUser()` in Fastify middleware
- Use Upstash Redis, not Railway Redis, until 10M+ ops/month
- Set Railway spend alerts before first deploy
- Upgrade Supabase to Pro before first real user
- All Railway services communicate over private networking
- Do not move to AWS until a real compliance/enterprise trigger exists

---

## 8. Offline Architecture

```typescript
// src/services/api.ts
// Every mutation: try network → if offline → push to MMKV queue
// On reconnect: flushOfflineQueue() processes in order
// Retry: 3 attempts, exponential backoff
// Conflict resolution: server wins on timestamp conflict
```

Queue keys in MMKV: `offline_queue` — array of `{id, method, url, data, queuedAt}`

---

## 9. AI Rate Limiting

```typescript
const LIMITS = {
  free:  { windowHours: 24, maxRequests: 10  },
  pro:   { windowHours: 24, maxRequests: 100 },
  elite: { windowHours: 24, maxRequests: 300 },
}
// Redis key: ai_rate:{userId}:{tier}
// Header: X-AI-Remaining shows remaining count
```

---

## 10. V1 Build Order

| Phase | What to Build | Effort |
|---|---|---|
| 1 | Auth + Onboarding | 1 week |
| 2 | Workout Logging (+ run schema fields) | 2 weeks |
| 3 | Calendar + Plans | 1 week |
| 4 | Simple Nutrition Logger | 3 days |
| 5 | Vitality Tree | 1 week |
| 6 | Wali AI V1 | 1-2 weeks |
| 7 | WaliRun GPS | 5-7 days |
| 8 | Settings + Account deletion | 1 week |
| 9 | Legal setup | 2 days |
| 10 | Offline + Notifications | 1 week |
| 11 | Arena (squads, leaderboards, PR feed) | 2 weeks |
| 12 | Rest Timer | 3 days |
| 13 | OTA + Polish | 1 week |
| 14 | QA + Launch | 1 week |

**Build Phases 1–5 first. Validate Vitality Tree end-to-end before touching Arena or WaliRun.**

---

## 11. Critical Systems

### Streak Timezone Handling

- Always calculate "today" in user's local timezone (Luxon: `DateTime.now().setZone(timezone)`)
- Late logging window: accept logs until 2am local for previous day
- Freeze tokens: awarded at 7, 30, 60, 100, 180, 365 day milestones
- isFreezeDay=true means streak doesn't break, but day scores 0 for health

### Account Deletion Pipeline

- User requests → `deletedAt = now()` (immediate deactivation, can't log in)
- BullMQ job → hard delete all data 30 days later
- Confirmation email at both stages
- **Apple App Store hard requirement: must work in-app. Type "DELETE" to confirm.**

### Wali AI Memory System (V1.5)

- `UserMemory` table ships empty in V1 Prisma schema (nullable fields, no risk)
- `WorkoutLog.sessionRpe` and `WorkoutLog.notes` ship in V1 schema (nullable)
- BullMQ `memoryUpdate` job ships in V1.5
- Context builder injection ships in V1.5
- Cost: ~$0.90/week at 1,000 active users (Claude Haiku)

---

## 12. Environment Variables

```env
DATABASE_URL=postgresql://...
REDIS_URL=redis://...        # Upstash Redis URL
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=AIza...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
FIREBASE_SERVICE_ACCOUNT='{...}'
REVENUECAT_API_KEY=rc_...    # V2.5
STRIPE_SECRET_KEY=sk_live_... # web payments only
NODE_ENV=production
PORT=3000
JWT_SECRET=xxxxx
CORS_ORIGIN=https://walifit.app
```

---

## 13. Design Tokens (react-native/theme.ts)

```typescript
// ─── Primary palette (updated — teal replacing emerald) ───────
colors.primary        = '#0BBFBD'  // bright teal — primary CTA, Vitality Tree, progress rings
colors.primaryDark    = '#0D6D6B'  // deep teal — points card, header accent blocks, special cards
colors.primaryFg      = '#000000'  // ALWAYS dark on teal. Never white.

// ─── App shell ────────────────────────────────────────────────
colors.background     = '#0a0f0f'  // app shell — near black, unchanged
colors.card           = '#141818'  // card surfaces, inputs — unchanged

// ─── Semantic colours ─────────────────────────────────────────
colors.energy         = '#fbbf24'  // amber — streak, warnings, legendary badges
colors.blue           = '#60a5fa'  // run data, pace, WaliRun screens
colors.blueFg         = '#0B0E14'  // dark text on blue
colors.purple         = '#a78bfa'  // future unlocks, Legendary badge tier
colors.destructive    = '#ef4444'  // delete, error states, discard

// ─── Text ─────────────────────────────────────────────────────
colors.foreground     = '#e5e7eb'  // primary text on dark bg
colors.mutedForeground= '#9ca3af'  // secondary text, labels

// ─── Utility ──────────────────────────────────────────────────
colors.overlay        = 'rgba(0,0,0,0.7)'  // modal scrims
colors.googleBrand    = '#4285F4'  // Google Sign In — brand requirement, never change

// ─── Palette origin ───────────────────────────────────────────
// Primary teal derived from Sixty app design system.
// #0BBFBD — bright teal, replaces #10b981 emerald across all screens.
// #0D6D6B — deep teal, new token for card-header backgrounds (points, credits, status).
// Both validated on #0a0f0f dark background. primaryFg (#000000) confirmed
// readable on both teal values at all standard text sizes.

touchTarget.min         = 44  // every tappable element
touchTarget.comfortable = 48  // primary actions
touchTarget.large       = 56  // workout CTAs

spacing.screen = 20  // standard horizontal padding
```

---

## 14. Wali AI Intelligence Architecture

The full system that makes Wali AI know, remember, and genuinely coach each athlete. Four signal layers, three analytics jobs, one unified context pipeline. Everything the user does in the app feeds the intelligence.

### 14.1 The Four Signal Layers

**Layer 1 — Explicit Signals (weakest)**
Onboarding answers: goals, experience, equipment, injuries, schedule. Starting point only. People describe their ideal self. Treated as a prior that behavioral signals override.

**Layer 2 — Behavioral Signals (most reliable)**
Every app event is a data point:
```
Workout logged          → adherence rate, volume trend, session duration, exercise patterns
Workout skipped         → fatigue signal if pattern emerges (3+ skips in 2 weeks)
Per-set RPE logged      → per-exercise difficulty trend
Session RPE (V1.5)      → overall fatigue. Rising RPE + stable volume = overreaching
PR set                  → progress velocity: fast / plateaued / regressing
Streak break            → motivation dip. Consecutive breaks = proactive check-in trigger
Nutrition logged/skipped → protein + hydration consistency %, engagement level
Run pace trend          → aerobic fitness trajectory
Arena reactions         → competitive vs autonomous personality signal
AI message frequency    → engagement level, what they worry about
```

**Layer 3 — Sentiment & Emotional State**
- Text sentiment (Claude Haiku): positive / neutral / struggling / frustrated — from session notes + last 5 AI messages
- Behavioral sentiment: rising RPE = fatigue, skip patterns = avoidance, shorter sessions = life stress
- Personality typing from AI interactions: data-driven / encouragement-seeking / competitive / autonomous

**Layer 4 — Evidence-Based Grounding**
Hardcoded principles in system prompt. RAG knowledge base (wger API + exercise science summaries) for specific queries. Wali AI references principles, never fake citations.

### 14.2 Extended UserMemory Schema (add to V1 schema, nullable)

```prisma
// BEHAVIORAL ANALYTICS — computed from WorkoutLog by behavioralAnalytics job
trainingAdherence    Float?   // % planned sessions completed, rolling 30 days
avgSessionRpe        Float?   // rolling 14-day average session RPE
rpeTrend             String?  // "rising" | "stable" | "falling"
volumeTrend          String?  // "increasing" | "stable" | "decreasing"
prVelocity           String?  // "fast" | "plateaued" | "regressing"
nutritionConsistency Float?   // % days hitting protein target, rolling 14 days
hydrationConsistency Float?   // % days hitting water target, rolling 14 days
preferredSessionMins Int?     // avg session duration from logs
peakTrainingDays     Json     @default("[]")  // ["monday","wednesday"]
fatigueSignals       Json     @default("[]")  // ["high RPE 3 weeks", "skipping thursdays"]
injuryHistory        Json     @default("[]")  // [{bodyPart, date, resolved: bool}]

// SENTIMENT — extracted by sentimentExtraction job
sentimentTrend       String?  // "positive" | "neutral" | "struggling" | "frustrated"
motivationScore      Int?     // 1-10, Claude Haiku rolling extraction
sleepSignals         Json     @default("[]")

// PERSONALITY — extracted from AI interaction patterns
personalityType      String?  // "data-driven"|"encouragement"|"competitive"|"autonomous"
responseToVolume     String?  // "thrives" | "struggles"
responseToIntensity  String?  // "thrives" | "struggles"

// ENGAGEMENT
lastActiveAt         DateTime?
aiEngagementLevel    String?  // "high" | "medium" | "low"
```

### 14.3 The Three Analytics Jobs (BullMQ, V1.5)

**Job 1 — `behavioralAnalytics`** (`src/waliAI/jobs/behavioralAnalytics.ts`)
- Trigger: after every workout logged
- No AI call — pure SQL computation. Free.
- Computes: trainingAdherence, avgSessionRpe, rpeTrend, volumeTrend, prVelocity, peakTrainingDays
- Fatigue flag: if `rpeTrend === 'rising' && volumeTrend !== 'increasing'` → push to fatigueSignals

**Job 2 — `sentimentExtraction`** (`src/waliAI/jobs/sentimentExtraction.ts`)
- Trigger: after session note saved OR AI message sent
- Uses Claude Haiku (~$0.0002/run)
- Input: last 5 session notes + last 5 AI messages
- Returns: `{sentimentTrend, motivationScore, newInjurySignals, newSleepSignals}`

**Job 3 — `memoryUpdate`** (extended from Section 12)
- NOW ALSO detects: personalityType, responseToVolume, responseToIntensity
- Conservative: only set personalityType after 5+ conversations observed
- Updates coachingSummary incorporating behavioral analytics fields

**Total cost all three jobs at 1,000 active users: ~$1.50/week.**

### 14.4 Full Context Pipeline (buildUserContext output)

```
## COACHING RELATIONSHIP (N conversations)
[coachingSummary]
Personality: [personalityType]
Communication: [communicationStyle]

## CURRENT FORM
Training adherence (30 days): X% of planned sessions
Average session RPE: X.X/10 (TRENDING [RISING|STABLE|FALLING])
Volume: [volumeTrend]
PR velocity: [prVelocity]
Protein consistency: X% of days hitting target

FATIGUE SIGNALS: [fatigueSignals joined] | none

## SENTIMENT & MOTIVATION
Current sentiment: [sentimentTrend]
Motivation score: X/10
Injury history: [injuryHistory body parts]

## WHAT I KNOW ABOUT THIS ATHLETE
[keyInsights]
Responds to volume: [responseToVolume]
Recurring struggles: [recurringStruggles]
Breakthroughs: [breakthroughs]

## RECENT JOURNAL (last 14 days)
[WorkoutLog where notes IS NOT NULL — date, name, sessionRpe, notes]

## TRAINING HISTORY (last 4 weeks)
[WorkoutLog — name, date, exercises, sets, reps, weight, perSetRpe]

## ATHLETE PROFILE
[goals, experience, equipment, injuries, schedule, units, targets]
```

### 14.5 Evidence-Based Rules in System Prompt

Add to `dailyCoach` and `programArchitect` prompts in `src/waliAI/prompts/index.ts`:

```
COACHING PRINCIPLES (always apply):
- Progressive overload: never recommend more than 10% volume increase per week
- RPE autoregulation: if avgSessionRpe > 8.5 for 2+ weeks, recommend deload first
- Deload: reduce volume 40%, maintain intensity, one full week, every 4-6 weeks
- Hybrid training hierarchy: zone 2 aerobic base before high-intensity conditioning
- Protein: minimum 0.8g per lb bodyweight, distributed 3-4 meals, not front-loaded
- Recurring injuries: modify around them, never push through acute pain
- Sleep signals present: recovery takes priority over training volume

HARD LIMITS (never violate):
- NEVER cite a specific study by name. Say "research on hybrid training suggests..."
  NOT "a 2019 Journal of Strength and Conditioning study found..."
  Hallucinated citations destroy trust faster than no citation.
- NEVER diagnose. NEVER prescribe medication.
- For significant pain or medical concern: refer to professional.
- NEVER recommend training through acute injury to hit a goal.
```

### 14.6 What Ships When

**V1:** All new UserMemory fields in Prisma schema (nullable). Evidence-based rules in system prompts from day one. Static context (profile + workouts + nutrition). Wali AI is already good — just not yet learning.

**V1.5:** All three BullMQ jobs. Extended context builder. Session notes + RPE capture. Journal tab. Sentiment extraction. Behavioral analytics. Personality detection. Total new cost: ~$1.50/week at 1,000 users.

After 30 days: Wali AI knows fatigue patterns. After 90 days: knows how the athlete responds to volume, what motivates them, what worries them, what their body does under stress.

---

## 15. Coaching Programme, Badges & Challenge System

V2 features. Three connected systems forming a complete retention loop.

### 15.1 Schemas (prisma/schema.prisma — V2 additions)

```prisma
model CoachingProgramme {
  id             String    @id @default(cuid())
  userId         String
  name           String    // e.g. "6-Month Hybrid Performance Block"
  status         String    // "active"|"archived"|"deleted"|"completed"
  durationWeeks  Int
  startDate      DateTime
  endDate        DateTime
  proteinTargetG Int?
  waterTargetMl  Int?
  weightGoalKg   Float?
  checkinCadence String    @default("weekly")
  programmeData  Json      // full Wali AI output
  completedAt    DateTime? // triggers GOLD Programme Complete badge
  createdAt      DateTime  @default(now())
}

model ProgrammeDraft {
  id             String   @id @default(cuid())
  userId         String   @unique  // one active draft per user
  conversationId String?
  draftData      Json     // scratch pad — overwritten on each refinement
  status         String   @default("drafting")
  lastUpdated    DateTime @updatedAt
}

model PlannedSession {
  id             String    @id @default(cuid())
  programmeId    String
  userId         String
  date           DateTime
  plannedData    Json      // IMMUTABLE — never update this field
  isModified     Boolean   @default(false)
  modifiedFields Json?     // {sets?,reps?,weight?,exercises?}
  modifiedReason String?
  modifiedAt     DateTime?
  workoutLogId   String?
}

model CheckInSnapshot {
  id               String   @id @default(cuid())
  userId           String
  programmeId      String?
  date             DateTime
  weightKg         Float?   // never called BMI in UI
  measurements     Json?    // {waistCm?,chestCm?,hipCm?,armCm?,thighCm?}
  progressPhotoUrl String?
  energyLevel      Int?     // 1-10
  notes            String?
}

model Badge {
  id           String    @id @default(cuid())
  key          String    @unique
  name         String
  tier         String    // "iron"|"bronze"|"silver"|"gold"
  scope        String    // "personal"|"squad"
  opensAt      DateTime? // null = always earnable
  closesAt     DateTime? // null = no expiry. Once closed: NEVER returns.
  squadId      String?
  isRelational Boolean   @default(false)
}

model UserBadge {
  id        String   @id @default(cuid())
  userId    String
  badgeId   String
  awardedAt DateTime // use workout.completedAt NOT submission time
  squadId   String?  // null = personal. Populated = squad context.
  isPinned  Boolean  @default(false) // max 3 pinned on profile
}
```

### 15.2 Programme Lifecycle Rules

- Draft lives in ProgrammeDraft table — not context window. 150+ sessions cannot live in a context window reliably.
- Confirmation requires a UI button tap, not just typed words. Wali AI surfaces summary card first.
- On confirm: BullMQ writes PlannedSession rows → Calendar populates → WebSocket emits `programme:ready`.
- Confirming a new programme auto-archives the old one (future sessions removed, history kept).
- `plannedData` is IMMUTABLE — never update it. User edits write to `modifiedFields` only.
- Delete (draft): row deleted, no Calendar impact. Delete (active): future sessions cascade-deleted, status → "deleted" (soft delete). Completed workouts and check-ins are user data — never deleted.
- Status: `"active" | "archived" | "deleted" | "completed"`. Completed triggers Gold badge.

### 15.3 Badge Tiers

| Tier | Examples | Notes |
|---|---|---|
| Iron | First workout, first PR, 7-day streak, first run, squad joined | Always earnable. Everyone earns early. |
| Bronze | 30-day streak, 50 workouts, month 1 complete, first Full Vitality | Require commitment |
| Silver | 5K <25min, month 3 complete, squad challenge winner | Require real progress |
| Gold | Programme Complete (6 months), 365-day streak, 5K <20min | Most users never get these |

Programme Complete is the highest-prestige badge. Dark background, minimal design, date earned. The single strongest long-term retention mechanic in the app.

### 15.4 Badge Scope Rules

- **PR Feed (global):** never shows squad badges. Personal PRs, personal milestones, tree advancement, programme completed only.
- **Squad screen:** challenge outcomes, who won. Internal to that squad only.
- **Profile:** 3 pinned badges at top (user chooses). Full collection by tier. Squad badges collapsed (shows count). Expand to see breakdown by squad + challenge. Badge accumulates across all squads ever joined — leaving never removes it.
- **awardedAt** MUST use `workout.completedAt` not submission time. Test offline sync edge case explicitly before launch.

### 15.5 Challenge System

- Timed challenges surfaced by app, calibrated to athlete's `trainingAdherence`.
- Opt-in only. Window closes — badge gone forever. Real scarcity.
- 78% adherence → "Perfect Week" (no modifications). New athlete → "Show up 3 times."
- V2: Bronze/Silver + timed windows. V3: Wali AI-generated personalised challenges unique to each athlete's plateau.

**Challenge cards are NOT in V1.** Three reasons:
1. No Coaching Programme = no planned sessions to reference. A challenge like "complete all your planned sessions this week" requires planned sessions to exist.
2. No behavioural analytics jobs = no `trainingAdherence` to calibrate difficulty. A challenge identical for a new user and a consistent one is generic gamification — exactly what this system is not.
3. Better to ship no challenges in V1 than to ship a weak uncalibrated one that sets the wrong tone.

The schema supports challenges from day one (`opensAt`, `closesAt`, `isRelational` fields on the Badge model). The award.ts window check is already in place. Nothing fires until V2.

---

### 15.6 V1 Badge Mechanics — Passive Triggers Only

V1 ships with one type of badge earning: **passive event triggers**. A user does something athletic and a badge appears. No challenge cards, no opt-in windows, no calibration required.

Every trigger lives in `src/badges/triggers.ts`. Each is a pure function called from the route handler after the DB write succeeds. Never blocks the response.

`awardBadge()` in `src/badges/award.ts` is **idempotent** — checks `UserBadge` before writing, checks `opensAt`/`closesAt` window, then writes and emits `badge:awarded` WebSocket event. Safe to call multiple times.

```typescript
// src/badges/triggers.ts

// POST /api/v1/workouts — after WorkoutLog created
export async function onWorkoutCompleted(userId: string) {
  const count = await prisma.workoutLog.count({ where: { userId } })
  if (count === 1) await awardBadge(userId, 'first_rep')

  // Streak badges — VitalityState already updated by this point
  const v = await prisma.vitalityState.findUnique({ where: { userId } })
  if (v?.streak === 7)  await awardBadge(userId, '7_day_streak')
  if (v?.streak === 30) await awardBadge(userId, '30_day_streak')
}

// POST /api/v1/workouts/prs — after PRRecord created
export async function onPrCreated(userId: string) {
  const count = await prisma.pRRecord.count({ where: { userId } })
  if (count === 1) await awardBadge(userId, 'personal_record')
}

// POST /api/v1/runs — after RunSession saved
export async function onRunCompleted(userId: string) {
  const count = await prisma.runSession.count({ where: { userId } })
  if (count === 1) await awardBadge(userId, 'first_run')
}

// POST /api/v1/squads/join — after SquadMember created
export async function onSquadJoined(userId: string) {
  const count = await prisma.squadMember.count({ where: { userId } })
  if (count === 1) await awardBadge(userId, 'squad_joined')
}

// POST /api/v1/vitality/daily-score — after DailyScore calculated
export async function onDailyScoreCalculated(userId: string, score: number) {
  if (score >= 0.91) await awardBadge(userId, 'full_vitality') // idempotent
}
```

```typescript
// src/badges/award.ts
export async function awardBadge(userId: string, badgeKey: string) {
  const badge = await prisma.badge.findUnique({ where: { key: badgeKey } })
  if (!badge) return                                          // not seeded yet

  const now = new Date()
  if (badge.opensAt && now < badge.opensAt) return           // window not open
  if (badge.closesAt && now > badge.closesAt) return         // window closed

  const already = await prisma.userBadge.findFirst({ where: { userId, badgeId: badge.id } })
  if (already) return                                         // never double-award

  await prisma.userBadge.create({
    data: { userId, badgeId: badge.id, awardedAt: new Date() }
  })
  websocket.emit(userId, 'badge:awarded', { badge })         // triggers reveal modal
}
```

**The reveal moment:** `badge:awarded` triggers a bottom sheet modal in the app — badge art, name, tier, date earned. Appears immediately after the triggering action, in-app. Not a push notification. No confetti. No looping animation. One clean entrance, one sound, stays until dismissed.

---

### 15.7 V1 Seed Data (prisma/seed.ts)

Run once on first deploy via `pnpm prisma db seed`. Creates the Badge rows that `triggers.ts` references by key. To add a new badge later: add a row here + add the trigger condition in `triggers.ts`. No schema migration needed.

| key | tier | fires in | trigger condition |
|---|---|---|---|
| `first_rep` | iron | V1 | `WorkoutLog` count = 1 |
| `personal_record` | iron | V1 | `PRRecord` count = 1 |
| `7_day_streak` | iron | V1 | `VitalityState.streak` = 7 |
| `first_run` | iron | V1 | `RunSession` count = 1 |
| `squad_joined` | iron | V1 | `SquadMember` count = 1 |
| `30_day_streak` | bronze | V1 | `VitalityState.streak` = 30 |
| `full_vitality` | bronze | V1 | `DailyScore.totalScore` ≥ 0.91 (first time, idempotent) |
| `programme_complete` | **gold** | **V2** | `CoachingProgramme.status` = `"completed"` — row seeded in V1, trigger fires in V2 |

Challenge cards (timed windows, opt-in, calibrated) are NOT in V1. The `opensAt`/`closesAt` fields and the window check in `award.ts` are already wired. No challenge card UI, no BullMQ challenge job, and no calibration logic fires until V2.
