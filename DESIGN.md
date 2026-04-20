# waliFit — Design System
Generated from: Zip file design prototype (April 2026)
Source of truth for all UI decisions. Claude Code reads this before building any screen.

---

## Identity
waliFit is a Hybrid Athlete OS. The emotional core is the Vitality Tree — a living
visual that grows when you take care of yourself. The app feels athletic, premium,
and alive. Not sterile. Not generic.

The tree IS the primary color. Emerald (#10b981) unifies the app shell and the tree.

---

## Color Tokens

| Role | Name | Hex | Used for |
|------|------|-----|----------|
| Background | Deep Charcoal | `#0a0f0f` | Main app canvas — every screen |
| Surface | Card Dark | `#141818` | Cards, workout modules, list items |
| Surface High | Popover | `#1a1f1f` | Modals, bottom sheets, dropdowns |
| Muted | Muted Surface | `#1f2525` | Disabled states, secondary surfaces |
| Border | Default Border | `#2a2f2f` | All borders — 0.5px weight |
| Primary | Vitality Emerald | `#10b981` | Buttons, active nav, tree, completion |
| Primary Light | Emerald Light | `#34d399` | Hover states, progress fills |
| Primary Dark | Emerald Dark | `#059669` | Pressed states |
| Text on Primary | — | `#000000` | ALWAYS dark on emerald — never white |
| Steps Pillar | Emerald | `#10b981` | Steps progress ring (matches primary) |
| Protein Pillar | Amber | `#f59e0b` | Protein progress ring |
| Hydration Pillar | Blue | `#60a5fa` | Hydration progress ring |
| Energy | Amber Gold | `#fbbf24` | Streaks, achievements, PRs |
| Social | Purple | `#a78bfa` | Arena, squad, social features |
| Data | Blue | `#60a5fa` | Analytics, charts, running stats |
| Destructive | Crimson | `#ef4444` | Errors, stop actions, wilting tree |
| Text Primary | Steel White | `#e5e7eb` | All body text |
| Text Secondary | Gray | `#9ca3af` | Timestamps, hints, labels |

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
| xs | 4px | Checkboxes, micro tags |
| sm | 8px | Chips, exercise tags |
| md | 12px | Buttons, inputs |
| lg | 16px | Cards, modules |
| xl | 20px | Bottom sheets |
| xxl | 24px | Hero sections |
| full | 999px | Pill buttons, streak tags |

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
| xs | 11 | Timestamps, legal |
| sm | 13 | Secondary labels |
| base | 15 | Body text |
| lg | 17 | Card titles |
| xl | 20 | Screen titles |
| 2xl | 24 | Feature headings |
| 3xl | 30 | Stat numbers (streak, score) |
| 4xl | 36 | Hero numbers (PR weight) |
| hero | 56 | WaliRun distance, Vitality score |

Headings: Outfit Bold (web) / System Bold (mobile until fonts configured)
Body: Plus Jakarta Sans (web) / System (mobile)
Monospace: JetBrains Mono — for stats, data, metrics only

---

## Component Patterns

### Cards
- Background: `#141818`
- Border: `0.5px solid #2a2f2f`
- Radius: 16px (lg)
- Padding: 16px (md)

### Primary Button
- Background: `#10b981` (primary)
- Text: `#000000` (NEVER white on emerald)
- Radius: 999px (pill)
- Height: 48px (comfortable touch target)
- Font: 15px semibold

### Ghost Button
- Background: transparent
- Border: `0.5px solid rgba(229,231,235,0.25)` (foreground 25%)
- Text: `#e5e7eb`
- Same radius and height as primary

### Destructive Button
- Background: `#ef4444`
- Text: `#ffffff`
- Only for irreversible actions (delete account, stop workout)

### Input Field
- Background: `#1a1f1f`
- Border default: `0.5px solid #2a2f2f`
- Border focus: `1px solid #10b981`
- Text: `#e5e7eb`
- Placeholder: `#9ca3af`
- Radius: 12px (md)
- Height: 48px

### Progress Ring (Vitality Tree pillars)
- Track: background surface at 20% opacity of the pillar color
- Fill: pillar color at full opacity
- Width: 4px stroke
- Rounded caps

### Bottom Navigation
- Background: `#141818` + `border-top: 0.5px solid #2a2f2f`
- Height: 70px
- Active icon + label: `#10b981` (primary)
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
| Growing | 56–75 | #34d399 |
| Thriving | 76–90 | #10b981 |
| Full Vitality | 91–100 | #059669 |

### Pillars
| Pillar | Weight | Color | Source |
|--------|--------|-------|--------|
| Steps | 40% | #10b981 | Apple Health / Google Fit (automatic) |
| Protein | 30% | #f59e0b | Manual log |
| Hydration | 30% | #60a5fa | Manual log |

### V1 scope
Single tree visual. No species/biomes. No seeds. No squad forest.
Animations: idle sway (subtle), state transition (smooth, not snap).
Uses Lottie for illustration-based animations.
