# AI Coding Rules

These rules are for AI-assisted changes in this repository. They are based on the
current Fitapp codebase and should be treated as implementation constraints, not
general suggestions.

## Scope Awareness

- Treat `react-native/` as the main runnable application in this repository.
- Do not assume a backend exists locally unless the repo actually contains it.
- If future backend files are referenced in docs, label them as planned work.

## Read Before Writing

Before making changes:

1. Read the relevant existing screen, hook, component, or helper.
2. Check `react-native/theme.ts` for tokens before adding styles.
3. Check `DESIGN.md` and `CLAUDE.md` for project-specific constraints.
4. Extend existing patterns before introducing new ones.

## Architecture Rules

- Keep presentation logic in `screens/`.
- Keep feature data logic in `hooks/`.
- Keep shared network/cache helpers in `lib/`.
- Keep external client setup in `utils/`.
- Prefer composition over one-off abstractions.

## Navigation Rules

- Use React Navigation only.
- Do not introduce `expo-router`.
- Keep route definitions aligned with `react-native/App.tsx`.
- Do not create orphan screens that are not wired into navigation intentionally.

## Styling Rules

- Use `react-native/theme.ts` as the source of truth.
- Avoid hardcoded hex values, spacing values, and typography sizes when tokens exist.
- Preserve the current app visual language unless the task explicitly asks for redesign.
- Reuse shared components when the same UI pattern appears in multiple places.

## Search and list filtering

- For searchable lists (especially large in-memory sets like the exercise library), use **`useDebouncedValue`** + **`useFilteredExercises`** or the same pattern: debounce free text, memoize derived arrays. See **`docs/search-filter-architecture.md`**.

## State and Data Rules

- Use TanStack Query for remote/server state.
- Use the existing cached query pattern where offline fallback matters.
- Use MMKV-backed helpers for local persistence.
- Do not introduce `AsyncStorage`.
- Keep API requests routed through `react-native/lib/api.ts` when using the REST backend.
- Keep Supabase access routed through `react-native/utils/supabase.ts`.

## Reliability Rules

- Preserve loading, success, empty, and error states on screens.
- Prefer additive changes over rewrites.
- Avoid changing behavior in unrelated flows while implementing a focused task.
- If a response shape is uncertain, normalize defensively near the edge.

## Editing Rules

- Do not recreate files that already exist under another name or with overlapping purpose.
- Keep new comments brief and only where they clarify non-obvious logic.
- Default to ASCII in new files unless an existing file already uses other characters intentionally.
- Do not add speculative infrastructure that the current repo does not use.

## Git and Review Rules

- Do not revert unrelated user changes.
- Keep PRs scoped to one coherent goal.
- Document assumptions and testing performed in the PR description.
- Call out known gaps instead of hiding them.

## When Unsure

- Prefer the simplest change that matches existing code patterns.
- If architecture and implementation diverge, trust the code that exists in the repo over stale assumptions.
