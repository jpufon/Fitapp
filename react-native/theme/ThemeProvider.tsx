import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';
import { getCachedJson, setCachedJson } from '../lib/storage';
import {
  type AppearancePreference,
  type ResolvedSurfaceTheme,
  type UiSurfaceMode,
  resolveSurfaces,
} from './surfaceTheme';

const STORAGE_KEY = 'theme.appearance';

type ThemeContextValue = ResolvedSurfaceTheme & {
  appearance: AppearancePreference;
  setAppearance: (next: AppearancePreference) => void;
  uiMode: UiSurfaceMode;
  setUiMode: (next: UiSurfaceMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredAppearance(): AppearancePreference {
  const raw = getCachedJson<string>(STORAGE_KEY);
  if (raw === 'light' || raw === 'dark' || raw === 'system') return raw;
  return 'dark';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [appearance, setAppearanceState] = useState<AppearancePreference>(readStoredAppearance);
  const [uiMode, setUiMode] = useState<UiSurfaceMode>('default');

  const setAppearance = useCallback((next: AppearancePreference) => {
    setAppearanceState(next);
    setCachedJson(STORAGE_KEY, next);
  }, []);

  const resolved = useMemo(
    () =>
      resolveSurfaces({
        appearance,
        systemColorScheme: systemColorScheme ?? 'dark',
        uiMode,
      }),
    [appearance, systemColorScheme, uiMode],
  );

  const value = useMemo<ThemeContextValue>(
    () => ({
      ...resolved,
      appearance,
      setAppearance,
      uiMode,
      setUiMode,
    }),
    [resolved, appearance, setAppearance, uiMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useWalifitTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useWalifitTheme must be used within ThemeProvider');
  }
  return ctx;
}
