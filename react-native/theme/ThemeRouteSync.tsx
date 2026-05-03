import { useEffect } from 'react';
import { useNavigationState } from '@react-navigation/native';
import type { UiSurfaceMode } from './surfaceTheme';
import { useWalifitTheme } from './ThemeProvider';

/**
 * Maps focused stack route → UI surface mode (Option B).
 * Incremental: add routes here as screens adopt recovery/analytics shells.
 */
function routeNameToUiMode(routeName: string | undefined): UiSurfaceMode {
  if (routeName === 'ActiveWorkout') return 'workout';
  if (routeName === 'Analytics') return 'analytics';
  return 'default';
}

export function ThemeRouteSync() {
  const { setUiMode } = useWalifitTheme();
  const routeName = useNavigationState((state) => {
    if (!state?.routes?.length) return undefined;
    return state.routes[state.index]?.name;
  });

  useEffect(() => {
    setUiMode(routeNameToUiMode(routeName));
  }, [routeName, setUiMode]);

  return null;
}
