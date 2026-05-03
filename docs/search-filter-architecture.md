# Search, filtering & list architecture (waliFit)

This document describes **how searching and filtering should fit** the mobile ↔ backend split, performance, and the existing **Screens → Hooks → lib** shape from `docs/engineering-principles.md`.

---

## 1. Where logic lives (architecture)

| Concern | Own it in | Notes |
|--------|-----------|--------|
| **Server data** (catalog, workouts, user) | Hooks + `lib/api.ts` + TanStack Query | Single source of truth after fetch; respect cache / offline queue. |
| **Normalizing API rows** | The hook that calls the API (e.g. `useExerciseLibrary`) | Keep screens dumb about wire formats. |
| **Pure filter predicates** | Same module as the data hook or a dedicated `lib/*Filters.ts` | No side effects; easy to unit test later. |
| **Debounced search text** | `hooks/useDebouncedValue.ts` | Screens pass raw `query`; derived lists use debounced value. |
| **Composed “filtered list” for UI** | `useFilteredExercises` (or feature-specific `useXFiltered`) | Memoized; optional `maxResults` for heavy lists. |
| **Presentation** (TextInput, chips, empty states) | `screens/*` | No direct `apiQuery` in screens — use hooks. |

Do **not** add a second REST client or duplicate TanStack Query keys for the same resource without a clear reason.

---

## 2. Client vs server search (exercise catalog)

**Today (V1):** The full exercise catalog is loaded once (paged + versioned — see `useExerciseLibrary` and `GET /exercises/catalog`). **Filtering** is **in-memory** via `filterExercises` (name substring, muscle, equipment).

**When to move search to the server**

- List size or payload forces it (e.g. **10k+** rows and slow JS filter, or you stop shipping the full list to the client).
- You need **fuzzy / ranked** search or **i18n**-aware tokenization.

**How to do server search without breaking architecture**

- Add or reuse query params on **`GET /exercises`** (`q`, `muscle`, …) — already aligned with `backend/src/routes/exercises.ts`.
- In the hook: either a **dedicated** `useExerciseSearch({ q })` with its own `queryKey` including `q`, or debounced refetch of a **limited** query — **do not** refetch on every keystroke without debounce.
- Keep **MMKV full-catalog** behavior only if product still requires full offline browse; otherwise document “search requires network” for that mode.

---

## 3. Performance practices

1. **Debounce text search** (~200–300ms) before running filters or network search — use `useDebouncedValue`.
2. **Memoize** filtered arrays with `useMemo` (or use `useFilteredExercises` which composes debounce + `filterExercises`).
3. **Cap visible rows** in dense pickers (e.g. first **N** matches) or use **`FlashList`** / `FlatList` `windowSize` for long scroll lists — avoid `ScrollView` + **map thousands** of rows.
4. **Stable list keys** — always `key={ex.id}` (or stable server id), never array index, for correct reconciliation.
5. **Avoid inline arrow functions in `data` props** that allocate new references every render when passing to memoized children — prefer `useCallback` for handlers passed deep.

---

## 4. API & backend alignment

- **List endpoints:** Prefer explicit **limits**, **offsets** or **cursors**, and a **version** or **`updatedAfter`** for sync (exercises already document this in `docs/API_CONTRACT.md`).
- **Validation:** Query params validated with **Zod** on the server (same style as other routes).
- **Auth:** Catalogue routes stay **authenticated** unless product explicitly allows public read.

---

## 5. UX expectations

- **Loading / empty / error** for any screen that fetches filterable data (see `docs/ai-coding-rules.md`).
- **Empty search:** Clear copy (“No matches”) — distinguish **no data** vs **no matches**.
- **Filters (chips):** Changing muscle/equipment should not require debounce; debounce applies to **free-text** search.

---

## 6. Related files

| Area | File |
|------|------|
| Debounce primitive | `react-native/hooks/useDebouncedValue.ts` |
| Exercise fetch + filter + debounced list | `react-native/hooks/useExerciseLibrary.ts` |
| Catalogue API | `backend/src/routes/exercises.ts` |
| Contract | `docs/API_CONTRACT.md` (Exercise catalog section) |

---

## 7. Checklist for new searchable lists

- [ ] Data from a **hook** (TanStack Query + `lib/api.ts`).
- [ ] **Debounced** text query before filter or refetch.
- [ ] **Memoized** filtered result.
- [ ] **Bounded** render cost (cap or virtualized list).
- [ ] **Loading / error / empty** states.
- [ ] If server-backed search: **queryKey** includes search params; debounce before `refetch`.
