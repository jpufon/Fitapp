// waliFit Color System - Dark Theme
export const colors = {
  // Background/Surfaces
  background: '#0a0f0f',
  card: '#141818',
  popover: '#1a1f1f',
  secondary: '#1a1f1f',
  muted: '#1f2525',
  border: '#2a2f2f',

  // Text
  foreground: '#e5e7eb',
  mutedForeground: '#9ca3af',

  // Brand - Emerald (Vitality/Growth)
  primary: '#10b981',
  primaryFg: '#000000', // dark text on emerald — CLAUDE.md hard rule
  vitalityLight: '#34d399',
  vitalityDark: '#059669',

  // Energy - Amber/Gold (Achievement)
  energy: '#fbbf24',
  energyGlow: '#f59e0b',

  // Earthy (Tree Growth States)
  earthBrown: '#92400e',
  earthAmber: '#f59e0b',
  earthSage: '#84cc16',

  // Accents
  blue: '#60a5fa',
  blueGlow: '#3b82f6',
  purple: '#a78bfa',
  purpleGlow: '#8b5cf6',
  pink: '#f472b6',

  // Utility
  destructive: '#ef4444',
  white: '#ffffff',
  black: '#000000',
  overlay: 'rgba(0,0,0,0.7)', // modal scrim
  blueFg: '#0B0E14',          // dark text on blue (companion to primaryFg)
  runBackground: '#050A0A',   // active run full-screen
  mapSurface: '#0D1117',      // map placeholder background
  silverMedal: '#94a3b8',     // 2nd-place medal
  bronzeMedal: '#c2410c',     // 3rd-place medal
  googleBrand: '#4285F4',     // Google Sign In brand requirement
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  screen: 20, // standard horizontal page padding
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

// Alias for scaffold specs that import `radius`; adds `full` for pill buttons.
export const radius = {
  ...borderRadius,
  full: 9999,
};

// Touch target sizes — CLAUDE.md: min 44, primary actions 48, workout CTAs 56.
export const touchTarget = {
  min: 44,
  comfortable: 48,
  workout: 56,
};

export const typography = {
  // Using system fonts that match our web fonts
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
    mono: 'Courier',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  } as const,
  // Aliases for scaffold specs that import `typography.size` / `typography.weight`.
  size: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  weight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  } as const,
};
