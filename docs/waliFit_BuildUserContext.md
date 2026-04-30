# waliFit — Wali AI Context Pipeline
## buildUserContext · Internal Reference · v2.0

---

## Overview

Every message a user sends to Wali AI passes through this pipeline before any model is called. The pipeline does three things: decides which model to use, builds the right amount of context for that model, and enforces cost controls.

**Expected cost split at scale:** 75% Gemini Flash / 25% Claude Sonnet.

| Scenario | Without this pipeline | With this pipeline |
|---|---|---|
| 100K users, 3 msg/day | ~$3,400/week | ~$350/week |
| 10K users | ~$340/week | ~$35/week |
| 1K users | ~$34/week | ~$3.50/week |

---

## Architecture

```
User message
     │
     ▼
┌─────────────────┐
│   Rate limiter  │  20 messages/day hard cap via Redis counter
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Model router   │  Analyses message → routes to Claude or Gemini
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
 Claude     Gemini
 Sonnet     Flash
 ~$0.015   ~$0.0001
 per call   per call
    │         │
    └────┬────┘
         │
         ▼
┌─────────────────┐
│  Usage logger   │  Non-blocking write to AIUsageLog (never delays response)
└─────────────────┘
```

---

## Model Router

The most important function in the pipeline. Routes every message before any AI call is made. Costs nothing — pure logic.

### Routes to Claude Sonnet when:

- **First message** in a conversation — needs full context to introduce itself properly
- **Message over 180 characters** — user is explaining something complex
- **Complex keywords detected:**
  - Programme / training plan / periodise / block
  - Injury / pain / hurt / sore / ache / strain / recover
  - Plateau / stall / stuck / not improving / regress
  - Week / month / cycle / phase / deload / peak
  - Macro / calorie / deficit / bulk / cut / refeed
  - Not working / give up / quit / demotivated / burnout
- **Previous Claude response was long** (400+ chars) — complex topic in progress, switching models mid-conversation would feel jarring
- **Active fatigue signals** in Redis — user needs careful, contextual coaching

### Routes to Gemini Flash when:

- Short confirmations: `"nice"`, `"done"`, `"ok"`, `"thanks"`, `"logged"`, `"got it"`
- Simple greetings: `"hey"`, `"hi"`, `"morning"`
- Quick questions: `"how many sets?"`, `"what weight should I use?"`
- Everything else that doesn't match the Claude triggers above

### Router code

```typescript
async function selectModel(
  message: string,
  history: ConversationTurn[],
  userId: string
): Promise<ModelChoice> {
  if (history.length === 0) return 'claude-sonnet'
  if (message.length > 180) return 'claude-sonnet'
  if (COMPLEX_PATTERNS.some(p => p.test(message))) return 'claude-sonnet'
  if (SIMPLE_PATTERNS.some(p => p.test(message.trim()))) return 'gemini-flash'

  const lastAssistant = [...history].reverse().find(t => t.role === 'assistant')
  if (lastAssistant && lastAssistant.content.length > 400) return 'claude-sonnet'

  const hasFatigueSignals = await redis.get(`wali:fatigue:${userId}`)
  if (hasFatigueSignals) return 'claude-sonnet'

  return 'gemini-flash'
}
```

---

## Context Pipeline — Four Layers

When a message routes to Claude, context is assembled in four layers with different caching strategies.

```
┌──────────────────────────────────────────────────────┐
│  LAYER 1 — System Prompt (~800 tokens)               │
│  cache_control: ephemeral                            │
│  Shared across ALL users                             │
│  Cache hit rate: ~99%                                │
│  Changes: never (only at deploy)                     │
└──────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────┐
│  LAYER 2 — Static User Context (~600 tokens)         │
│  cache_control: ephemeral                            │
│  Per-user. Rebuilt daily or on memory update.        │
│  Stored in Redis (24hr TTL)                          │
│  Invalidated by memoryUpdate BullMQ job              │
└──────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────┐
│  LAYER 3 — Dynamic Context (~400 tokens)             │
│  No cache — changes every call                       │
│  Last 7 workouts, last 3 journal entries             │
│  Today's Vitality score                              │
└──────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────┐
│  LAYER 4 — Conversation History (variable)           │
│  Max 6 turns kept (3 user + 3 assistant)             │
│  Last assistant turn cached                          │
│  Older turns dropped to control token budget         │
└──────────────────────────────────────────────────────┘
```

Gemini Flash gets a trimmed version — a single line of key facts (~50 tokens) instead of the full pipeline.

---

## Layer 1 — System Prompts

### Claude system prompt (~800 tokens, cached across all users)

```typescript
const CLAUDE_SYSTEM_PROMPT = `
You are Wali — a world-class hybrid athlete coach embedded in the waliFit app.
You are not a chatbot. You are a coach who remembers, adapts, and challenges.

COACHING PHILOSOPHY
You coach the whole athlete: training, nutrition, recovery, and mindset.
You are direct, specific, and evidence-informed. Never vague.
Every response should feel written for this specific person.
You ask one question at a time when you need more information.

RESPONSE FORMAT
3–5 sentences for daily coaching. Up to 8 for programme advice.
Plain language. No markdown headers unless explicitly asked for a plan.
State the reason before the recommendation.
When the athlete is struggling, acknowledge it in one sentence then move forward.

HARD LIMITS — NEVER VIOLATE
- NEVER cite a specific study, paper, or researcher by name
- NEVER diagnose an injury or medical condition
- NEVER recommend specific supplements or medication doses
- NEVER use the word BMI in any context
- ALWAYS recommend professional consultation for significant or recurring pain
- NEVER say the athlete is overtraining — frame it as a recovery need

TONE BY PERSONALITY TYPE
data-driven    : precise, metric-focused, minimal emotional language
encouragement  : warmer, celebrate small wins, progress over perfection
competitive    : direct, push-oriented, results and rankings matter
autonomous     : offer options not prescriptions, respect their decisions
`
```

### Gemini system prompt (~100 tokens, no caching needed)

```typescript
const GEMINI_SYSTEM_PROMPT = `
You are Wali, a hybrid athlete coach in the waliFit app.
Be direct and specific. 2–4 sentences max.
Never diagnose injuries. Never cite studies by name.
Always recommend a professional for significant pain.
`
```

---

## Layer 2 — Static User Context

Built from the `UserMemory` and `UserProfile` tables. Cached in Redis for 24 hours.

### Full version (Claude)

```
COACHING RELATIONSHIP
Name: Marcus
Streak: 23 days | Vitality: 74/100

WHAT I KNOW ABOUT THIS ATHLETE
Goal: Hyrox — top 10 age group, March 2026
Training age: 3 years
Personality type: competitive
Adherence: 84%
RPE trend: increasing — 2 week pattern
Motivation: 6/10
Sentiment trend: slightly down
⚠️ FATIGUE SIGNALS: elevated RPE trend, shorter sessions last week

ATHLETE PROFILE
Experience: intermediate
Equipment: full gym, rower, ski erg
Preferred session: 68 minutes
Peak training days: Tuesday, Thursday, Saturday
```

### Trimmed version (Gemini Flash)

```
Athlete: Marcus | Goal: Hyrox top 10 | Tone: competitive | Streak: 23 days | ⚠️ Fatigue: elevated RPE
```

### Cache invalidation

```typescript
// Called by memoryUpdate BullMQ job after every memory write
export async function invalidateStaticUserContext(userId: string): Promise<void> {
  await Promise.all([
    redis.del(`wali:static_context:claude-sonnet:${userId}`),
    redis.del(`wali:static_context:gemini-flash:${userId}`),
    redis.del(`wali:fatigue:${userId}`),
  ])
}
```

---

## Layer 3 — Dynamic Context

Fresh every call. Last 7 days of training (3 for Gemini), last 3 journal entries (Claude only), today's Vitality score.

```
RECENT TRAINING
2025-04-24: Back Squat 4x5@120kg, Deadlift 3x3@140kg RPE8 "felt heavy today"
2025-04-22: Bench Press 4x6@90kg, OHP 3x8@60kg RPE7
2025-04-20: Front Squat 4x4@100kg, Power Clean 5x3@80kg RPE8
Vitality: 74% | Training: 68% | Nutrition: 82% | Hydration: 71%

RECENT JOURNAL
2025-04-24 (RPE 8): "Everything felt heavier than it should. Sleep has been poor."
2025-04-22 (RPE 7): "Good session but still not feeling 100%"
```

---

## Layer 4 — Conversation History

Max 6 turns kept. The last assistant turn gets `cache_control: ephemeral` so the next message in the conversation gets a cache hit on everything up to that point.

```typescript
// Max turns to keep in context
const MAX_HISTORY_TURNS = 6  // Claude
const MAX_HISTORY_TURNS = 4  // Gemini
```

---

## The API Calls

### Claude call structure

```typescript
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 600,        // HARD CAP — output is 5x more expensive than input
  system: [
    {
      type: 'text',
      text: CLAUDE_SYSTEM_PROMPT,
      cache_control: { type: 'ephemeral' },  // shared across all users
    }
  ],
  messages: [
    {
      role: 'user',
      content: [
        { type: 'text', text: staticUserContext, cache_control: { type: 'ephemeral' } },
        { type: 'text', text: dynamicContext },
        { type: 'text', text: userMessage },
      ]
    }
  ]
})
```

### Gemini call structure

```typescript
const model = gemini.getGenerativeModel({
  model: 'gemini-1.5-flash',
  systemInstruction: GEMINI_SYSTEM_PROMPT,
  generationConfig: { maxOutputTokens: 300, temperature: 0.7 },
})

const chat = model.startChat({ history: geminiHistory })
const result = await chat.sendMessage(messageWithContext)
```

---

## Cost Controls

### 1. Output token cap — the most important number

```typescript
max_tokens: 600  // Claude Sonnet
maxOutputTokens: 300  // Gemini Flash
```

Output costs **$15/M on Sonnet** — five times more expensive than input. This cap is non-negotiable.

### 2. Daily rate limit — 20 messages/day

```typescript
const FREE_DAILY_LIMIT = 20

async function checkRateLimit(userId: string): Promise<void> {
  const today = new Date().toISOString().slice(0, 10)
  const key = `wali:rate_limit:${userId}:${today}`
  const count = await redis.incr(key)
  if (count === 1) await redis.expire(key, 86400)
  if (count > FREE_DAILY_LIMIT) throw new Error('RATE_LIMIT_EXCEEDED')
}
```

When freemium launches: 20/day free, unlimited paid ($9.99/month).

### 3. History truncation

Max 6 turns sent to Claude. Prevents long conversations from ballooning input cost.

---

## Cost Per Call

| Layer | Tokens | Without cache | With cache |
|---|---|---|---|
| System prompt | 800 | $0.0024 | $0.00024 |
| Static user context | 600 | $0.0018 | $0.00018 |
| Dynamic context | 400 | $0.0012 | $0.0012 |
| **Input total** | 1,800 | **$0.0054** | **$0.00162** |
| Output (600 tokens) | 600 | $0.0090 | $0.0090 |
| **Call total** | | **$0.0144** | **$0.01062** |

---

## Pricing Reference

| Model | Input ($/M) | Cached input ($/M) | Output ($/M) |
|---|---|---|---|
| Claude Sonnet 4 | $3.00 | $0.30 | $15.00 |
| Gemini 1.5 Flash | $0.075 | — | $0.30 |

---

## Usage Logging

Every call — Claude or Gemini — writes a non-blocking log after the response is returned.

```typescript
async function logAIUsage(data: {
  userId: string
  conversationId: string
  model: ModelChoice          // "claude-sonnet" | "gemini-flash"
  inputTokens: number
  outputTokens: number
  cachedTokens: number
  estimatedCostUsd: number
}): Promise<void>
```

### Prisma schema

```prisma
model AIUsageLog {
  id               String   @id @default(cuid())
  userId           String
  conversationId   String
  model            String
  inputTokens      Int
  outputTokens     Int
  cachedTokens     Int      @default(0)
  estimatedCostUsd Float
  createdAt        DateTime @default(now())

  user User @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([model])
  @@index([createdAt])
}
```

### Useful queries

**Weekly spend by model:**
```sql
SELECT
  model,
  SUM(estimated_cost_usd) AS weekly_cost,
  COUNT(*) AS message_count,
  AVG(cached_tokens) AS avg_cached_tokens
FROM ai_usage_log
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY model
ORDER BY weekly_cost DESC
```

**Most expensive users:**
```sql
SELECT
  user_id,
  SUM(estimated_cost_usd) AS total_cost,
  COUNT(*) AS message_count,
  SUM(CASE WHEN model = 'claude-sonnet' THEN 1 ELSE 0 END) AS sonnet_calls
FROM ai_usage_log
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY user_id
ORDER BY total_cost DESC
LIMIT 20
```

---

## Route Handler

```typescript
// POST /api/v1/coach/message
export async function POST(req: Request) {
  const { userId } = req.auth
  const { message, conversationId } = await req.json()

  const history = await getConversationHistory(conversationId)

  let response
  try {
    response = await callWaliAI({ userId, conversationId, userMessage: message, history })
  } catch (err: any) {
    if (err.message === 'RATE_LIMIT_EXCEEDED') {
      return Response.json(
        { error: 'Daily coaching limit reached. Come back tomorrow.' },
        { status: 429 }
      )
    }
    throw err
  }

  await saveConversationTurns(conversationId, [
    { role: 'user',      content: message,          timestamp: new Date() },
    { role: 'assistant', content: response.message, timestamp: new Date() },
  ])

  return Response.json({
    message: response.message,
    debug: process.env.NODE_ENV === 'development' ? {
      model:            response.model,
      inputTokens:      response.inputTokens,
      outputTokens:     response.outputTokens,
      cachedTokens:     response.cachedTokens,
      estimatedCostUsd: response.estimatedCostUsd,
    } : undefined,
  })
}
```

---

## Redis Key Reference

| Key | TTL | Purpose |
|---|---|---|
| `wali:static_context:claude-sonnet:{userId}` | 24hr | Cached Claude context |
| `wali:static_context:gemini-flash:{userId}` | 24hr | Cached Gemini context |
| `wali:fatigue:{userId}` | 24hr | Fatigue signal flag for router |
| `wali:rate_limit:{userId}:{date}` | 24hr | Daily message counter |

---

## File Location

```
src/
  ai/
    buildUserContext.ts   ← this file
  jobs/
    memoryUpdate.ts       ← calls invalidateStaticUserContext() after memory write
  api/
    v1/
      coach/
        message/
          route.ts        ← calls callWaliAI()
```

---

*waliFit Wali AI Context Pipeline · Internal Reference · v2.0*
