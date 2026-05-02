# waliFit Design Tokens
## Production Fitness Palette · Internal Reference · v3.0

`react-native/theme.colors.js` is the source of truth for color values.
`react-native/theme.ts` re-exports colors, pillar colors, gradients, spacing,
radius, typography, and touch targets for React Native screens.
`react-native/tailwind.config.js` maps the same color source into NativeWind.

---

## Palette Origin

The primary color remains vitality teal, now organized into a scalable v3.0
token system for fitness UX: three core system colors, two secondary accents,
nested gamification/badge groups, and gradients for polished UI surfaces.

---

## Color Tokens

### Base Surfaces

| Token | Value | Usage |
|---|---|---|
| `background` | `#0a0f0f` | Main app shell |
| `backgroundAlt` | `#050A0A` | Immersive run/focus mode surfaces |
| `card` | `#161b1b` | Cards, modules, list items |
| `popover` | `#1a1f1f` | Modals, sheets, dropdowns |
| `muted` | `#1f2525` | Disabled states, secondary surfaces |
| `border` | `#2f3636` | Borders and dividers |
| `overlay` | `rgba(0,0,0,0.7)` | Modal scrims |

### Text

| Token | Value | Usage |
|---|---|---|
| `foreground` | `#ececec` | Primary text |
| `mutedForeground` | `#9ca3af` | Secondary labels, timestamps, hints |
| `inverseText` | `#000000` | Dark text on light/high-chroma surfaces |

### Brand

| Token | Value | Usage |
|---|---|---|
| `primary` | `#0BBFBD` | CTAs, Vitality Tree, steps, active nav |
| `primaryDark` | `#0D6D6B` | Pressed states, header/status blocks |
| `primaryLight` | `#3FD9D7` | Highlights, progress fills |
| `primaryFg` | `#002f2f` | Text/icons on primary backgrounds |

### Core Fitness System

| Token | Value | Usage |
|---|---|---|
| `energy` | `#f59e0b` | Effort, calories, protein/nutrition |
| `hydration` | `#60a5fa` | Water, run data, pace metrics |
| `growth` | `#84cc16` | Recovery, health, positive growth |

### Nested Token Groups

```ts
colors.earth = {
  brown: '#92400e',
  sage: '#84cc16',
  amber: '#f59e0b',
}

colors.accent = {
  blue: '#3b82f6',
  purple: '#8b5cf6',
}

colors.badge = {
  iron: '#6b7280',
  bronze: '#c2410c',
  silver: '#94a3b8',
  gold: '#fbbf24',
  legendary: '#a78bfa',
}
```

### System and External

| Token | Value | Usage |
|---|---|---|
| `success` | `#22c55e` | Success states |
| `warning` | `#f59e0b` | Warning states |
| `destructive` | `#ef4444` | Errors, delete, stop actions |
| `google` | `#4285F4` | Google brand |
| `white` | `#ffffff` | Utility |
| `black` | `#000000` | Utility |
| `mapSurface` | `#0D1117` | Map/run mock surfaces |

---

## Pillar Colors

```ts
const pillarColors = {
  steps: colors.primary,
  protein: colors.energy,
  hydration: colors.hydration,
}
```

---

## Gradients

```ts
const gradients = {
  primary: ['#0BBFBD', '#0D6D6B'],
  energy: ['#fbbf24', '#f59e0b'],
  hydration: ['#60a5fa', '#3b82f6'],
}
```

Use gradients for high-emphasis surfaces such as progress rings, hero stat
cards, and primary buttons. Keep ordinary cards flat.

---

## Compatibility Aliases

The app still exposes legacy flat names so existing screens remain stable:

| Alias | Maps to |
|---|---|
| `secondary` | `popover` |
| `vitalityLight` | `primaryLight` |
| `vitalityDark` | `primaryDark` |
| `energyGlow` | `warning` |
| `earthBrown` / `earthAmber` / `earthSage` | `earth.*` |
| `blue` / `blueGlow` | `hydration` / `accent.blue` |
| `purple` / `purpleGlow` | `accent.purple` |
| `badgeIron` ... `badgeLegendary` | `badge.*` |
| `runBackground` | `backgroundAlt` |
| `googleBrand` | `google` |

New code should prefer the structured token names when practical.

---

## Spacing

```ts
spacing.xs = 4
spacing.sm = 8
spacing.md = 16
spacing.lg = 24
spacing.xl = 32
spacing.xxl = 48
spacing.screen = 20
```

---

## Touch Targets

```ts
touchTarget.min = 44
touchTarget.comfortable = 48
touchTarget.workout = 56
touchTarget.large = 56
```

---

## Border Radius

```ts
radius.sm = 8
radius.md = 12
radius.lg = 16
radius.xl = 20
radius.xxl = 24
radius.full = 9999
```

---

## Usage Rules

- Import tokens from `react-native/theme.ts`, not directly from `theme.colors.js`.
- Do not hardcode hex values in screens/components.
- Use `colors.primaryFg` on `colors.primary` backgrounds.
- Use `pillarColors` for rings, stat cards, and charts tied to steps/protein/hydration.
- Use nested `colors.badge.*`, `colors.earth.*`, and `colors.accent.*` for new work.

---

*waliFit Design Tokens · Production Fitness Palette · v3.0*
