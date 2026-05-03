/**
 * Runtime surface resolution — Option A (user appearance) + Option B (UI mode).
 * Brand / pillar / badge / system colors stay in theme.colors.js (semantic map).
 *
 * Precedence (highest wins for surfaces only):
 * 1. uiMode === 'workout'  → dark workout shell (always)
 * 2. uiMode === 'recovery' → cream recovery shell
 * 3. uiMode === 'analytics'→ cool light-grey analytics shell
 * 4. else → appearance: light | dark | system (resolved with systemColorScheme)
 *
 * @see docs/waliFit_Theme_Precedence.md
 */

import { colors } from '../theme.colors';

export type AppearancePreference = 'light' | 'dark' | 'system';

/** Route-driven or feature-driven shell; 'default' uses appearance only. */
export type UiSurfaceMode = 'default' | 'workout' | 'recovery' | 'analytics';

/** Subset of palette that should respond to appearance / UI mode. */
export type SurfaceTokens = {
  background: string;
  backgroundAlt: string;
  card: string;
  popover: string;
  muted: string;
  border: string;
  overlay: string;
  foreground: string;
  mutedForeground: string;
  /** Tab bars / chips — maps to popover in dark, soft fill in light */
  secondary: string;
};

export type ResolvedSurfaceTheme = {
  surfaces: SurfaceTokens;
  /** Expo StatusBar: icons/text on status bar */
  statusBarStyle: 'light' | 'dark';
  /** User appearance after resolving "system" (informational). */
  effectiveColorScheme: 'light' | 'dark';
  /** Whether current shell came from uiMode (B) or appearance (A). */
  surfaceSource: 'appearance' | 'mode';
};

function darkSurfacesFromPalette(): SurfaceTokens {
  return {
    background: colors.background,
    backgroundAlt: colors.backgroundAlt,
    card: colors.card,
    popover: colors.popover,
    muted: colors.muted,
    border: colors.border,
    overlay: colors.overlay,
    foreground: colors.foreground,
    mutedForeground: colors.mutedForeground,
    secondary: colors.secondary,
  };
}

function lightSurfaces(): SurfaceTokens {
  // "Concrete & Chalk" — warm gritty day mode for hybrid athletes.
  // Avoids pure white; warm cream + ink + visible borders give weight.
  return {
    background: '#ECE6D8',
    backgroundAlt: '#DDD5C2',
    card: '#F4EFE3',
    popover: '#E6DFCC',
    muted: '#D8D1BD',
    border: '#B8AE94',
    overlay: 'rgba(26, 20, 16, 0.45)',
    foreground: '#1A1410',
    mutedForeground: '#5C534A',
    secondary: '#E6DFCC',
  };
}

function recoverySurfaces(): SurfaceTokens {
  return {
    background: '#ede8dc',
    backgroundAlt: '#e5dfd2',
    card: '#faf8f3',
    popover: '#f5f2eb',
    muted: '#e7e2d6',
    border: '#d6d3d1',
    overlay: 'rgba(28, 25, 23, 0.4)',
    foreground: '#1c1917',
    mutedForeground: '#78716c',
    secondary: '#f0ebe3',
  };
}

function analyticsSurfaces(): SurfaceTokens {
  return {
    background: '#eef1f4',
    backgroundAlt: '#e6eaef',
    card: '#ffffff',
    popover: '#f6f7f9',
    muted: '#e2e8f0',
    border: '#cbd5e1',
    overlay: 'rgba(15, 23, 42, 0.4)',
    foreground: '#0f172a',
    mutedForeground: '#64748b',
    secondary: '#f1f5f9',
  };
}

function relativeLuminance(hex: string): number {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!m) return 0;
  const chan = [m[1], m[2], m[3]].map((x) => {
    const v = parseInt(x, 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * chan[0] + 0.7152 * chan[1] + 0.0722 * chan[2];
}

export function statusBarStyleForSurfaces(surfaces: SurfaceTokens): 'light' | 'dark' {
  return relativeLuminance(surfaces.background) > 0.55 ? 'dark' : 'light';
}

/**
 * Surfaces only for a dedicated UI mode (design: workout / recovery / analytics).
 * Does not apply user light/dark — callers merge with `resolveSurfaces` rules.
 */
export function getThemeForMode(mode: UiSurfaceMode): SurfaceTokens | null {
  switch (mode) {
    case 'workout':
      return darkSurfacesFromPalette();
    case 'recovery':
      return recoverySurfaces();
    case 'analytics':
      return analyticsSurfaces();
    case 'default':
    default:
      return null;
  }
}

function resolveEffectiveScheme(
  appearance: AppearancePreference,
  systemColorScheme: 'light' | 'dark' | null | undefined,
): 'light' | 'dark' {
  if (appearance === 'system') {
    return systemColorScheme === 'light' ? 'light' : 'dark';
  }
  return appearance;
}

/**
 * Full resolution: UI mode overrides user appearance for surfaces (Option B),
 * except when uiMode is `default` (Option A only).
 */
export function resolveSurfaces(input: {
  appearance: AppearancePreference;
  systemColorScheme: 'light' | 'dark' | null | undefined;
  uiMode: UiSurfaceMode;
}): ResolvedSurfaceTheme {
  const effectiveColorScheme = resolveEffectiveScheme(input.appearance, input.systemColorScheme);

  let surfaces: SurfaceTokens;
  let surfaceSource: 'appearance' | 'mode';

  if (input.uiMode === 'workout') {
    surfaces = getThemeForMode('workout')!;
    surfaceSource = 'mode';
  } else if (input.uiMode === 'recovery') {
    surfaces = getThemeForMode('recovery')!;
    surfaceSource = 'mode';
  } else if (input.uiMode === 'analytics') {
    surfaces = getThemeForMode('analytics')!;
    surfaceSource = 'mode';
  } else {
    surfaces = effectiveColorScheme === 'light' ? lightSurfaces() : darkSurfacesFromPalette();
    surfaceSource = 'appearance';
  }

  return {
    surfaces,
    statusBarStyle: statusBarStyleForSurfaces(surfaces),
    effectiveColorScheme,
    surfaceSource,
  };
}
