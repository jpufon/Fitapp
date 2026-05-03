# Local dev sandbox

Isolated **Postgres** in Docker plus a **separate env file** so you do not point a dev machine at production data or mix prod credentials with local experiments.

## Security properties

- Database port is bound to **127.0.0.1:5433** only (not reachable from other devices on your network).
- **`credentials.env`** and **`backend.env`** are gitignored — copy from the `*.example` files.
- Use a **staging** Supabase project (or dev-only keys), not production, in `backend.env`.

## Stability properties

- Named Docker volume **`walifit_sandbox_pgdata`** keeps schema/data across restarts until you remove the volume.
- Default API **`PORT=4001`** avoids clashing with another process on `4000`.

## Setup (once)

```bash
cd Fitapp
cp sandbox/credentials.env.example sandbox/credentials.env
# Edit sandbox/credentials.env — set SANDBOX_DB_PASSWORD

cp sandbox/backend.env.example sandbox/backend.env
# Edit sandbox/backend.env — same password in DATABASE_URL / DIRECT_URL, plus Supabase vars

cd backend
npm run sandbox:up
# wait until healthy (~10–30s first pull)
npm run prisma:sandbox:deploy
npm run dev:sandbox
```

Point the app at the sandbox API: in `react-native/.env` set `EXPO_PUBLIC_API_URL=http://localhost:4001` (or your LAN IP on a device).

## Commands (from `backend/`)

| Script | Purpose |
|--------|---------|
| `npm run sandbox:up` | Start Postgres container |
| `npm run sandbox:down` | Stop container (keeps volume) |
| `npm run sandbox:down:clean` | Stop and **delete** the DB volume |
| `npm run dev:sandbox` | Run API with `sandbox/backend.env` |
| `npm run prisma:sandbox:deploy` | Apply migrations to sandbox DB |
| `npm run prisma:sandbox:studio` | Prisma Studio against sandbox DB |

## Reset database completely

```bash
cd backend
npm run sandbox:down:clean
npm run sandbox:up
npm run prisma:sandbox:deploy
```
