# Engineering Principles

This document defines the working engineering standards for the Fitapp repository.
It is intentionally focused on the code that exists today: the Expo / React Native
mobile app in `react-native/`.

## Repository Shape

Current primary project structure:

```text
Fitapp/
├── react-native/
│   ├── App.tsx
│   ├── screens/
│   ├── hooks/
│   ├── lib/
│   ├── utils/
│   ├── components/
│   ├── theme.ts
│   └── global.css
├── docs/
├── guidelines/
├── README.md
├── DESIGN.md
└── CLAUDE.md
```

Planned documentation that is intentionally deferred:

- `docs/backend-architecture.md`
- `docs/api-contracts.md`

## Core Principles

1. Build on the existing app structure instead of inventing parallel patterns.
2. Extend existing screens, hooks, and shared helpers before creating new ones.
3. Keep UI, data access, and infrastructure concerns separated.
4. Prefer predictable, boring architecture over clever abstractions.
5. Design for offline tolerance and degraded operation where practical.

## Mobile Architecture

The mobile app follows a simple layered shape:

```text
Screens -> Hooks -> lib/utils -> External services
```

- `screens/` owns presentation, navigation triggers, refresh actions, and screen states.
- `hooks/` owns feature-facing data composition and query wiring.
- `lib/` owns reusable infrastructure such as API access, caching, and query config.
- `utils/` owns external client setup such as Supabase.
- `components/` owns reusable UI building blocks.

## Navigation Rules

- Use React Navigation, not `expo-router`.
- Keep app-level wiring in `react-native/App.tsx`.
- Use bottom tabs for primary destinations and stack screens for flows and detail views.
- Modal or full-screen flows should be explicit in the stack configuration.

## State Rules

- Use TanStack Query for server state and async remote data.
- Keep feature-specific query logic in hooks, not directly in screens when avoidable.
- Use local storage through the existing MMKV-backed helpers.
- Do not introduce `AsyncStorage`.
- Reserve local component state for ephemeral UI state only.

## Data and Network Rules

- Route REST calls through `react-native/lib/api.ts`.
- Route Supabase auth and realtime access through `react-native/utils/supabase.ts`.
- Keep response normalization near the hook or library that consumes it.
- Support fallback or mock data only where explicitly needed for local/mobile UX.

## UI and Design Rules

- `react-native/theme.ts` is the design token source of truth.
- Do not hardcode colors, spacing, or typography values in feature code when a token exists.
- Reuse shared components before duplicating markup across screens.
- Every major screen should handle loading, success, empty, and error states.

## File Creation Rules

Before adding a file:

1. Check whether an existing screen, hook, helper, or component already fits.
2. If a new file is needed, place it in the most specific existing directory.
3. Name files by feature intent, not by temporary implementation detail.

## Search, filters & large lists

- Follow **`docs/search-filter-architecture.md`** for where debouncing, memoization, and client vs server search belong in the **Screens → Hooks → lib** stack.
- Reuse **`useDebouncedValue`** and **`useFilteredExercises`** (exercise catalogue) before inventing ad hoc debounce/filter logic in screens.

## Documentation Rules

- Keep architecture docs aligned with the repo as it actually exists.
- Do not document backend modules that are not yet present in the repository as if they already exist.
- When planned systems are mentioned, label them clearly as future work.

## Working Standard

When changing the project:

1. Read the relevant existing file first.
2. Preserve established patterns unless there is a clear architectural reason to improve them.
3. Keep changes small, explainable, and locally consistent.
4. Prefer updates that improve maintainability without expanding scope.
