# waliFit — Canonical Paths

Human- and LLM-readable reference for where things actually live in this repo.
Use this when CLAUDE.md, DECISIONS.md, or a prompt references a path that
doesn't resolve — the canonical path is probably here.

Last updated: 2026-05-02 (backend/shared + v3.0 tokens).

---

## Repo layout (as it actually is)

```
/                                      ← repo root
├── CLAUDE.md                          ← project memory for Claude Code
├── DESIGN.md                          ← canonical design system
├── README.md
├── react-native/                      ← mobile app
│   ├── App.tsx
│   ├── theme.colors.js                ← SOURCE OF TRUTH for color values
│   ├── theme.ts                       ← TS exports for colors/spacing/typography
│   ├── tailwind.config.js
│   ├── package.json
│   ├── screens/                       ← all screens live here
│   ├── components/
│   ├── hooks/
│   ├── lib/                           ← api.ts, queryClient.ts, storage.ts, workouts.ts
│   └── utils/                         ← supabase.ts + auth/storage setup
├── backend/                           ← Fastify API + Prisma
│   ├── src/server.ts
│   ├── src/routes/
│   ├── src/lib/
│   └── prisma/schema.prisma
├── packages/shared/                   ← shared Zod schemas + TypeScript types
│   └── src/
├── docs/
│   ├── MEMORY.md                      ← this file
│   ├── DECISIONS.md                   ← product & technical decisions log
│   ├── walifit-PROMPTS.md             ← Claude Code prompt templates
│   ├── walifit-SCREEN-PROMPTS-v2.md   ← per-screen prompts (v2)
│   ├── walifit-IMPL-PROMPTS.md        ← implementation prompts
│   ├── walifit-md-all-tiers/          ← F-series scaffold specs (MD files with ```tsx blocks)
│   └── legacy/                        ← superseded specs from the original zip import
│       ├── APP.md, APP_JSON.md, PACKAGE.md, TAILWIND.md, THEME.md, ATTRIBUTIONS.md
│       ├── SETUP_GUIDE_CORRECTIONS.md, VITALITY_TREE.md
│       └── HOME_SCREEN.md, TrainScreen.md, ArenaScreen.md, CalendarScreen.md, ProfileScreen.md
└── (root contains app packages, docs, design memory, and config dotfiles)
```

**About `docs/legacy/`:** These 13 `.md` files came in with the original zip import
and describe the earlier scaffold. They are **superseded by `docs/walifit-md-all-tiers/`**
for any screen that has a corresponding file there (e.g. `legacy/HOME_SCREEN.md` is
replaced by `walifit-md-all-tiers/` equivalents; `legacy/THEME.md` is replaced by
`react-native/theme.ts` which is the actual source of truth). Read them for historical
context only — do not treat them as current spec.

---

## Path translation table

When a doc or prompt says …           | The real path is …
--------------------------------------|------------------------------------------
`apps/mobile/screens/<X>.tsx`         | `react-native/screens/<X>.tsx`
`apps/mobile/theme.ts`                | `react-native/theme.ts`
`apps/mobile/components/<X>.tsx`      | `react-native/components/<X>.tsx`
`apps/mobile/hooks/<X>.ts`            | `react-native/hooks/<X>.ts`
`apps/mobile/lib/<X>.ts`              | `react-native/lib/<X>.ts`
`apps/backend/src/<X>`                | `backend/src/<X>`
`apps/backend/prisma/schema.prisma`   | `backend/prisma/schema.prisma`
`packages/shared/src/types/`          | `packages/shared/src/types/`
`.stitch/DESIGN.md`                   | `DESIGN.md` (repo root)
`docs/DECISIONS.md`                   | `docs/DECISIONS.md` ✓
`docs/walifit-PROMPTS.md`             | `docs/walifit-PROMPTS.md` ✓
`docs/walifit-md-all-tiers/<X>.md`    | `docs/walifit-md-all-tiers/<X>.md` ✓

---

## What Exists Now

The repo now has three active packages:

- `react-native/` — Expo mobile app.
- `backend/` — Fastify API, Prisma schema, migrations, and route handlers.
- `packages/shared/` — shared Zod contracts and types consumed by mobile/backend.

Docs that still mention `apps/mobile` or `apps/backend` should be translated to
the canonical paths above unless they are explicitly historical/legacy docs.

---

## Scaffold-spec workflow

Files under `docs/walifit-md-all-tiers/` (e.g. `OnboardingFlowScreen.md`,
`ActiveWorkoutScreen.md`) contain a single fenced ```tsx block with a
**complete, compiling React Native component**. To apply a spec:

1. Read the existing file at `react-native/screens/<Screen>.tsx` first.
2. Read the corresponding MD under `docs/walifit-md-all-tiers/`.
3. Extract the TSX block verbatim.
4. If the existing file already matches the block byte-for-byte → no diff, done.
5. If it diverges → show the user a diff and wait for approval before writing.
6. Do not interpret the prose around the code block as a spec to rewrite.
7. Adapt the component signature only when callers in App.tsx depend on a
   different prop shape (e.g. `NativeStackScreenProps` vs callback props).
   Keep every other line of the MD body unchanged.
