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
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
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
};
