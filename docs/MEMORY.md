# waliFit — Canonical Paths

Human- and LLM-readable reference for where things actually live in this repo.
Use this when CLAUDE.md, DECISIONS.md, or a prompt references a path that
doesn't resolve — the canonical path is probably here.

Last updated: 2026-04-20 (docs/ reorg).

---

## Repo layout (as it actually is)

```
/                                      ← repo root
├── CLAUDE.md                          ← project memory for Claude Code
├── DESIGN.md                          ← canonical design system
├── README.md
├── react-native/                      ← mobile app (the only code today)
│   ├── App.tsx
│   ├── theme.ts                       ← SOURCE OF TRUTH for colors/spacing/typography
│   ├── tailwind.config.js
│   ├── package.json
│   ├── screens/                       ← all screens live here
│   ├── components/
│   ├── hooks/
│   ├── lib/                           ← api.ts, queryClient.ts, storage.ts, workouts.ts
│   └── utils/                         ← supabase.ts + MMKV encrypted wrapper
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
└── (root now contains only: CLAUDE.md, DESIGN.md, README.md, config dotfiles, react-native/, docs/)
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
`apps/backend/src/waliAI/`            | does not exist yet — backend unscaffolded
`apps/backend/prisma/schema.prisma`   | does not exist yet
`packages/shared/src/types/`          | does not exist yet
`.stitch/DESIGN.md`                   | `DESIGN.md` (repo root)
`docs/DECISIONS.md`                   | `docs/DECISIONS.md` ✓
`docs/walifit-PROMPTS.md`             | `docs/walifit-PROMPTS.md` ✓
`docs/walifit-md-all-tiers/<X>.md`    | `docs/walifit-md-all-tiers/<X>.md` ✓

---

## What exists vs what's in CLAUDE.md

CLAUDE.md's "Key paths" section references an `apps/` + `packages/` monorepo
that is **not yet scaffolded**. Only the mobile app exists today, as a flat
`react-native/` directory at the repo root. When the backend is built, the
monorepo restructure will need to happen as its own step (either flatten
CLAUDE.md to match reality, or do the `apps/mobile/` + `apps/backend/` +
`packages/shared/` rename at that time).

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
