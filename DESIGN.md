# waliFit — Design System
Generated from: Zip file design prototype (April 2026)
Source of truth for all UI decisions. Claude Code reads this before building any screen.

---

## Identity
waliFit is a Hybrid Athlete OS. The emotional core is the Vitality Tree — a living
visual that grows when you take care of yourself. The app feels athletic, premium,
and alive. Not sterile. Not generic.

The tree IS the primary color. Teal (`#0BBFBD`) unifies the app shell and the tree.
The current production palette is v3.0, with structured token groups in
`react-native/theme.colors.js`.

---

## Color Tokens

| Role | Name | Hex | Used for |
|------|------|-----|----------|
| Background | Deep Charcoal | `#0a0f0f` | Main app canvas — every screen |
| Surface | Card Dark | `#161b1b` | Cards, workout modules, list items |
| Surface High | Popover | `#1a1f1f` | Modals, bottom sheets, dropdowns |
| Muted | Muted Surface | `#1f2525` | Disabled states, secondary surfaces |
| Border | Default Border | `#2f3636` | All borders — 0.5px weight |
| Primary | Vitality Teal | `#0BBFBD` | Buttons, active nav, tree, completion |
| Primary Light | Teal Light | `#3FD9D7` | Hover states, progress fills |
| Primary Dark | Teal Deep | `#0D6D6B` | Pressed states, points/status/header blocks |
| Text on Primary | — | `#002f2f` | ALWAYS dark on teal — never white |
| Steps Pillar | Teal | `#0BBFBD` | Steps progress ring (matches primary) |
| Protein Pillar | Amber | `#f59e0b` | Protein progress ring |
| Hydration Pillar | Blue | `#60a5fa` | Hydration progress ring |
| Growth | Recovery Green | `#84cc16` | Recovery, health, growth states |
| Energy | Amber | `#f59e0b` | Streaks, effort, warnings |
| Accent Purple | Purple | `#8b5cf6` | Arena, squad, social features |
| Data | Blue | `#60a5fa` | Analytics, charts, running stats |
| Destructive | Crimson | `#ef4444` | Errors, stop actions, wilting tree |
| Text Primary | Steel White | `#ececec` | All body text |
| Text Secondary | Gray | `#9ca3af` | Timestamps, hints, labels |
| Badge Iron | Gray | `#6b7280` | Iron tier — entry badges |
| Badge Bronze | Bronze | `#c2410c` | Bronze tier — consistency |
| Badge Silver | Silver | `#94a3b8` | Silver tier — performance |
| Badge Gold | Gold | `#fbbf24` | Gold tier — elite |
| Badge Legendary | Purple | `#a78bfa` | Legendary tier — apex (most never see) |

---

## Spacing Scale (4pt grid)

| Token | Value | Use |
|-------|-------|-----|
| xs | 4px | Micro gaps: icon-to-label, badge padding |
| sm | 8px | Tight internal gaps: between set rows |
| md | 16px | Base unit: card padding, list item padding |
| lg | 24px | Section gaps between cards |
| xl | 32px | Above section headers |
| xxl | 48px | Hero sections, onboarding screens |
| screen | 20px | Horizontal edge padding on every screen |

---

## Border Radius

| Token | Value | Use |
|-------|-------|-----|
| sm | 8px | Chips, exercise tags |
| md | 12px | Buttons, inputs |
| lg | 16px | Cards, modules |
| xl | 20px | Bottom sheets |
| xxl | 24px | Hero sections |
| full | 9999px | Pill buttons, streak tags |

---

## Touch Targets
- Minimum: 44pt (Apple HIG)
- Comfortable: 48dp (Google Material)
- Large: 56pt (workout logging — sweaty hands)

Every tappable element must have `minHeight: 44`.

---

## Typography

| Size | px | Use |
|------|----|-----|
| xs | 12 | Timestamps, legal |
| sm | 14 | Secondary labels |
| base | 16 | Body text |
| lg | 18 | Card titles |
| xl | 20 | Screen titles |
| 2xl | 24 | Feature headings |
| 3xl | 30 | Stat numbers (streak, score) |
| 4xl | 36 | Hero numbers (PR weight, WaliRun distance, Vitality score) |

Headings: Outfit Bold (web) / System Bold (mobile until fonts configured)
Body: Plus Jakarta Sans (web) / System (mobile)
Monospace: JetBrains Mono — for stats, data, metrics only

---

## Component Patterns

### Cards
- Background: `#161b1b`
- Border: `0.5px solid #2f3636`
- Radius: 16px (lg)
- Padding: 16px (md)

### Primary Button
- Background: `#0BBFBD` (primary teal)
- Text: `#002f2f` (NEVER white on teal)
- Radius: 999px (pill)
- Height: 48px (comfortable touch target)
- Font: 15px semibold

### Ghost Button
- Background: transparent
- Border: `0.5px solid rgba(236,236,236,0.25)` (foreground 25%)
- Text: `#ececec`
- Same radius and height as primary

### Destructive Button
- Background: `#ef4444`
- Text: `#ffffff`
- Only for irreversible actions (delete account, stop workout)

### Input Field
- Background: `#1a1f1f`
- Border default: `0.5px solid #2f3636`
- Border focus: `1px solid #0BBFBD`
- Text: `#ececec`
- Placeholder: `#9ca3af`
- Radius: 12px (md)
- Height: 48px

### Progress Ring (Vitality Tree pillars)
- Track: background surface at 20% opacity of the pillar color
- Fill: pillar color at full opacity
- Width: 4px stroke
- Rounded caps

### Bottom Navigation
- Background: `#161b1b` + `border-top: 0.5px solid #2f3636`
- Height: 70px
- Active icon + label: `#0BBFBD` (primary)
- Inactive icon + label: `#9ca3af`
- Label: 11px, 600 weight, 0.3 letter spacing

---

## Screen Patterns

### Home screen (tree hero)
The tree takes the full upper portion of the screen. No competing visual elements
above the fold. Pillar cards sit below the tree. Today's workout card below that.

### Active workout (full-screen modal)
Cannot be accidentally dismissed. gestureEnabled: false. Owns the full screen.
Rest timer as a persistent bottom sheet — never leaves the screen.

### Arena feed
Auto-generated posts only. No manual posting. Each post type has its own
accent color: PRs use primary, runs use blue, streaks use energy, badges use purple.

---

## Vitality Tree

### States (6 total, V1)
| State | Score | Color |
|-------|-------|-------|
| Wilted | 0–15 | #ef4444 |
| Recovering | 16–35 | #f59e0b |
| Sprout | 36–55 | #84cc16 |
| Growing | 56–75 | #3FD9D7 |
| Thriving | 76–90 | #0BBFBD |
| Full Vitality | 91–100 | #0D6D6B |

### Pillars
| Pillar | Weight | Color | Source |
|--------|--------|-------|--------|
| Steps | 40% | #0BBFBD | Apple Health / Google Fit (automatic) |
| Protein | 30% | #f59e0b | Manual log |
| Hydration | 30% | #60a5fa | Manual log |

### V1 scope
Single tree visual. No species/biomes. No seeds. No squad forest.
Animations: idle sway (subtle), state transition (smooth, not snap).
Uses Lottie for illustration-based animations.
