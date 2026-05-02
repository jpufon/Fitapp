// Exercise catalogue — read-only reference data seeded from wger.
// useCachedQuery primes MMKV on first launch so the library is available offline
// from then on. Refresh happens in the background whenever connectivity returns.

import { useMemo } from 'react';
import { useCachedQuery } from './useCachedQuery';
import { apiQuery, hasApiConfig } from '../lib/api';

export type Exercise = {
  id: string;
  wgerId: number | null;
  name: string;
  category: string;             // "strength" | "cardio" | ...
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipment: string[];
  instructions: string | null;
  movementType: string | null;
};

type ExerciseListResponse = {
  items: Array<{
    id: string;
    wgerId: number | null;
    name: string;
    category: string;
    primaryMuscles?: string[] | null;
    secondaryMuscles?: string[] | null;
    equipment?: string[] | null;
    instructions?: string | null;
    movementType?: string | null;
  }>;
  count: number;
  version: string | null;
};

function normalize(rows: ExerciseListResponse['items']): Exercise[] {
  return rows.map((row) => ({
    id: row.id,
    wgerId: row.wgerId ?? null,
    name: row.name,
    category: row.category,
    primaryMuscles: row.primaryMuscles ?? [],
    secondaryMuscles: row.secondaryMuscles ?? [],
    equipment: row.equipment ?? [],
    instructions: row.instructions ?? null,
    movementType: row.movementType ?? null,
  }));
}

export function useExerciseLibrary() {
  return useCachedQuery<Exercise[]>({
    queryKey: ['exercises', 'all'],
    cacheKey: 'query.exercises.all',
    queryFn: async () => {
      const res = await apiQuery<ExerciseListResponse>('/exercises?limit=2000');
      return normalize(res.items);
    },
    enabled: hasApiConfig,
    staleTime: 1000 * 60 * 60 * 24, // refresh once a day at most
  });
}

// Derived helper: list of unique primary-muscle labels for filter chips.
// Memoised by the caller via useMemo on top of the raw data.
export function useMuscleGroups(exercises: Exercise[] | undefined): string[] {
  return useMemo(() => {
    if (!exercises?.length) return ['All'];
    const set = new Set<string>();
    for (const ex of exercises) {
      for (const m of ex.primaryMuscles) {
        if (m) set.add(m);
      }
    }
    return ['All', ...Array.from(set).sort()];
  }, [exercises]);
}

// Client-side filtering — the screen has its own search box. Returns a stable
// reference when nothing changes so list virtualisation stays cheap.
export function filterExercises(
  exercises: Exercise[],
  opts: { query?: string; muscle?: string; equipment?: string },
): Exercise[] {
  const q = opts.query?.trim().toLowerCase() ?? '';
  const muscle = opts.muscle && opts.muscle !== 'All' ? opts.muscle : null;
  const equipment = opts.equipment && opts.equipment !== 'All' ? opts.equipment : null;

  if (!q && !muscle && !equipment) return exercises;

  return exercises.filter((ex) => {
    if (q && !ex.name.toLowerCase().includes(q)) return false;
    if (muscle && !ex.primaryMuscles.includes(muscle) && !ex.secondaryMuscles.includes(muscle)) {
      return false;
    }
    if (equipment && !ex.equipment.includes(equipment)) return false;
    return true;
  });
}
