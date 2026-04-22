# waliFit — theme.ts

> `apps/mobile/theme.ts` — copy this file exactly

```typescript
// waliFit — Master Design Tokens
// Source of truth: zip file palette (April 2026)
// Every color, spacing, and radius value in the app must import from here.
// NEVER hardcode hex values or spacing numbers in components.

// ─── Colors ──────────────────────────────────────────────────────────────────

export const colors = {
  // Backgrounds
  background:   '#0a0f0f',  // Deep charcoal — main app canvas
  card:         '#141818',  // Elevated surfaces — cards, modules
  popover:      '#1a1f1f',  // Modals, bottom sheets
  secondary:    '#1a1f1f',  // Secondary surfaces
  muted:        '#1f2525',  // Muted surfaces
  border:       '#2a2f2f',  // Default border

  // Text
  foreground:       '#e5e7eb',  // Primary text — Steel White
  mutedForeground:  '#9ca3af',  // Secondary text — hints, timestamps

  // Primary — Emerald (Vitality / Growth)
  // The tree IS this color. Used for: primary buttons, active nav,
  // workout completion, streak indicators, PRs.
  primary:        '#10b981',
  primaryLight:   '#34d399',
  primaryDark:    '#059669',
  primaryFg:      '#000000',  // Text ON primary — always dark

  // Vitality Tree pillars
  // Each pillar has one color. Never swap them.
  pillars: {
    steps:      '#10b981',  // Emerald — matches primary (40% tree weight)
    protein:    '#f59e0b',  // Amber  — nutrition / fuel  (30% tree weight)
    hydration:  '#60a5fa',  // Blue   — water / calm      (30% tree weight)
  },

  // Energy — Amber / Gold (achievements, streaks, PRs)
  energy:     '#fbbf24',
  energyGlow: '#f59e0b',

  // Data / Analytics / Running
  blue:     '#60a5fa',
  blueGlow: '#3b82f6',

  // Social / Arena / Squad
  purple:     '#a78bfa',
  purpleGlow: '#8b5cf6',

  // Accent
  pink: '#f472b6',

  // Earthy (tree growth states visual accents)
  earthBrown: '#92400e',
  earthAmber: '#f59e0b',
  earthSage:  '#84cc16',

  // Utility
  destructive:    '#ef4444',  // Errors, stop, wilting, failed sets
  destructiveFg:  '#ffffff',
  success:        '#10b981',  // Same as primary
  white:          '#ffffff',
  black:          '#000000',
} as const

export type ColorKey = keyof typeof colors

// ─── Spacing ─────────────────────────────────────────────────────────────────
// 4pt base grid. All values are multiples of 4.
// screen: consistent horizontal edge padding on all screens.

export const spacing = {
  none:   0,
  xs:     4,    // micro gaps — icon-to-label, badge padding
  sm:     8,    // tight internal — between set rows, list item gaps
  md:     16,   // base unit — card padding, list item padding
  lg:     24,   // section gaps — between cards
  xl:     32,   // generous section gaps — above section headers
  xxl:    48,   // hero breathing room — tree card, onboarding screens
  screen: 20,   // horizontal safe edge padding — used on every screen
} as const

// ─── Border Radius ───────────────────────────────────────────────────────────

export const radius = {
  xs:   4,    // micro — checkboxes, small tags
  sm:   8,    // chips, exercise tags, stat badges
  md:   12,   // buttons, inputs
  lg:   16,   // cards, workout modules
  xl:   20,   // bottom sheets, large cards
  xxl:  24,   // hero sections
  full: 999,  // pill buttons, streak tags, PR badges
} as const

// ─── Touch Targets ───────────────────────────────────────────────────────────
// Apple HIG: 44pt min. Google Material: 48dp comfortable.
// Apply minHeight: touchTarget.min to ALL tappable elements.

export const touchTarget = {
  min:         44,  // Apple HIG minimum — every interactive element
  comfortable: 48,  // Primary CTAs, log set buttons, nav tabs
  large:       56,  // Gym-proof — for use during workouts with sweaty hands
} as const

// ─── Typography ──────────────────────────────────────────────────────────────

export const typography = {
  fontFamily: {
    sans:  'System',   // Replace with 'PlusJakartaSans' after font setup
    mono:  'Courier',  // Replace with 'JetBrainsMono' after font setup
  },
  size: {
    xs:     11,   // timestamps, legal fine print
    sm:     13,   // secondary labels, captions
    base:   15,   // body text, list items
    lg:     17,   // card titles, section headers
    xl:     20,   // screen titles
    '2xl':  24,   // feature headings
    '3xl':  30,   // stat numbers (streak, score)
    '4xl':  36,   // hero numbers (PR weight, daily score)
    hero:   56,   // WaliRun distance display, Vitality score
  },
  weight: {
    regular:   '400' as const,
    medium:    '500' as const,
    semibold:  '600' as const,
    bold:      '700' as const,
    extrabold: '800' as const,
  },
  lineHeight: {
    tight:   1.2,
    snug:    1.35,
    normal:  1.5,
    relaxed: 1.7,
  },
} as const

// ─── Vitality Tree ───────────────────────────────────────────────────────────
// 6 states. Score range maps to state. Single tree visual in V1 (no biomes).
// Biomes (Oak / Willow / Bamboo etc.) are V2.

export const treeStates = {
  wilted:      { min: 0,  max: 15,  label: 'Wilted',       color: '#ef4444' },
  recovering:  { min: 16, max: 35,  label: 'Recovering',   color: '#f59e0b' },
  sprout:      { min: 36, max: 55,  label: 'Sprout',       color: '#84cc16' },
  growing:     { min: 56, max: 75,  label: 'Growing',      color: '#34d399' },
  thriving:    { min: 76, max: 90,  label: 'Thriving',     color: '#10b981' },
  fullVitality:{ min: 91, max: 100, label: 'Full Vitality',color: '#059669' },
} as const

export type TreeState = keyof typeof treeStates

export function getTreeState(score: number): TreeState {
  if (score <= 15)  return 'wilted'
  if (score <= 35)  return 'recovering'
  if (score <= 55)  return 'sprout'
  if (score <= 75)  return 'growing'
  if (score <= 90)  return 'thriving'
  return 'fullVitality'
}

// ─── Vitality Pillars ────────────────────────────────────────────────────────
// Steps: auto-synced from Apple Health / Google Fit — NEVER manual entry
// Protein: manual log (grams)
// Hydration: manual log (ml or glasses)

export const pillars = {
  steps: {
    weight: 0.40,
    color:  colors.pillars.steps,
    label:  'Steps',
    unit:   'steps',
    defaultTarget: 8000,
    source: 'healthkit',  // automatic — never ask user to enter
  },
  protein: {
    weight: 0.30,
    color:  colors.pillars.protein,
    label:  'Protein',
    unit:   'g',
    defaultTarget: 150,
    source: 'manual',
  },
  hydration: {
    weight: 0.30,
    color:  colors.pillars.hydration,
    label:  'Hydration',
    unit:   'ml',
    defaultTarget: 2500,
    source: 'manual',
  },
} as const

export type PillarKey = keyof typeof pillars

// ─── Streak Milestones ───────────────────────────────────────────────────────

export const streakMilestones = [7, 14, 30, 60, 100, 180, 365] as const

// ─── Navigation ──────────────────────────────────────────────────────────────
// 5 tabs in this exact order. Tab labels are final.

export const tabs = {
  home:     { label: 'Home',     icon: 'home' },
  train:    { label: 'Train',    icon: 'dumbbell' },
  calendar: { label: 'Calendar', icon: 'calendar' },
  coach:    { label: 'Coach',    icon: 'bot' },         // Wali AI
  arena:    { label: 'Arena',    icon: 'trophy' },
} as const

// ─── Units ───────────────────────────────────────────────────────────────────
// DB always stores in kg. UI converts on display via displayWeight().
// DB always stores durations in seconds. UI formats on display.

export const units = {
  weight: {
    metric:   { label: 'kg', factor: 1 },
    imperial: { label: 'lbs', factor: 2.20462 },
  },
  distance: {
    metric:   { label: 'km',   factor: 1 },
    imperial: { label: 'miles', factor: 0.621371 },
  },
} as const
```
