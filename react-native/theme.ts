// waliFit theme tokens — spacing, radius, typography, touch targets.
// Color palette is sourced from theme.colors.js so Tailwind and TS share one truth.
// Spec: docs/waliFit_Design_Tokens.md (v3.0 production fitness palette)

import { colors, gradients, pillarColors } from './theme.colors';

export { colors, gradients, pillarColors };

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
  full: 9999,
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
  large: 56, // alias of workout — v2.0 token doc naming
};

// Bespoke component dimensions. Use these rather than raw numbers so
// VitalityTree (and friends) stay rule-compliant: no magic numbers in components.
export const componentSizes = {
  vitalityTree: {
    artFrameHeight: 236,
    glow: 220,
    scoreBadgeMinWidth: 78,
    scoreBadgeMinHeight: 72,
    pillarIcon: 30,
    pillarCopyMinHeight: 42,
    pillarBarHeight: 4,
  },
};

export const typography = {
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
