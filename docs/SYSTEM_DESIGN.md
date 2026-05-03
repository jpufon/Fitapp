# waliFit System Design

Scope: how the backend behaves at 200k MAU. What we are building now (rate limiting + idempotency). What we are deliberately deferring (bloom filters, formal load shedding). When to revisit each.

This doc is opinionated. Deviations need a reason.

## 1. Scale assumptions

| Metric | Estimate | Notes |
|--------|----------|-------|
| MAU | 200,000 | Year 2 target |
| DAU | 60,000–80,000 | 30–40% stickiness for fitness apps |
| Peak concurrency | 5,000–15,000 | Morning + evening training windows |
| Writes per DAU per day | 20–80 | Sets, nutrition logs, vitality pillar updates |
| Reads per DAU per day | 200–1,000 | Home, Calendar, Train, Arena feed pulls |
| Total writes per day | ~3M | Comfortably handled by single Postgres |
| Per-user data per year | ~10k rows | Sets dominate (~3k), nutrition (~1.5k), vitality (~1.1k) |

Read traffic dominates by ~10x. Optimization order: cache reads, then index writes, then think about sharding.

## 2. Per-user data shape

Hot tables (writes per active user per day):

- `WorkoutLog` + `WorkoutSet` — 0–60 set rows on training days
- `NutritionEntry` — 0–10 entries (protein, water, steps deltas)
- `SimpleNutritionLog` — 1 daily roll-up (materialized SUM)
- `VitalityState` + `DailyScore` — 1–3 rows
- `FeedItem` + `FeedReaction` — 1–5 if active socially
- `PRRecord` — rare

Cold tables (~weekly): `WorkoutTemplate`, `UserMemory`, `UserBadge`, `SquadMember`.

The single biggest concern is `WorkoutSet` cardinality. At 200k users x 3k sets/year that is 600M rows/year. One table. We do not partition until it crosses 100M actual rows. Until then, a compound `(userId, createdAt desc)` index is sufficient.

## 3. The three primitives — verdict

### Bloom filter — defer
- Use case it solves: "is this in a large set" with low memory and accepting false positives.
- waliFit candidates: feed dedup, "has user X seen post Y", username availability pre-check.
- Verdict: skip. At 200k, Redis sets and sorted sets give exact membership in O(1) with no false-positive complexity. Revisit when one of these is true:
  - A single Redis lookup is the latency hot path on >100k QPS.
  - Feed personalization needs to filter against a per-user set of 10M+ items.
  - You add notification fan-out where probabilistic dedup beats exact dedup.

### PKCE — already running, audit it
- Where: Supabase Auth on mobile (`react-native/utils/supabase.ts`). PKCE is built in.
- What can break: redirect URI mismatch with the Expo scheme, refresh token rotation on cold start, code verifier persistence between launch and OAuth callback.
- Audit checklist (run before launch):
  1. Kill the app mid-OAuth, relaunch, finish flow. Should recover.
  2. Leave the app idle 30 days, re-open. Should silently refresh, not log out.
  3. Rotate the Supabase JWT secret. Existing sessions should fail cleanly with a re-auth prompt, not crash.
  4. Verify deep link scheme is registered in `app.json` and matches the Supabase redirect URI.
- Hardening backlog (post-launch): biometric gate before refresh on iOS, anomaly detection on impossible-travel logins.

### Load shedding — defer
- Use case it solves: drop low-priority traffic to protect critical paths under overload.
- waliFit reality: single Fastify service. Nothing to prioritize between yet.
- Verdict: skip. Build the lower-cost primitives first. Revisit when:
  - You have 2+ service tiers (e.g., AI inference separate from API).
  - You routinely see request queue depth >50 on the Fastify event loop.
  - You need to keep workout logging healthy while leaderboards struggle.

The 80% of value comes from rate limiting + idempotency + query timeouts + circuit breakers. That is what we build now.

## 4. Phase 1 spec: rate limiting + idempotency

### 4.1 Idempotency

Existing convention (good, extend it):

```prisma
model NutritionEntry {
  userId   String
  clientId String        // mobile-minted UUID per tap
  ...
  @@unique([userId, clientId])
}
```

The mobile sync queue (`react-native/lib/syncQueue.ts`) retries on network blips. Without dedup, retries become double-debits.

**Rule:** every mutation route MUST be idempotent under retry. Mechanism by category:

| Mutation type | Mechanism |
|---------------|-----------|
| Insert into per-user log | `(userId, clientId)` unique index, `clientId` in body |
| Update of singleton state | Conditional update with version check or last-write-wins on `updatedAt` |
| Add reaction / friendship | Composite unique on `(userId, targetId, kind)` |
| Aggregate increment | Server reads `clientId`, dedupes via cache before applying delta |

#### Client contract

- Every queued mutation gets a `clientId: string` (UUIDv7, time-ordered) at enqueue time, NOT at retry time. Enqueuing is the logical action; retries reuse the same id.
- `clientId` lives on the queue payload in MMKV until the server 2xx confirms.
- Generation: `crypto.randomUUID()` then re-hash with timestamp prefix, or use a UUIDv7 lib. UUIDv7 ordering is a nice-to-have, not required.

#### Server contract

For new mutation tables, follow `NutritionEntry`:

1. Add `clientId String` column.
2. Add `@@unique([userId, clientId])`.
3. Catch the unique constraint violation in the route handler and return the existing row's response shape. Do NOT 409.

Routes to extend with `clientId` (current gaps):
- `POST /workouts` — already idempotent via PK upsert on `id`; mobile must mint `id` at enqueue time so retries collapse. Mobile fix shipped in `useStartWorkout`.
- `POST /workouts/:id/sets` — `WorkoutSet` extended with `clientId` + `@@unique([workoutLogId, clientId])`. Mobile fix shipped in `useLogSet`. Migration: `20260503090249_add_workout_set_client_id`.
- `POST /vitality/pillar/:pillar` (already idempotent via singleton state, but a clientId log gives a paper trail)
- `POST /feed/:id/reactions` (already uses composite unique, no change needed)
- `POST /squads/:id/join` (composite unique on `(userId, squadId)`, no change needed)

For routes where adding `clientId` to schema is heavyweight, fall back to a generic `Idempotency-Key` HTTP header backed by Redis:

- Server preHandler reads `Idempotency-Key`, looks up `idem:{userId}:{key}` in Upstash.
- Cache hit: return stored response body and status verbatim.
- Cache miss: run handler, cache `(status, body)` for 24h, return.
- Concurrent retries: `SET NX EX 60` a sentinel `idem:lock:{userId}:{key}`; if locked, return 425 Too Early. Mobile retries on 425.

Use the header path sparingly. The DB-side unique index is preferable because it survives a Redis flush.

### 4.2 Rate limiting

#### Goals

1. Block runaway clients (one buggy retry loop should not melt the DB).
2. Cap obvious abuse (logging 10,000 workouts to farm badges).
3. Protect external dependencies (Supabase Auth, future AI providers).

#### Algorithm

Fixed-window counter in Upstash Redis. Sliding window is overkill at this scale and harder to reason about.

```ts
// backend/src/lib/rateLimit.ts (new file)
import { redis } from './redis'

export async function checkLimit(
  scope: string,
  subjectId: string,
  limit: number,
  windowS: number,
): Promise<{ ok: boolean; retryAfterS: number }> {
  const bucket = Math.floor(Date.now() / 1000 / windowS)
  const key = `rl:${scope}:${subjectId}:${bucket}`
  const count = await redis.incr(key)
  if (count === 1) await redis.expire(key, windowS)
  if (count > limit) {
    const retryAfterS = windowS - (Math.floor(Date.now() / 1000) % windowS)
    return { ok: false, retryAfterS }
  }
  return { ok: true, retryAfterS: 0 }
}
```

#### Buckets

| Scope | Subject | Limit | Window | Notes |
|-------|---------|-------|--------|-------|
| `write:default` | userId | 60 | 60s | All mutations not otherwise listed |
| `write:nutrition` | userId | 120 | 60s | Tap-to-log can be rapid |
| `write:vitality` | userId | 30 | 60s | Steps come from native bg sync, not user typing |
| `read:feed` | userId | 240 | 60s | Pull-to-refresh in Arena |
| `auth:login` | ip | 10 | 60s | Per IP, tighter |
| `auth:login` | email | 5 | 60s | Per identifier, tighter still |
| `auth:signup` | ip | 5 | 600s | Per IP per 10 min |
| `ai:chat` | userId | 30 | 86400s | Daily, when AI ships |
| `ai:program-gen` | userId | 5 | 86400s | Daily, when AI ships |

Numbers are a starting point. Revise after one week of production telemetry.

#### Wire-up

Fastify preHandler hook on mutation route groups:

```ts
// backend/src/lib/rateLimitHook.ts
export const rateLimit = (scope: string, limit: number, windowS: number) =>
  async (req: FastifyRequest, reply: FastifyReply) => {
    const userId = req.user?.id
    if (!userId) return
    const r = await checkLimit(scope, userId, limit, windowS)
    if (!r.ok) {
      reply.header('Retry-After', r.retryAfterS).code(429).send({
        error: 'rate_limited',
        scope,
        retryAfterS: r.retryAfterS,
      })
    }
  }
```

```ts
// backend/src/routes/workouts.ts
fastify.post('/workouts', { preHandler: rateLimit('write:default', 60, 60) }, handler)
```

#### Client behavior on 429

- Mobile reads `Retry-After`, schedules the queue item with delay = `retryAfterS + jitter(0, 5s)`.
- Show a toast only on 3rd consecutive 429 to avoid noise.
- Exclude 429 from Sentry except at sustained rate (>10/min per device).

#### Failure modes

- Upstash unreachable: fail open. Better to serve traffic than block legitimate users on a cache outage. Log to Sentry as a degraded state.
- Clock skew: bucket boundaries can flap. Acceptable. Limits are soft.

## 5. Phase 2: indexes, cache, replicas, observability

### 5.1 Index audit

Required compound indexes (verify in `schema.prisma`, add what is missing):

| Table | Index | Why |
|-------|-------|-----|
| `WorkoutLog` | `(userId, createdAt desc)` | Recent workouts list, Calendar |
| `WorkoutSet` | `(workoutLogId)` and `(userId, exerciseId, createdAt desc)` | PR detection, exercise history |
| `NutritionEntry` | `(userId, date)` | Already present, keep |
| `DailyScore` | `(userId, date desc)` | Vitality history |
| `FeedItem` | `(userId, createdAt desc) where deletedAt is null` | Home feed |
| `FeedReaction` | `(feedItemId)` and `(userId, feedItemId, kind)` | Reaction counts, dedup |
| `PRRecord` | `(userId, exerciseId, achievedAt desc)` | PR list |

Do this before launch. After launch, run `EXPLAIN ANALYZE` on the top 10 routes by p95 monthly.

### 5.2 Cache strategy (Upstash)

Cache today-shaped reads. Short TTL, invalidate on related writes.

| Key | TTL | Invalidate when |
|-----|-----|-----------------|
| `today:workout:{userId}` | 60s | Workout write |
| `today:vitality:{userId}` | 30s | Pillar update |
| `today:nutrition:{userId}` | 30s | Nutrition write |
| `feed:home:{userId}:p1` | 60s | Friend posts PR or completes workout |
| `leaderboard:{cohort}` | 600s | Cron, not request |

Invalidate by deleting the key on write commit. Do not try to rebuild the cache inline; let the next read warm it.

### 5.3 Read replicas

Defer until primary DB CPU is consistently >70% on read workload. Supabase makes this turnkey when needed. Pre-launch is too early.

### 5.4 Observability

- Sentry: errors + p95 latency per route. MCP plugin already configured in this repo.
- PostHog: product analytics (DAU, retention, funnel). MCP plugin available. Wire LLM tracing the day AI ships.
- Postgres slow query log: threshold 100ms, review weekly.
- Fastify request logging: include `userId`, `route`, `durationMs`, `status`. Drop request bodies (PII).

### 5.5 Timeouts and circuit breakers

- Postgres: `statement_timeout = 3s` at session level for the API user.
- Fastify: per-route timeout 5s default, 30s for explicit long routes (export, AI program-gen).
- Outbound (Supabase Auth, future AI): wrap each provider in a simple breaker. Three consecutive failures opens for 30s. On open, return 503 with a friendly error code; mobile retries with backoff.

## 6. When to revisit deferred items

| Item | Trigger to revisit |
|------|---------------------|
| Bloom filter | Feed dedup or notification fan-out exceeds 100k QPS, or per-user filter sets exceed 10M items |
| Formal load shedding | 2+ service tiers exist, OR Fastify event-loop queue depth >50 sustained |
| Read replicas | Primary DB CPU >70% on reads for >1h sustained |
| Table partitioning | Any single table >100M rows or any query on it >500ms p95 |
| Sharding | When read replicas + partitioning are insufficient. Realistically 2M+ MAU |

## 7. Implementation order

1. Idempotency: add `clientId` to `WorkoutLog`, `WorkoutSet`, and any other write route currently missing it. One PR.
2. Rate limiting: ship `lib/rateLimit.ts` + Upstash client + preHandler hook. Wire to all mutation routes. One PR.
3. Index audit: review `schema.prisma`, add missing compound indexes. One migration.
4. Cache layer: add `today:*` cache wrappers in `lib/cache.ts`. Wire into `home.ts` and `vitality.ts`. One PR.
5. Observability: confirm Sentry is capturing p95 per route. PostHog wiring lands when AI ships.

Each step is independently shippable. Rate limiting and idempotency are the hard floor before opening 200k signups.
