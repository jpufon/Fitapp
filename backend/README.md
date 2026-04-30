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
│   └── schema.prisma         # DB models (Phase 2+)
├── src/
│   ├── config.ts             # env validation via Zod
│   ├── server.ts             # Fastify entrypoint
│   ├── lib/
│   │   └── prisma.ts         # Prisma client singleton
│   └── routes/               # route handlers (Phase 2+)
├── package.json
├── tsconfig.json
└── .env.example
```

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
- [ ] Phase 2 — schema + Supabase JWT auth middleware
- [ ] Phase 3 — core mutation routes (workouts, nutrition, vitality)
- [ ] Phase 4 — mobile offline mutation queue (in `react-native/lib/`)
- [ ] Phase 5 — Railway deploy + e2e smoke test
