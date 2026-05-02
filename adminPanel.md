# waliFit — Admin Panel Plan

A web-based control surface for operating waliFit in production: viewing user data, moderating the Arena, managing badges, debugging vitality, and (later) inspecting AI usage. **Planning doc — nothing built yet.**

This is a planning artifact. When implementation begins, mirror the API contract pattern used for mobile (`docs/API_CONTRACT.md`): every admin route gets one row, request/response shape, and the dashboard view that calls it.

---

## Why a dedicated panel

- **Apple/Play store deletion compliance** — we need to find a user by email and trigger hard-delete on demand (30-day soft-delete window already exists; admin is the operational hand on it).
- **Arena moderation** — feed items, squads, leaderboards. With user-generated content there must be a way to remove items and warn/suspend users. Without this, V1 cannot ship Arena to production.
- **Customer-support debugging** — "my streak broke" / "my badge didn't award" / "my workout shows the wrong PR". An ops view that shows `VitalityState`, `DailyScore`, `WorkoutLog`, `PRRecord`, `UserBadge` for any user, plus the buttons to recompute / re-award.
- **Schema-backed dashboard for non-engineers** — Prisma Studio works in dev but not for prod (no auth, no row-level filtering, dangerous edits one click away).
- **Pre-AI groundwork** — V1.5 ships `UserMemory` + behavioral analytics. The admin panel becomes the place to inspect what Wali knows about a user, audit memory updates, and (eventually) toggle AI features per cohort.

## What it is NOT

- **Not a customer-facing surface.** Admin only. Internal team.
- **Not a replacement for analytics tools.** PostHog, Sentry, and Railway logs handle product analytics, error tracking, and infra. The panel is an *operations* tool — it answers "what happened to this user?" not "what's the funnel conversion from onboarding step 3 to step 4?"
- **Not a CMS for app content** in V1. Exercise library, badge metadata, and squad templates live in code/seed. V2 if needed.
- **Not a feature-flag console** in V1. Use environment variables / CI for now. Wire to PostHog feature flags later.

---

## Stack

**Recommended:** Next.js 14 (App Router) + Prisma + shadcn/ui, deployed as a separate Railway service alongside the Fastify backend.

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 14 App Router | Server Components + Server Actions = data never leaks to the client; minimal API surface to maintain |
| ORM | The same Prisma client (`packages/shared` extension) | Schema is already authoritative in `backend/prisma/schema.prisma`; the admin imports the generated client directly |
| UI | shadcn/ui + Tailwind | Free, accessible, dark-mode native, no design lift; dashboard uses the same teal `#0BBFBD` accent on a dark surface to feel like the mobile app |
| Auth | Supabase Auth + role check | Reuse the JWT we already have. Add `role` column to `User`; gate every admin server action on `role === 'admin'`. |
| Tables | TanStack Table v8 | Filter, sort, paginate large lists (users, workouts, feed) without writing it from scratch |
| Charts | Recharts | Free, SSR-friendly, sufficient for the few KPI tiles we need |
| Hosting | Railway (separate service) | Same private network as backend; shared DB; one-click deploy |

**Tradeoffs considered:**
- **Retool / Forest Admin** — fastest to a working dashboard but expensive ($50–500/mo) and ties operations to a third party. Schema changes mean clicking through their UI. Skip unless we're under a deadline.
- **Prisma Studio in prod** — no auth, no audit log, no permission scopes, edits hit prod with no review. Hard no.
- **A new tab inside the mobile app** — wrong tool. Phone-sized UI, no good keyboard support, can't run heavy queries.
- **A separate React + Vite SPA hitting `/admin/*` Fastify routes** — more code, more auth surface to harden, every list query writes a route by hand. Worse than Next.js for this size.

---

## Auth model

```prisma
// add to backend/prisma/schema.prisma
model User {
  // ... existing fields
  role  String  @default("user")  // "user" | "admin"
}
```

- **Bootstrap:** the first admin is set by direct DB update in production (or via a one-time `tsx src/scripts/promote-admin.ts <email>` script).
- **Backend middleware:** `requireAdmin` extends `requireAuth` — checks `request.user.role === 'admin'` and 403s otherwise. Lives in `backend/src/lib/auth.ts`.
- **Admin app:** every Server Component and Server Action calls `requireAdmin(session)` before touching Prisma. No "trust the client" anywhere.
- **Audit log (V1.1):** new `AdminAuditLog` table — records `actorId`, `action`, `targetUserId?`, `payload`, `at`. Every mutation writes a row. Read views do not (too noisy).
- **MFA:** Supabase Auth supports TOTP. Require it for any admin account before V1 ship.

**No new auth system.** Re-using Supabase + a role column is cheap, keeps mobile and admin in lockstep, and lets us migrate later without a fork (see auth migration path in `docs/waliFit_Technical_Architecture.md` § 7).

---

## Sections (dashboard layout)

```
┌─────────────────────────────────────────────────────────────┐
│ waliFit Admin                              [user] [logout]  │
├──────────────┬──────────────────────────────────────────────┤
│ Overview     │  KPI tiles + recent signups + alert feed     │
│ Users        │  Search · view · suspend · soft/hard delete  │
│ Workouts     │  Browse all · filter · view sets · re-detect │
│ Vitality     │  DailyScore inspector · force recompute      │
│ Nutrition    │  SimpleNutritionLog inspector + edit         │
│ Arena        │  Feed moderation · squads · leaderboards     │
│ Badges       │  Catalog · windows · manual award/revoke     │
│ System       │  Health · queue stats · env · deploy info    │
│ Wali AI      │  V1.5 — memory inspector · cost tracking     │
└──────────────┴──────────────────────────────────────────────┘
```

### Overview

Read-only. Tiles + alerts:

- DAU / WAU / MAU (last 30 days, from `lastActiveAt` proxy or behavioural rollup)
- Sign-ups today / this week (User created)
- Workouts logged today / this week
- Sync-queue health (server-side proxy: count of `WorkoutLog` with no sets older than 1h, count of users with `deletedAt` past `deletionDueAt`)
- Recent signups (last 10) — links into Users
- Open alerts: users in deletion-due window, badge windows about to close, vitality jobs that errored

### Users

The most-used page. Behaves like a CRM contact list.

- Search by email / username / id (all index columns)
- Filter: role, onboarding state, deleted, has active programme (V2)
- Click into a user → tabs:
  - **Profile** — fields, units, targets, legal-acceptance dates, soft-delete status
  - **Vitality** — `VitalityState` + last 30 `DailyScore` rows + tree state + freeze tokens
  - **Workouts** — paginated list of `WorkoutLog` (with sets on click), PR records, run history
  - **Nutrition** — `SimpleNutritionLog` rows + targets
  - **Arena** — squads, feed items they've posted, reactions
  - **Badges** — earned + pinned + a "Manually award" form
  - **Memory** (V1.5) — `UserMemory` row read-only + last memory job timestamps
  - **Audit** — every admin action ever taken on this user
- Action buttons: "Suspend", "Soft delete", "Restore", "Hard delete (skip window)", "Force onboarding complete", "Force vitality recompute today"

### Workouts

- Browse `WorkoutLog` across all users with filters: date range, type (`strength | hybrid | conditioning | run | rest`), userId, has-PR
- Row click → exercise/set breakdown + the `PRRecord` rows it generated + the `FeedItem` it produced
- Re-detect PRs (idempotent backend op — useful when PR detection logic changes)
- Delete a workout (cascade to sets and feed item, with confirmation)

### Vitality

The debug surface for the streak / tree mechanics.

- DailyScore inspector: pick user + date range, see each pillar's component (`stepsScore`, `proteinScore`, `waterScore`), `isRestDay`, `totalScore`, derived `treeState`
- "Recompute" button — calls `POST /admin/vitality/:userId/recompute?date=`
- Streak timeline visualisation — last 60 days as a strip, green for ≥0.5, grey otherwise, gold for freeze days
- Freeze-token state + manual award (V1)

### Nutrition

- `SimpleNutritionLog` per user per day — protein g, water ml, steps count
- Edit values (writes audit row)
- Bulk-import historical data from a CSV (V2 — Apple Health / Google Fit backfill)

### Arena moderation — V1 ship-blocker

- Feed list with filters: user, squad, eventType (`workout_complete | strength_pr | run_pr | streak_milestone`), date
- Hide / delete a feed item (soft delete first, with reason)
- Squad list: name, owner, member count, invite code; "Disband squad" button (soft delete + member notifications)
- Member list per squad with "Remove from squad" action
- User-level: ability to ban a user from posting to the feed (`canPostFeed: boolean` flag — schema add)

### Badges

- Catalog view of all `Badge` rows: key, tier, scope, opensAt/closesAt, isRelational
- Edit window dates (rare — but legal/compliance might require pulling a badge)
- Per-user manual award / revoke (writes audit row)
- "Replay triggers" — given a user, re-run `triggers.ts` against their data; flag any badge they should have but don't

### System

Operational visibility, no editing.

- DB ping
- Last 5 deploys (Railway API)
- Env config display (read-only, secrets masked)
- Backend log tail (last 200 lines, polling) — V1.1
- Sync queue stats: count of pending mutations across all users (proxy via failed-recent-mutations endpoint we add)

### Wali AI — V1.5

- Memory inspector per user: `coachingSummary`, `keyInsights`, `personalityType`, `responseToVolume` etc.
- Memory job history: when ran, what was extracted
- Conversation viewer: recent AI chat messages per user (within retention window)
- Cost dashboard: tokens / requests / dollars by model (Claude Sonnet, Claude Haiku, Gemini Flash, Gemini Vision) for the last 7 / 30 days
- Per-user AI rate limit override

---

## Backend routes to add

All under `/admin/*`, all gated by `requireAdmin`. Skipped for V1 unless marked.

| Method | Path | V1? | Purpose |
|---|---|---|---|
| `GET` | `/admin/users` | ✅ | List + search + paginate users |
| `GET` | `/admin/users/:id` | ✅ | Full profile + all relations |
| `PATCH` | `/admin/users/:id` | ✅ | Update flags (role, suspended, canPostFeed, force onboarding) |
| `POST` | `/admin/users/:id/restore` | ✅ | Undo soft delete (clear `deletedAt`, `deletionDueAt`) |
| `DELETE` | `/admin/users/:id` | ✅ | Hard delete now (skip 30-day window) — gated behind a typed confirm |
| `POST` | `/admin/users/:id/vitality/recompute` | ✅ | Force recompute for a date |
| `POST` | `/admin/users/:id/badges` | ✅ | Manual award |
| `DELETE` | `/admin/users/:id/badges/:badgeId` | ✅ | Manual revoke |
| `GET` | `/admin/workouts` | ✅ | Cross-user workout list with filters |
| `POST` | `/admin/workouts/:id/redetect-prs` | ✅ | Re-run PR detection |
| `DELETE` | `/admin/workouts/:id` | ✅ | Delete workout + cascade |
| `GET` | `/admin/feed` | ✅ | Feed moderation list (incl. hidden) |
| `PATCH` | `/admin/feed/:id` | ✅ | Hide / unhide |
| `DELETE` | `/admin/feed/:id` | ✅ | Hard delete (only for clearly malicious content) |
| `GET` | `/admin/squads` | ✅ | Squad list with counts |
| `DELETE` | `/admin/squads/:id` | ✅ | Disband |
| `DELETE` | `/admin/squads/:id/members/:userId` | ✅ | Force-remove member |
| `GET` | `/admin/badges` | ✅ | Catalog |
| `POST` | `/admin/badges` | ✅ | Create new badge |
| `PATCH` | `/admin/badges/:key` | ✅ | Edit window / metadata |
| `GET` | `/admin/system/health` | ✅ | DB + Redis + queue snapshot |
| `GET` | `/admin/system/audit-log` | V1.1 | Recent admin actions |
| `GET` | `/admin/ai/memory/:userId` | V1.5 | UserMemory inspector |
| `GET` | `/admin/ai/cost` | V1.5 | Aggregated AI spend |

Schemas live in `packages/shared/src/schemas/admin/`. Backend validates with `safeParse` like the rest of the API.

---

## Schema additions

```prisma
// backend/prisma/schema.prisma — V1 additions
model User {
  // ...existing
  role         String  @default("user")  // "user" | "admin"
  suspended    Boolean @default(false)
  canPostFeed  Boolean @default(true)
}

// New table — every admin write produces a row.
model AdminAuditLog {
  id           String   @id @default(uuid()) @db.Uuid
  actorId      String   @db.Uuid
  action       String   // "user.suspend" | "user.hard_delete" | "badge.award" | etc.
  targetUserId String?  @db.Uuid
  targetType   String?  // "user" | "workout" | "feed" | "badge" | "squad" | "system"
  targetId     String?
  payload      Json     // what changed
  ip           String?  // request IP for forensic trail
  at           DateTime @default(now())

  actor        User @relation("AdminAuditActor", fields: [actorId], references: [id])
  @@index([actorId, at])
  @@index([targetUserId, at])
}

// V1 add to FeedItem — soft-delete for moderation
model FeedItem {
  // ...existing
  hiddenAt     DateTime?
  hiddenBy     String?  @db.Uuid
  hiddenReason String?
}
```

Two migrations: `add_admin_role_and_audit_log` and `add_feed_moderation_fields`. Both backwards-compatible with the mobile client (it doesn't read these columns).

---

## V1 ship checklist

The minimum to operate waliFit in production. Everything else is V1.1+.

- [ ] `User.role` column + bootstrap script (`promote-admin.ts`)
- [ ] `requireAdmin` middleware
- [ ] Next.js 14 admin app scaffolded under `admin/` at repo root
- [ ] Supabase OAuth login on the admin app
- [ ] Users page: search + view + soft-delete + restore + hard-delete
- [ ] Workouts page: browse + view sets + delete
- [ ] Vitality page: DailyScore inspector + force recompute
- [ ] Arena moderation: feed delete + squad disband + per-user `canPostFeed` toggle
- [ ] Badges: manual award / revoke
- [ ] System: health page
- [ ] Audit log on every admin write
- [ ] MFA enforced on admin Supabase users

**Out of V1:** Wali AI memory views, AI cost dashboard, Squad challenges admin, programme admin, custom analytics. All V1.5+ once those features ship.

---

## Build order (rough)

| Phase | What | Effort |
|---|---|---|
| 1 | Schema + middleware + Next.js skeleton + Supabase login | 2 days |
| 2 | Users index + detail page (read-only) | 2 days |
| 3 | User actions (suspend, soft/hard delete, restore) + audit log | 2 days |
| 4 | Workouts inspector + delete | 1 day |
| 5 | Vitality inspector + recompute | 1 day |
| 6 | Arena moderation (feed + squads) | 2 days |
| 7 | Badges admin (catalog + manual award) | 1 day |
| 8 | System health + audit log viewer | 1 day |
| 9 | MFA enforcement + role bootstrap script + Railway deploy | 1 day |

~12 working days from green light to ship.

---

## Hard rules

- **No admin route is ever called from the mobile app.** The admin Fastify routes stay behind `/admin/*` and the mobile bundle has no knowledge of them.
- **Every admin write writes an audit row.** No silent edits.
- **Hard delete requires a typed confirmation.** ("Type the user's email to confirm")
- **Reads never expose Supabase auth tokens or backend secrets** to the admin browser. Server Components only.
- **No edit forms wired to Prisma directly.** Always go through the typed admin Zod schema → Fastify route → Prisma. Same validation discipline as the mobile API.
- **Audit log is immutable.** Append-only. No update or delete on `AdminAuditLog`.

---

## Open questions before kickoff

1. **Where does the admin app live?** Repo subdirectory (`admin/`) or separate repo? Subdirectory is faster to ship and shares the Prisma client; separate repo isolates blast radius. Recommend subdirectory for V1.
2. **Who's the first admin?** Probably the founder's email. Bootstrap script.
3. **Do we want PostHog / Sentry already wired into the admin app from day 1?** Recommend yes — admin-side errors are higher impact than user-side.
4. **Do we self-host the admin behind Cloudflare Access / Tailscale, or expose it publicly behind Supabase MFA?** MFA is the simpler path. Tailscale / Cloudflare Access can come later.
5. **Audit log retention?** Recommend forever (or 7 years for compliance).
