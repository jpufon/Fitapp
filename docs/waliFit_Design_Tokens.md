# waliFit Design Tokens
## Teal Palette · Internal Reference · v2.1

---

## Palette Origin

The primary colour was updated from emerald `#10b981` to teal `#0BBFBD`, derived from the Sixty app design system. In v2.1 the card surface was softened from `#141818` to `#181c1c` and body text warmed from `#e5e7eb` to `#ececec` to reduce dark-mode harshness without breaking the dark identity. Both teal values have been validated on the dark background — `primaryFg` (`#000000`) is confirmed readable on both at all standard text sizes.

---

## Colour Tokens

### Primary

| Token | Value | Usage |
|---|---|---|
| `primary` | `#0BBFBD` | Bright teal — CTA buttons, Vitality Tree, progress rings, badges |
| `primaryDark` | `#0D6D6B` | Deep teal — points card, status card, challenge header blocks |
| `primaryFg` | `#000000` | **ALWAYS dark text on teal. Never white on primary.** |

### App Shell

| Token | Value | Usage |
|---|---|---|
| `background` | `#0a0f0f` | App shell — near black |
| `card` | `#181c1c` | Card surfaces, input backgrounds, list items (softened in v2.1) |

### Semantic

| Token | Value | Usage |
|---|---|---|
| `energy` | `#fbbf24` | Amber — streak fire, warnings, Legendary badge |
| `blue` | `#60a5fa` | Run data, pace metrics, WaliRun screens |
| `blueFg` | `#0B0E14` | Dark text on blue backgrounds |
| `purple` | `#a78bfa` | Legendary badge, future unlocks, epic achievements |
| `destructive` | `#ef4444` | Delete actions, error states, discard |

### Text

| Token | Value | Usage |
|---|---|---|
| `foreground` | `#ececec` | Primary text on dark background (warmed in v2.1) |
| `mutedForeground` | `#9ca3af` | Secondary text, timestamps, labels, placeholder |

### Utility

| Token | Value | Usage |
|---|---|---|
| `overlay` | `rgba(0,0,0,0.7)` | Modal scrims, bottom sheet backdrop |
| `googleBrand` | `#4285F4` | Google Sign In — brand requirement, never change |

### Badge Tier Colours

| Token | Value | Tier |
|---|---|---|
| `badgeIron` | `#6b7280` | Iron — entry tier |
| `badgeBronze` | `#b45309` | Bronze — consistency tier |
| `badgeSilver` | `#9ca3af` | Silver — performance tier |
| `badgeGold` | `#fbbf24` | Gold — elite tier |
| `badgeLegendary` | `#a78bfa` | Legendary — apex tier, most users never see this |

---

## Colour Usage Rules

### Primary Teal `#0BBFBD`

✅ CTA buttons — primary actions only, one per screen
✅ Vitality Tree fill and progress rings
✅ Active tab indicators
✅ Iron and Bronze badge outlines
✅ Teal text links

❌ Never as a background for white text — always use `primaryFg` (`#000000`) on primary
❌ Never on card (`#141818`) surfaces — too similar in dark mode

### Primary Dark `#0D6D6B`

✅ Points card, status card, credits card background (equivalent to Sixty "Employee credits" card)
✅ Header accent blocks within screens
✅ Challenge category header blocks

❌ Never as a button — too dark for a CTA

### Amber `#fbbf24`

✅ Streak counter and streak fire icon
✅ Gold badge tier and Legendary badge background
✅ Warning states

❌ Never for error states — use `destructive` (`#ef4444`)

### Purple `#a78bfa`

✅ Legendary badge exclusively
✅ Locked / future feature indicators

❌ Never for primary actions

---

## Spacing

```typescript
spacing.screen = 20   // standard horizontal padding
spacing.card   = 16   // internal card padding
spacing.tight  = 8    // between related elements
spacing.loose  = 24   // between sections
```

---

## Touch Targets

```typescript
touchTarget.min         = 44  // every tappable element — iOS HIG minimum
touchTarget.comfortable = 48  // primary actions
touchTarget.large       = 56  // workout CTAs, main tab actions
```

---

## Border Radius

```typescript
radius.sm   = 8
radius.md   = 12
radius.lg   = 16
radius.full = 9999
```

---

## Typography

All weights use system font — SF Pro on iOS, Roboto on Android.

| Scale | Size | Weight | Colour |
|---|---|---|---|
| `heading1` | 28 | 700 | `foreground` |
| `heading2` | 22 | 700 | `foreground` |
| `heading3` | 18 | 600 | `foreground` |
| `body` | 16 | 400 | `foreground` |
| `small` | 14 | 400 | `mutedForeground` |
| `micro` | 12 | 400 | `mutedForeground` |

---

## Full Token File

```typescript
export const colors = {
  primary:         '#0BBFBD',
  primaryDark:     '#0D6D6B',
  primaryFg:       '#000000',
  background:      '#0a0f0f',
  card:            '#181c1c',
  energy:          '#fbbf24',
  blue:            '#60a5fa',
  blueFg:          '#0B0E14',
  purple:          '#a78bfa',
  destructive:     '#ef4444',
  foreground:      '#ececec',
  mutedForeground: '#9ca3af',
  overlay:         'rgba(0,0,0,0.7)',
  googleBrand:     '#4285F4',
  badgeIron:       '#6b7280',
  badgeBronze:     '#b45309',
  badgeSilver:     '#9ca3af',
  badgeGold:       '#fbbf24',
  badgeLegendary:  '#a78bfa',
} as const

export const touchTarget = {
  min:         44,
  comfortable: 48,
  large:       56,
} as const

export const spacing = {
  screen: 20,
  card:   16,
  tight:  8,
  loose:  24,
} as const

export const radius = {
  sm:   8,
  md:   12,
  lg:   16,
  full: 9999,
} as const

export const typography = {
  heading1: { fontSize: 28, fontWeight: '700' },
  heading2: { fontSize: 22, fontWeight: '700' },
  heading3: { fontSize: 18, fontWeight: '600' },
  body:     { fontSize: 16, fontWeight: '400' },
  small:    { fontSize: 14, fontWeight: '400' },
  micro:    { fontSize: 12, fontWeight: '400' },
} as const
```

---

*waliFit Design Tokens · Teal Palette · v2.1 · Internal Reference*
