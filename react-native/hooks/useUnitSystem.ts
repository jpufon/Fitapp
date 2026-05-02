// Read the user's unit-system preference. Backed by GET /home (already cached
// in MMKV via useHomeSnapshot) so this is free anywhere downstream of it.
//
// Default falls back to 'metric' until the server response lands — matches the
// schema default and avoids a flash of imperial UI for a kg-first user.

import type { UnitSystem } from 'walifit-shared';
import { useHomeSnapshot } from './useHomeData';

export function useUnitSystem(): UnitSystem {
  const { data } = useHomeSnapshot();
  return data?.unitSystem ?? 'metric';
}
