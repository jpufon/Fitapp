// waliFit color palette — single source of truth for both theme.ts and tailwind.config.js.
// Plain CommonJS so Tailwind config can require it directly without a TS toolchain.
// v3.0 — refined for production fitness UX + scalability.

const colors = {
  // Base surfaces
  background: '#0a0f0f',
  backgroundAlt: '#050A0A',
  card: '#161b1b',
  popover: '#1a1f1f',
  muted: '#1f2525',
  border: '#2f3636',
  overlay: 'rgba(0,0,0,0.7)',

  // Text
  foreground: '#ececec',
  mutedForeground: '#9ca3af',
  inverseText: '#000000',

  // Premium neutrals
  cream: '#F4EFE3',
  creamMuted: '#CFC6B5',
  greyLight: '#D1D5DB',
  greySoft: '#B8C0C0',
  greyDim: '#6B7373',

  // Brand — Vitality
  primary: '#0BBFBD',
  primaryDark: '#0D6D6B',
  primaryLight: '#3FD9D7',
  primaryFg: '#002f2f',

  // Core fitness system colors
  energy: '#f59e0b',
  hydration: '#60a5fa',
  growth: '#84cc16',

  // Gamification
  earth: {
    brown: '#92400e',
    sage: '#84cc16',
    amber: '#f59e0b',
  },

  // Earthy surfaces — for the Vitality Tree card backdrop in light mode.
  // Sand → clay → moss gradient evokes living soil under the tree.
  earthSand: '#D4C5A0',
  earthClay: '#C1A788',
  earthMoss: '#A89E7A',

  // Secondary accents
  accent: {
    blue: '#3b82f6',
    purple: '#8b5cf6',
  },

  // Badge system
  badge: {
    iron: '#6b7280',
    bronze: '#c2410c',
    silver: '#94a3b8',
    gold: '#fbbf24',
    legendary: '#a78bfa',
  },

  // System states
  success: '#22c55e',
  warning: '#f59e0b',
  destructive: '#ef4444',

  // External branding
  google: '#4285F4',

  // Utility
  white: '#ffffff',
  black: '#000000',

  // Special surfaces
  mapSurface: '#0D1117',
};

// Backward-compatible aliases used across existing screens/components.
colors.secondary = colors.popover;
colors.vitalityLight = colors.primaryLight;
colors.vitalityDark = colors.primaryDark;
colors.energyGlow = colors.warning;
colors.earthAmber = colors.earth.amber;
colors.earthSage = colors.earth.sage;
colors.blue = colors.hydration;
colors.blueFg = '#0B0E14';
colors.purple = colors.accent.purple;
colors.runBackground = colors.backgroundAlt;
colors.silverMedal = colors.badge.silver;
colors.bronzeMedal = colors.badge.bronze;
colors.googleBrand = colors.google;
colors.premiumText = colors.cream;
colors.secondaryText = colors.greySoft;
colors.disabledText = colors.greyDim;

const pillarColors = {
  steps: colors.primary,
  protein: colors.energy,
  hydration: colors.hydration,
};

const gradients = {
  primary: ['#0BBFBD', '#0D6D6B'],
  energy: ['#fbbf24', '#f59e0b'],
  hydration: ['#60a5fa', '#3b82f6'],
};

module.exports = { colors, pillarColors, gradients };
