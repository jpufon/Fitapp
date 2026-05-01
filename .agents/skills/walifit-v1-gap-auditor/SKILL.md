---
name: walifit-v1-gap-auditor
description: Use when auditing the whole waliFit app against docs/waliFit_V1_Features.md, comparing the V1 feature specification to what is actually implemented in mobile, backend, Prisma, shared contracts, docs, and app-store readiness materials. Produces a feature-by-feature gap matrix and prioritized build plan.
---

# waliFit V1 Gap Auditor

## Goal

Compare the V1 product specification to the real codebase. Produce evidence-backed gaps, not guesses.

Primary source of truth:

- `docs/waliFit_V1_Features.md`

Supporting sources:

- `docs/MEMORY.md` for current paths and stale-doc translation.
- `docs/walifit-md-all-tiers/README.md` for screen scaffold coverage.
- `docs/APPSTORE_CHECKLIST.md` for release blockers.
- `docs/waliFit_Roadmap.md` only when deciding whether something belongs to V1, V1.5, V2, or later.
- `docs/ai-coding-rules.md` and `docs/engineering-principles.md` for repo constraints.

Trust current code over docs that describe old paths. If a doc says `apps/mobile`, translate to `react-native/` unless the repo has been restructured.

## Scope To Inspect

- Mobile: `react-native/App.tsx`, `react-native/screens/`, `react-native/components/`, `react-native/hooks/`, `react-native/lib/`, `react-native/utils/`, `react-native/app.json`.
- Backend: `backend/src/`, `backend/prisma/schema.prisma`, `backend/package.json`.
- Shared contracts: `packages/shared/src/`.
- Release/legal: `docs/APPSTORE_CHECKLIST.md`, `.gitignore`, tracked env examples.

Do not print secrets from `.env` files.

## Feature Buckets

Audit every V1 item from `docs/waliFit_V1_Features.md`:

- Feature 1: Wali AI.
- Feature 2: Hybrid Performance Engine.
- Feature 3: Vitality Garden.
- Feature 4: waliFit Calendar.
- Feature 5: Onboarding & User Profile.
- Feature 6: Simple Nutrition Logger.
- Feature 7: Settings Screen.
- Feature 8: The Arena.
- Feature 9: Rest Timer.
- Feature 10: Smart Notifications.
- Feature 11: Offline Mode.
- Feature 12: WaliRun.
- V1 legal/non-negotiables: account deletion, AI disclosure, no paywall, auth readiness, privacy/terms, mutation queue, no AsyncStorage, design-token use, no hidden AI disclaimer, post-workout notification permission.

Keep V1.5 and V2+ items out of the launch-blocker list unless the V1 spec says schema or seed data must ship in V1.

## Status Labels

Use exactly these labels:

- `Built`: implemented end-to-end enough to satisfy the V1 requirement.
- `Partial`: visible scaffold or partial logic exists, but important behavior is missing.
- `Missing`: no meaningful implementation found.
- `Blocked`: implementation exists but cannot work because of a dependency, config, route, schema, or platform permission gap.
- `Deferred`: explicitly V1.5/V2+ and not required for V1 launch.

## Evidence Rules

For every feature, cite concrete evidence:

- File paths and line numbers when possible.
- Existing route names, screen names, schema names, hooks, or package scripts.
- Validation command results when relevant.

Do not mark a feature `Built` just because a screen scaffold exists. Confirm data flow, persistence, navigation, permissions, and backend support where the spec requires them.

## Required Checks

Run non-mutating checks when available:

```bash
git status --short
git ls-files '*env*'
npm --prefix packages/shared run typecheck
npm --prefix backend run typecheck
npm --prefix backend run build
cd react-native && npx tsc --noEmit
```

Also search for common V1 blockers:

```bash
rg -n "initialRouteName|DevScreen|AsyncStorage|Ionicons|expo-router|RevenueCat|paywall|delete account|deleteAccount|AI disclaimer|disclaimer|requestPermissions|scheduleNotification|EXPO_PUBLIC_DEV_JWT|TODO|FIXME" react-native backend packages docs
```

Do not run migrations or destructive commands during the audit.

## Output Format

Lead with the highest-impact launch blockers.

Then provide a V1 matrix:

| Feature | Status | Evidence | Gap | Next action |
|---|---|---|---|---|

After the matrix, provide:

- `Top 10 Build Plan`: prioritized tasks that move the app toward V1 launch fastest.
- `Validation`: commands run and whether they passed.
- `Open Questions`: only questions that materially affect implementation order or product scope.

Keep recommendations concrete and ordered. Avoid broad advice like "improve tests" unless tied to a specific missing test surface.
