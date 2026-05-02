// waliFit color palette — single source of truth for both theme.ts and tailwind.config.js.
// Plain CommonJS so Tailwind config can require it directly without a TS toolchain.
// v3.1 — visibly refreshed production fitness palette.

const colors = {
  // Base surfaces
  background: '#071111',
  backgroundAlt: '#030707',
  card: '#101818',
  popover: '#152020',
  muted: '#213232',
  border: '#315050',
  overlay: 'rgba(0,0,0,0.7)',

  // Text
  foreground: '#f3f7f7',
  mutedForeground: '#a6b3b3',
  inverseText: '#000000',

  // Brand — Vitality
  primary: '#14D6D3',
  primaryDark: '#087371',
  primaryLight: '#67E8E5',
  primaryFg: '#031A1A',

  // Core fitness system colors
  energy: '#F97316',
  hydration: '#38BDF8',
  growth: '#A3E635',

  // Gamification
  earth: {
    brown: '#92400e',
    sage: '#A3E635',
    amber: '#F97316',
  },

  // Secondary accents
  accent: {
    blue: '#2563EB',
    purple: '#A855F7',
  },

  // Badge system
  badge: {
    iron: '#6b7280',
    bronze: '#D97706',
    silver: '#94a3b8',
    gold: '#fbbf24',
    legendary: '#C084FC',
  },

  // System states
  success: '#22c55e',
  warning: '#F97316',
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
colors.earthBrown = colors.earth.brown;
colors.earthAmber = colors.earth.amber;
colors.earthSage = colors.earth.sage;
colors.blue = colors.hydration;
colors.blueGlow = colors.accent.blue;
colors.blueFg = '#0B0E14';
colors.purple = colors.accent.purple;
colors.purpleGlow = colors.accent.purple;
colors.pink = '#f472b6';
colors.badgeIron = colors.badge.iron;
colors.badgeBronze = colors.badge.bronze;
colors.badgeSilver = colors.badge.silver;
colors.badgeGold = colors.badge.gold;
colors.badgeLegendary = colors.badge.legendary;
colors.runBackground = colors.backgroundAlt;
colors.silverMedal = colors.badge.silver;
colors.bronzeMedal = colors.badge.bronze;
colors.googleBrand = colors.google;

const pillarColors = {
  steps: colors.primary,
  protein: colors.energy,
  hydration: colors.hydration,
};

const gradients = {
  primary: ['#14D6D3', '#087371'],
  energy: ['#FDBA74', '#F97316'],
  hydration: ['#38BDF8', '#2563EB'],
};

module.exports = { colors, pillarColors, gradients };
