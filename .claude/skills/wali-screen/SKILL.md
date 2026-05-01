---
name: wali-screen
description: Scaffold a new waliFit React Native screen + matching data hook that complies with all CLAUDE.md hard rules out of the box. Use when the user asks to "scaffold a screen", "create a new screen", "add a screen", "generate screen", or names a screen that doesn't yet exist in react-native/screens/. Produces a screen with all 4 required states (loading / success / empty / error), tokens-only imports from theme.ts, lucide icons, and a co-located useXData.ts hook wired through useCachedQuery + apiRequest. Also offers to register the screen in navigation.
---

# wali-screen — waliFit screen scaffolder

Generates two files that already comply with every "NEVER"/"ALL"/"Every screen must" rule in `CLAUDE.md`:

1. `react-native/screens/<Name>Screen.tsx`
2. `react-native/hooks/use<Name>Data.ts`

After writing them, offer to register the screen in `react-native/App.tsx` (or wherever the navigator lives — discover, don't assume).

---

## Workflow

### Step 1 — gather inputs

Before writing anything, confirm with the user:

- **Screen name** (PascalCase, no `Screen` suffix — e.g. `Streaks`, not `StreaksScreen`).
- **Navigation slot** — bottom tab? nested stack under Train/Coach/Arena? a modal? If unclear, default to "stack screen, user wires it later" and skip Step 4.
- **Data shape** — what does the screen render? (one entity, a list, dashboard cards…). Use this to pick a sensible default for the hook's mock data and types.
- **Mutations?** — read-only screen, or does it write? If writes, the hook needs `useMutations.ts` integration (`apiMutate`, never direct fetch).

If the user gives a one-liner ("scaffold a Streaks screen"), pick reasonable defaults and call them out before generating, so they can correct in one round.

### Step 2 — verify it doesn't already exist

```bash
ls react-native/screens/<Name>Screen.tsx react-native/hooks/use<Name>Data.ts 2>/dev/null
```

If either exists, **stop**. CLAUDE.md rule: never recreate. Read the existing file and propose an edit instead.

### Step 3 — write the two files

Use the templates in [`templates/screen.tsx.tmpl`](templates/screen.tsx.tmpl) and [`templates/hook.ts.tmpl`](templates/hook.ts.tmpl). Substitutions:

- `__NAME__` → PascalCase name (e.g. `Streaks`)
- `__name__` → camelCase name (e.g. `streaks`)
- `__NAME_LOWER__` → kebab-case path segment for the API route (e.g. `streaks`)

After substitution, **read the generated screen and verify** none of these patterns appear:

| Banned                                  | Reason (CLAUDE.md hard rule)              |
| --------------------------------------- | ----------------------------------------- |
| `#[0-9a-fA-F]{3,8}` literal             | NEVER hardcode hex — use `colors.*`       |
| `from '@expo/vector-icons'`             | lucide-react-native only                  |
| `from 'react-native/Libraries/Storage'` | MMKV via `lib/storage.ts` only            |
| `AsyncStorage`                          | MMKV via `lib/storage.ts` only            |
| `expo-router`                           | React Navigation only                     |
| `color: '#fff'` on a teal background    | Dark text on primary — never white        |
| `minHeight: <44`                        | Touch targets ≥44 (48 primary, 56 CTA)    |
| direct `fetch(`                         | Mutations go through `apiMutate` → queue  |

If any banned pattern slipped in (template drift), fix before reporting done.

### Step 4 — offer to register

Find the navigator:

```bash
grep -RIn "createBottomTabNavigator\|createNativeStackNavigator" react-native/ --include="*.tsx" --include="*.ts"
```

Show the user where it would go and ask before editing. Do not auto-edit navigation files — too easy to break tab order (CLAUDE.md fixes the 5-tab order: Home, Train, Calendar, Coach, Arena).

### Step 5 — report

One-line summary:
- files created (with `path:line` for the entry points),
- which navigator slot was registered (or "register manually — see step 4"),
- next steps the user owns: "fill in the API route in `useXData.ts:N` and the empty/error copy on `XScreen.tsx:N`."

---

## Conventions to match (already encoded in templates)

- Imports from `../theme` only: `colors`, `spacing`, `borderRadius`, `typography`, `touchTarget`. Real token names: `colors.primary`, `colors.primaryFg` (dark text on teal), `colors.card`, `colors.destructive`, `colors.foreground`, `typography.fontSize.*`, `typography.fontWeight.*`, `touchTarget.{min,comfortable,workout}`.
- `type ScreenState = 'loading' | 'success' | 'empty' | 'error';` derived in a `useMemo`.
- Lucide icons (`AlertCircle`, `Inbox`, etc.) for error/empty states.
- Hook uses `useCachedQuery` (reads) — never `useQuery` directly. Mutations go via `useMutations` so they enter the offline sync queue.
- `hasApiConfig` guard with mock data fallback — same shape as `useCalendarData.ts`.
- Touch targets via `touchTarget.min` (44, list rows), `touchTarget.comfortable` (48, primary buttons), `touchTarget.workout` (56, workout CTAs). Never magic numbers.
- Dark text (`colors.primaryFg` = `#000000`) on `colors.primary` (teal) — never `colors.foreground` on teal.
- Weights in kg, durations in seconds — only convert in `displayWeight()`/`formatDuration()` at render time. Don't store converted values in state.

---

## Anti-patterns — refuse to scaffold these

- A screen that asks the user to manually log **steps**. Steps come from native health APIs only (CLAUDE.md). Redirect to using `expo-health` integration instead.
- A V2 feature: tree biomes/species, Squad Forests, Nexus Seed economy, global Arena, background GPS, full macro tracking, paywalls. Tell the user this is V2 and stop.
- A screen that bypasses the sync queue for a write. Always route mutations through `useMutations.ts`.
