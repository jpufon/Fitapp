# waliFit theme precedence (appearance + UI mode)

This document is the **single rule** for how shells (backgrounds, cards, borders, primary text on page) combine with **semantic** colors (pillars, badges, success/warning/error, brand teal).

## Layers

| Layer | Source | Persisted | Purpose |
|--------|--------|-----------|---------|
| **Semantic** | `theme.colors.js` | n/a | Steps/protein/hydration, badges, buttons, errors — stable across shells |
| **Appearance (Option A)** | User: Dark / Light / System | MMKV `theme.appearance` | Default page shell when no route override |
| **UI mode (Option B)** | Route / feature (`ThemeRouteSync` + `setUiMode`) | no | Temporary shell for workout, analytics, recovery |

## Precedence (surfaces only)

When resolving `surfaces` (see `theme/surfaceTheme.ts` → `resolveSurfaces`):

1. **`workout`** — dark production shell (same tokens as current default dark). **Overrides** user Light/System while the Active Workout stack screen is focused.
2. **`recovery`** — cream-tinted shell. Used when `uiMode === 'recovery'` (wire when a recovery hub screen exists).
3. **`analytics`** — cool light-grey shell. Active when stack route **`Analytics`** is focused.
4. **`default`** — user appearance: **Dark**, **Light**, or **System** (follows OS). Light values align with design tokens doc (`#f7f7f5` background, etc.).

**Both Option A and B apply:** default experience follows settings; specific flows replace **only** the surface layer until you leave that route.

## Status bar

`statusBarStyle` is derived from **luminance of `surfaces.background`** (`statusBarStyleForSurfaces`) so icons stay readable.

## Code map

| Piece | Location |
|--------|-----------|
| Resolver + types | `react-native/theme/surfaceTheme.ts` |
| React context + MMKV | `react-native/theme/ThemeProvider.tsx` |
| Stack route → `uiMode` | `react-native/theme/ThemeRouteSync.tsx` |
| User control | Settings → Preferences → **Appearance** |
| Wired surfaces (incremental) | `App.tsx` (boot, tab bar, status bar), `SettingsScreen.tsx` |

## Automated tests

```bash
cd Fitapp/react-native && npm test
```

Tests live beside the resolver: `theme/surfaceTheme.test.ts` (Vitest, no device).

## QA checklist (manual / agent)

1. **Appearance Dark** — open Settings: dark shell; restart app; still dark.
2. **Appearance Light** — Settings and Boot use light greys; status bar icons dark.
3. **Appearance System** — toggle OS light/dark; app shell follows (when on `default` uiMode).
4. **Workout override** — set Appearance **Light**, start **Active Workout**: shell returns to dark until you dismiss the workout.
5. **Analytics override** — from Profile stack open **Analytics**: shell uses analytics light-grey until you go back.
6. **Semantic unchanged** — primary buttons / teal accents still read as brand on light shell (uses `colors.primary`, not surface text).

## Extending

- New route-driven mode: extend `routeNameToUiMode` in `ThemeRouteSync.tsx`.
- New screen using surfaces: call `useWalifitTheme()` and use `surfaces.*` for page chrome; keep `colors.*` for brand and system semantics.
