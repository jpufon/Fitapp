# waliFit — tailwind.config.js

> `apps/mobile/tailwind.config.js` — copy this file exactly

```javascript
// waliFit — Tailwind / NativeWind config
// All colors must match apps/mobile/theme.ts exactly.
// When theme.ts changes, update this file to match.
// Components use className="bg-background text-foreground" etc.

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{ts,tsx}',
    './screens/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './utils/**/*.{ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // ── Backgrounds ──────────────────────────────────────────
        background:  '#0a0f0f',   // Deep charcoal — main app canvas
        card:        '#141818',   // Elevated surfaces
        popover:     '#1a1f1f',   // Modals, bottom sheets
        secondary:   '#1a1f1f',   // Secondary surfaces
        muted:       '#1f2525',   // Muted surfaces
        border:      '#2a2f2f',   // Default borders

        // ── Text ─────────────────────────────────────────────────
        foreground:  '#e5e7eb',   // Primary text
        'muted-foreground': '#9ca3af', // Secondary text

        // ── Primary — Emerald (tree, actions, completion) ────────
        primary: {
          DEFAULT: '#10b981',
          light:   '#34d399',
          dark:    '#059669',
          fg:      '#000000',   // Text ON primary
        },

        // ── Vitality Tree pillars — one color per pillar ─────────
        pillar: {
          steps:     '#10b981',  // Emerald (matches primary)
          protein:   '#f59e0b',  // Amber
          hydration: '#60a5fa',  // Blue
        },

        // ── Energy — Amber / Achievements ────────────────────────
        energy: {
          DEFAULT: '#fbbf24',
          glow:    '#f59e0b',
        },

        // ── Data / Analytics / Running ───────────────────────────
        blue: {
          DEFAULT: '#60a5fa',
          glow:    '#3b82f6',
        },

        // ── Social / Arena / Squad ────────────────────────────────
        purple: {
          DEFAULT: '#a78bfa',
          glow:    '#8b5cf6',
        },

        // ── Utility ──────────────────────────────────────────────
        destructive: {
          DEFAULT: '#ef4444',  // Errors, stop, wilt
          fg:      '#ffffff',
        },
        success:  '#10b981',   // Same as primary
        pink:     '#f472b6',

        // ── Earthy (tree visual accents) ─────────────────────────
        earth: {
          brown:  '#92400e',
          amber:  '#f59e0b',
          sage:   '#84cc16',
        },
      },

      // ── Spacing — 4pt base grid ───────────────────────────────
      spacing: {
        'screen': '20px',  // Horizontal safe edge padding
      },

      // ── Border Radius ─────────────────────────────────────────
      borderRadius: {
        'xs':   '4px',
        'sm':   '8px',
        'md':   '12px',
        'lg':   '16px',
        'xl':   '20px',
        '2xl':  '24px',
      },

      // ── Font sizes ────────────────────────────────────────────
      fontSize: {
        'xs':   ['11px', { lineHeight: '16px' }],
        'sm':   ['13px', { lineHeight: '18px' }],
        'base': ['15px', { lineHeight: '22px' }],
        'lg':   ['17px', { lineHeight: '24px' }],
        'xl':   ['20px', { lineHeight: '28px' }],
        '2xl':  ['24px', { lineHeight: '32px' }],
        '3xl':  ['30px', { lineHeight: '36px' }],
        '4xl':  ['36px', { lineHeight: '44px' }],
        'hero': ['56px', { lineHeight: '64px' }],
      },
    },
  },
  plugins: [],
}
```
