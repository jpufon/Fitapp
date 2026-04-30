// waliFit color palette — single source of truth for both theme.ts and tailwind.config.js.
// Plain CommonJS so Tailwind config can require it directly without a TS toolchain.
// v2.1 Teal Palette · spec: docs/waliFit_Design_Tokens.md

const colors = {
  // Background/Surfaces
  background: '#0a0f0f',
  card: '#181c1c',
  popover: '#1a1f1f',
  secondary: '#1a1f1f',
  muted: '#1f2525',
  border: '#2a2f2f',

  // Text
  foreground: '#ececec',
  mutedForeground: '#9ca3af',

  // Brand — Teal (Vitality / Growth)
  primary: '#0BBFBD',
  primaryDark: '#0D6D6B',
  primaryFg: '#000000',
  vitalityLight: '#3FD9D7',
  vitalityDark: '#0D6D6B',

  // Energy - Amber/Gold
  energy: '#fbbf24',
  energyGlow: '#f59e0b',

  // Earthy (Tree growth state accents)
  earthBrown: '#92400e',
  earthAmber: '#f59e0b',
  earthSage: '#84cc16',

  // Accents
  blue: '#60a5fa',
  blueGlow: '#3b82f6',
  blueFg: '#0B0E14',
  purple: '#a78bfa',
  purpleGlow: '#8b5cf6',
  pink: '#f472b6',

  // Badge tiers
  badgeIron:      '#6b7280',
  badgeBronze:    '#b45309',
  badgeSilver:    '#9ca3af',
  badgeGold:      '#fbbf24',
  badgeLegendary: '#a78bfa',

  // Utility
  destructive: '#ef4444',
  white: '#ffffff',
  black: '#000000',
  overlay: 'rgba(0,0,0,0.7)',
  runBackground: '#050A0A',
  mapSurface: '#0D1117',
  silverMedal: '#94a3b8',
  bronzeMedal: '#c2410c',
  googleBrand: '#4285F4',
};

// Vitality Tree pillar colors — steps tracks primary
const pillarColors = {
  steps:     '#0BBFBD',
  protein:   '#f59e0b',
  hydration: '#60a5fa',
};

module.exports = { colors, pillarColors };
