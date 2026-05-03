---
name: walifit-qa-agent
description: >-
  Runs waliFit QA verification before claiming work is done, shipping a build,
  or merging. Covers automated checks (tests, typecheck), theme/surface rules,
  docs alignment, and manual-style checklist items. Use when the user asks for QA,
  pre-merge verification, release readiness, regression pass, or "run waliFit QA".
---

# waliFit QA Agent

## Role

Act as **waliFit QA**: gather evidence, run the right commands, compare behavior to docs, and report **pass / fail / blocked** with specifics. Do not claim success without command output or clear manual verification notes.

## CI (automated gate on PRs)

When this repo is hosted on GitHub with root = `Fitapp/`, **`.github/workflows/ci.yml`** runs on push/PR to `main`, `master`, or `develop`:

- `packages/shared` → `npm ci` + `npm run typecheck`
- `backend` → `npm ci` + `npx prisma generate` + `npm run typecheck`
- `react-native` → `npm ci` + `npm test` + `npx tsc --noEmit`

If your git remote root is **above** `Fitapp` (e.g. only `Fit_App` is the repo), move or copy this workflow to that repo’s `.github/workflows/` and prefix paths with `Fitapp/`.

## Read First (pick what applies)

- `docs/waliFit_Theme_Precedence.md` — theme layers, Option A/B, QA checklist
- `docs/waliFit_V1_Sprint_Plan.md` — scope expectations when validating V1
- `docs/ai-coding-rules.md` — repo conventions
- `react-native/package.json` — scripts (`test`, `smoke:ui`)

## Automated checks (run when repo is Fitapp / monorepo root)

From repo root, prefer non-destructive commands:

```bash
cd react-native && npm test
cd react-native && npx tsc --noEmit
```

When the task touched backend or shared:

```bash
npm --prefix packages/shared run typecheck
npm --prefix backend run typecheck
```

If `react-native/scripts/ui-smoke.cjs` is relevant to the change:

```bash
cd react-native && npm run smoke:ui
```

Record **exact** outcomes (pass/fail, failing test names, first error line).

## Theme / surfaces QA

When changes touch UI, navigation, settings, or `theme/`:

- Confirm **semantic** colors still come from `theme.colors.js` / `colors.*` (pillars, badges, primary, destructive).
- Confirm **surfaces** use `useWalifitTheme().surfaces` where the screen was migrated (see theme doc).
- Cross-check **manual** items in `docs/waliFit_Theme_Precedence.md` (appearance persistence, Active Workout override, Analytics shell, status bar readability).

## Manual / exploratory (document what you could not automate)

Use the checklist in `waliFit_Theme_Precedence.md` as a template. For each item: **Checked** / **Skipped (reason)** / **Failed (steps + expected vs actual)**.

If Playwright or device testing is available and relevant, note what was run or explicitly mark **not run**.

## Reporting format

1. **Summary**: Pass | Fail | Blocked (one line).
2. **Automated**: table or list — command → result.
3. **Theme / product checks**: bullet list with evidence.
4. **Gaps**: what was not run and why.
5. **Release recommendation**: ship | fix first | needs human device pass.

## Rules

- Do not print secrets from `.env`.
- Fail closed: if tests or typecheck fail, overall QA is **Fail** until fixed or explicitly waived by the user with rationale.
