# waliFit — Backend

Fastify + TypeScript + Prisma · hosted on Railway · Postgres on Supabase

## Quick start

```bash
cd backend
npm install
cp .env.example .env       # fill in real Supabase + DB values
npx prisma generate
npm run dev
```

Server listens on `http://localhost:4000`. Smoke test:

```bash
curl http://localhost:4000/healthz
# → {"status":"ok","env":"development","time":"..."}
```

## Required environment variables

See `.env.example` for the full list. Minimum to boot the server:

| Var | Where to get it |
|---|---|
| `SUPABASE_URL` | Supabase → Settings → API |
| `SUPABASE_ANON_KEY` | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API (keep secret) |
| `SUPABASE_JWT_SECRET` | Supabase → Settings → API → JWT Settings |
| `DATABASE_URL` | Supabase → Settings → Database (use pooled connection for prod) |
| `DIRECT_URL` | Supabase → Settings → Database (direct connection for migrations) |

## Layout

```
backend/
├── prisma/
│   ├── schema.prisma         # V1 schema (User, VitalityState, WorkoutLog, WorkoutSet,
│   │                         #  DailyScore, SimpleNutritionLog, PRRecord, UserMemory,
│   │                         #  Badge/UserBadge, Squad/SquadMember, FeedItem/Reaction)
│   └── migrations/           # 3 migrations applied: init, align_with_v1_schema, arena_v1
├── src/
│   ├── config.ts             # env validation via Zod
│   ├── server.ts             # Fastify entrypoint
│   ├── lib/
│   │   ├── prisma.ts         # Prisma client singleton
│   │   ├── auth.ts           # requireAuth preHandler (Supabase JWT)
│   │   ├── dailyScore.ts     # vitality computation (steps 40 / protein 30 / hydration 30)
│   │   ├── pr.ts             # PR detection on workout finish
│   │   └── feed.ts           # FeedItem writes after workout/PR
│   ├── routes/               # me, workouts, nutrition, vitality, home, calendar, arena
│   └── scripts/              # check-connectivity, mint-dev-jwt, test-auth, test-phase{3,4}
├── package.json
├── tsconfig.json
└── .env.example
```

See `docs/API_CONTRACT.md` at repo root for the full route inventory.

## Scripts

| Script | Use |
|---|---|
| `npm run dev` | Watch mode via tsx |
| `npm run build` | Compile to `dist/` |
| `npm run start` | Run compiled output |
| `npm run typecheck` | tsc --noEmit |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:migrate` | Create + apply a new migration |
| `npm run prisma:studio` | Open Prisma Studio |

## Phase status

- [x] Phase 1 — skeleton, healthz route, Prisma stub
- [x] Phase 2 — V1 schema applied (3 migrations) + Supabase JWT auth middleware (`src/lib/auth.ts`)
- [x] Phase 3 — core mutation routes (workouts, nutrition, vitality, calendar, home, arena)
- [x] Phase 4 — mobile offline mutation queue (`react-native/lib/syncQueue.ts`, `useSyncBootstrap.ts`, `useMutations.ts`)
- [ ] Phase 5 — Railway deploy + e2e smoke test
- [ ] Phase 6+ — waliAI service (`backend/src/waliAI/` — not yet scaffolded)

Open follow-ups: full Arena polish, Coach/AI routes, run-specific endpoints
(`/runs`, `/runs/prs`), squads leave/admin endpoints, account-deletion job.
