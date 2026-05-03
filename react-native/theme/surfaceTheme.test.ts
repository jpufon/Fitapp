import { describe, expect, it } from 'vitest';
import {
  getThemeForMode,
  resolveSurfaces,
  statusBarStyleForSurfaces,
} from './surfaceTheme';

describe('resolveSurfaces', () => {
  it('uses light surfaces for appearance light when uiMode is default', () => {
    const r = resolveSurfaces({
      appearance: 'light',
      systemColorScheme: 'dark',
      uiMode: 'default',
    });
    expect(r.surfaces.background).toBe('#f7f7f5');
    expect(r.surfaceSource).toBe('appearance');
    expect(r.statusBarStyle).toBe('dark');
  });

  it('uses dark surfaces for appearance dark when uiMode is default', () => {
    const r = resolveSurfaces({
      appearance: 'dark',
      systemColorScheme: 'light',
      uiMode: 'default',
    });
    expect(r.surfaces.background.toLowerCase()).toBe('#0a0f0f');
    expect(r.surfaceSource).toBe('appearance');
    expect(r.statusBarStyle).toBe('light');
  });

  it('Option B: workout overrides user light appearance', () => {
    const r = resolveSurfaces({
      appearance: 'light',
      systemColorScheme: 'light',
      uiMode: 'workout',
    });
    expect(r.surfaces.background.toLowerCase()).toBe('#0a0f0f');
    expect(r.surfaceSource).toBe('mode');
    expect(r.statusBarStyle).toBe('light');
  });

  it('Option B: analytics shell overrides user dark appearance', () => {
    const r = resolveSurfaces({
      appearance: 'dark',
      systemColorScheme: 'dark',
      uiMode: 'analytics',
    });
    expect(r.surfaces.background).toBe('#eef1f4');
    expect(r.surfaceSource).toBe('mode');
    expect(r.statusBarStyle).toBe('dark');
  });

  it('system appearance follows OS when uiMode is default', () => {
    const light = resolveSurfaces({
      appearance: 'system',
      systemColorScheme: 'light',
      uiMode: 'default',
    });
    expect(light.surfaces.background).toBe('#f7f7f5');
    const dark = resolveSurfaces({
      appearance: 'system',
      systemColorScheme: 'dark',
      uiMode: 'default',
    });
    expect(dark.surfaces.background.toLowerCase()).toBe('#0a0f0f');
  });
});

describe('getThemeForMode', () => {
  it('returns null for default', () => {
    expect(getThemeForMode('default')).toBeNull();
  });

  it('returns recovery cream for recovery', () => {
    const s = getThemeForMode('recovery');
    expect(s).not.toBeNull();
    expect(s!.background).toBe('#ede8dc');
  });
});

describe('statusBarStyleForSurfaces', () => {
  it('picks dark icons on light background', () => {
    expect(
      statusBarStyleForSurfaces({
        background: '#ffffff',
        backgroundAlt: '#fff',
        card: '#fff',
        popover: '#fff',
        muted: '#eee',
        border: '#ccc',
        overlay: 'rgba(0,0,0,0.5)',
        foreground: '#000',
        mutedForeground: '#666',
        secondary: '#f5f5f5',
      }),
    ).toBe('dark');
  });
});
