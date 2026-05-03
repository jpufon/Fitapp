# Smoke UI Testing

This document describes the lightweight mobile UI smoke test for waliFit.

The smoke test is intentionally narrower than full end-to-end testing. It renders
real React Native screens, presses user-facing controls, and verifies the screen
plumbing and outgoing payloads for critical flows. It mocks native/network
boundaries so it can run quickly without Expo CLI, a simulator, or a live user
session.

## Command

Run from the repo root:

```bash
cd react-native
npm run smoke:ui
```

The script lives at:

```text
react-native/scripts/ui-smoke.cjs
```

Expected successful output includes:

```text
UI smoke results:
- Train tab Create Program opens WorkoutBuilder
- WorkoutBuilder create, row mode switching, save, duplicate, and delete passed
- ActiveWorkout mode chips logged strength, interval, and rounds payloads
- Plate calculator shows imperial bar and lb plate inventory
- Onboarding step writes timezone America/Chicago
- Calendar day view renders Rest day Recovery badge
```

React currently prints a `react-test-renderer` deprecation warning. Treat the
process exit code as the source of truth: exit `0` is pass, non-zero is fail.

## Current Coverage

The smoke test covers:

- `TrainScreen` navigation into `WorkoutBuilder`.
- `WorkoutBuilderScreen` create, duplicate, delete, save, exercise picker, and row mode switching.
- `ActiveWorkoutScreen` strength, interval, and rounds set logging payloads.
- Imperial plate calculator bar and plate inventory display.
- Onboarding timezone payload generation.
- `CalendarScreen` rest-day badge behavior.

## Best Practices

Keep smoke tests focused on critical journeys, not every UI detail.

Prefer testing stable behavior:

- Navigation calls.
- Visible mode/state changes.
- Mutations and payload shape.
- Important empty, loading, error, and success paths.
- Regressions that previously broke the app.

Avoid brittle assertions:

- Do not assert exact component tree snapshots.
- Do not rely on visual-only style arrays unless the style is the behavior.
- Do not test every copy change unless the text is the feature contract.
- Do not make the smoke test depend on live network, real auth, or real device permissions.

Use stable selectors:

- Add `testID` only to controls or outputs the smoke test needs.
- Keep `testID` names feature-scoped, for example `active-set-s1-log`.
- Avoid reusing one `testID` for multiple unrelated controls.

Mock only the boundary:

- Use real screen components.
- Mock native host components, navigation, API hooks, Supabase, and device-only modules.
- Inspect the payloads sent by hooks instead of replacing the screen logic.

Keep it fast:

- It should finish in seconds.
- Do not start Expo, Metro, backend, or Prisma from this script.
- Use fixture data inside the harness for deterministic flows.

## When To Update It

Update the smoke test when:

- A critical tab flow changes.
- A navigation route name changes.
- A backend payload shape changes.
- A screen gains a high-value mode or mutation.
- A regression reaches manual testing.

Do not expand it into full integration coverage. If a flow needs a real backend,
simulator, or browser/device driver, create a separate E2E path and keep this
smoke test fast.

## Validation Pairing

For mobile UI changes, run:

```bash
cd react-native
npx tsc --noEmit
npm run smoke:ui
```

For shared/backend contract changes that affect UI payloads, also run:

```bash
npm --prefix packages/shared run typecheck
npm --prefix backend run typecheck
```

For bundle-level issues, verify Metro with:

```bash
cd react-native
npx expo export --platform ios --output-dir /private/tmp/walifit-smoke-export
```

## Security Note

Never paste or commit real `.env` secrets while documenting smoke results. If a
test needs auth, use short-lived local fixtures or mocked auth objects.
