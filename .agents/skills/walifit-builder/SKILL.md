---
name: walifit-builder
description: Use when building or modifying waliFit features in this repository, especially React Native screens, hooks, backend Fastify routes, Prisma models, or shared Zod contracts. This skill keeps agents aligned with the current Fitapp repo shape, design tokens, navigation rules, offline/data patterns, and validation commands.
---

# waliFit Builder

## First Read

Before editing, read only the files relevant to the task plus these lightweight anchors:

- `docs/MEMORY.md` for canonical paths and stale-doc warnings.
- `docs/ai-coding-rules.md` for repo-specific implementation constraints.
- `docs/engineering-principles.md` for current architecture.
- `docs/waliFit_Technical_Architecture.md` only when the task touches backend, Prisma, auth, AI, or data model decisions.

Trust code that exists over stale docs. If docs describe `apps/mobile`, translate it to `react-native/` unless the repo has actually been restructured.

## Current Repo Shape

- Mobile app: `react-native/`
- Backend API: `backend/`
- Shared contracts: `packages/shared/`
- Design token source: `react-native/theme.ts` and `react-native/theme.colors.ts`
- Navigation source: `react-native/App.tsx`
- Prisma schema: `backend/prisma/schema.prisma`

## Implementation Rules

- Read the existing screen, hook, component, route, or schema before writing.
- Extend local patterns before adding new abstractions.
- Keep presentation in `react-native/screens/`, data composition in `react-native/hooks/`, shared API/cache helpers in `react-native/lib/`, and external client setup in `react-native/utils/`.
- Use React Navigation. Do not introduce `expo-router`.
- Use TanStack Query for remote/server state.
- Use existing MMKV-backed storage helpers. Do not introduce `AsyncStorage`.
- Route REST calls through `react-native/lib/api.ts`.
- Route Supabase client setup through `react-native/utils/supabase.ts`.
- Use shared contracts from `packages/shared` where backend and mobile exchange structured data.
- Preserve loading, success, empty, and error states on user-facing screens.

## Styling Rules

- Import colors, spacing, typography, radius, and touch target values from the theme files when tokens exist.
- Avoid hardcoded hex values, spacing values, and typography sizes in feature code.
- Use `lucide-react-native` icons when an icon is needed.
- Keep UI consistent with the current app language unless the task explicitly asks for redesign.
- Check mobile text fit and touch targets for compact screens.

## Backend Rules

- Keep Fastify route handlers small and validate inputs/outputs with Zod where practical.
- Keep Prisma access behind route/library helpers that can be tested or inspected.
- Do not bypass auth helpers in `backend/src/lib/auth.ts`.
- Store weights in kg and durations in seconds at the data layer.
- Keep Prisma schema, shared schemas, and mobile consumers aligned when changing API shapes.

## Validation

Run the narrowest useful checks for the files changed:

```bash
npm --prefix packages/shared run typecheck
npm --prefix backend run typecheck
npm --prefix backend run build
cd react-native && npx tsc --noEmit
```

If a command cannot run because dependencies, database, or environment variables are missing, report the exact blocker and still run independent checks.

## Output Standard

When done, summarize:

- What changed.
- Which checks ran and their results.
- Any assumptions, skipped checks, or known follow-up work.
