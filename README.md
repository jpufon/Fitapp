# waliFit

waliFit is a hybrid-athlete fitness app with a React Native mobile client,
Fastify backend, Prisma/Postgres data layer, and shared Zod contracts.

## Project Shape

```text
Fitapp/
├── react-native/       # Expo mobile app
├── backend/            # Fastify API + Prisma
├── packages/shared/    # Shared Zod schemas and TypeScript types
├── docs/               # Product, architecture, API, sync, and token docs
└── DESIGN.md           # Design system overview
```

## Theme

The active design-token source is:

- `react-native/theme.colors.js` — v3.0 production fitness palette
- `react-native/theme.ts` — React Native exports for colors, spacing, radius, typography
- `react-native/tailwind.config.js` — NativeWind/Tailwind mapping from the same palette
- `docs/waliFit_Design_Tokens.md` — documented token contract

Use `colors`, `pillarColors`, `gradients`, `spacing`, `typography`, `radius`, and
`touchTarget` from `react-native/theme.ts`. Do not hardcode hex values in screens.

## Quick Start

Mobile:

```bash
cd react-native
npm install
cp .env.example .env
npx expo start
```

Backend:

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Shared contracts:

```bash
npm --prefix packages/shared run typecheck
```

## Validation

```bash
npm --prefix packages/shared run typecheck
npm --prefix backend run typecheck
npm --prefix backend run build
cd react-native && npx tsc --noEmit
```
