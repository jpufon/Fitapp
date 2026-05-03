// Exercise catalogue — read-only reference data seeded from wger.
// useCachedQuery primes MMKV on first launch so the library is available offline
// from then on. Refresh happens in the background whenever connectivity returns.
//
// Sync strategy:
// 1) GET /exercises/catalog — if catalogVersion unchanged, reuse MMKV list (no download).
// 2) If version changed and cached rows all have updatedAt — GET /exercises?updatedAfter=…
//    (paged), merge by id into the cached list (delta).
// 3) If delta is empty but version changed, or cache lacks updatedAt — full paginated fetch.

import { useMemo } from 'react';
import { useCachedQuery } from './useCachedQuery';
import { useDebouncedValue } from './useDebouncedValue';
import { apiQuery, hasApiConfig } from '../lib/api';
import { getCachedJson, setCachedJson, storage } from '../lib/storage';

export type Exercise = {
  id: string;
  wgerId: number | null;
  name: string;
  category: string; // "strength" | "cardio" | ...
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipment: string[];
  instructions: string | null;
  movementType: string | null;
  /** ISO8601 from server — required for delta sync after first full fetch */
  updatedAt?: string;
};

const CACHE_KEY = 'query.exercises.all';
/** Replaced by SYNC_META_KEY; kept for one-shot migration from older builds */
const LEGACY_CATALOG_VERSION_KEY = 'query.exercises.catalogVersion';
const SYNC_META_KEY = 'query.exercises.syncMeta';

type SyncMeta = {
  catalogVersion: string;
  /** Max `updatedAt` among rows we last merged — baseline for `?updatedAfter=` */
  maxRowUpdatedAt: string;
};

type CatalogResponse = {
  total: number;
  catalogVersion: string;
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
    updatedAt?: string;
  }>;
  count: number;
  version: string | null;
  catalogVersion?: string;
  hasMore?: boolean;
  offset?: number;
  limit?: number;
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
    updatedAt:
      typeof row.updatedAt === 'string'
        ? row.updatedAt
        : row.updatedAt != null
          ? new Date(row.updatedAt as unknown as string | number | Date).toISOString()
          : undefined,
  }));
}

function maxUpdatedAtInList(rows: Exercise[]): string | null {
  let max: string | null = null;
  for (const r of rows) {
    if (!r.updatedAt) continue;
    if (!max || r.updatedAt > max) max = r.updatedAt;
  }
  return max;
}

function everyRowHasUpdatedAt(rows: Exercise[]): boolean {
  return rows.length > 0 && rows.every((r) => Boolean(r.updatedAt));
}

function mergeById(base: Exercise[], delta: Exercise[]): Exercise[] {
  const map = new Map<string, Exercise>();
  for (const e of base) map.set(e.id, e);
  for (const e of delta) map.set(e.id, e);
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function readSyncMeta(): SyncMeta | null {
  const next = getCachedJson<SyncMeta>(SYNC_META_KEY);
  if (next) return next;
  const legacy = getCachedJson<{ v: string }>(LEGACY_CATALOG_VERSION_KEY);
  if (!legacy?.v) return null;
  return { catalogVersion: legacy.v, maxRowUpdatedAt: legacy.v };
}

function persistSyncMeta(remote: CatalogResponse, merged: Exercise[]): void {
  const maxRow = maxUpdatedAtInList(merged) ?? remote.catalogVersion;
  setCachedJson<SyncMeta>(SYNC_META_KEY, {
    catalogVersion: remote.catalogVersion,
    maxRowUpdatedAt: maxRow,
  });
  storage.delete(LEGACY_CATALOG_VERSION_KEY);
}

/** Paginated full sync — self-hosted catalog; bounded page size. */
async function fetchAllExercises(): Promise<Exercise[]> {
  const pageSize = 2500;
  const out: Exercise[] = [];
  let offset = 0;
  for (;;) {
    const res = await apiQuery<ExerciseListResponse>(
      `/exercises?limit=${pageSize}&offset=${offset}`,
    );
    out.push(...normalize(res.items));
    if (res.items.length < pageSize) break;
    offset += pageSize;
    if (offset > 200_000) break;
  }
  return out;
}

/** Rows strictly newer than `updatedAfter` (server uses `updatedAt > t`). */
async function fetchExercisesUpdatedAfter(updatedAfter: string): Promise<Exercise[]> {
  const pageSize = 3000;
  const enc = encodeURIComponent(updatedAfter);
  const out: Exercise[] = [];
  let offset = 0;
  for (;;) {
    const res = await apiQuery<ExerciseListResponse>(
      `/exercises?limit=${pageSize}&offset=${offset}&updatedAfter=${enc}`,
    );
    out.push(...normalize(res.items));
    if (res.items.length < pageSize) break;
    offset += pageSize;
    if (offset > 200_000) break;
  }
  return out;
}

export function useExerciseLibrary() {
  return useCachedQuery<Exercise[]>({
    queryKey: ['exercises', 'all'],
    cacheKey: CACHE_KEY,
    queryFn: async () => {
      const remote = await apiQuery<CatalogResponse>('/exercises/catalog');
      const syncMeta = readSyncMeta();
      const bundle = getCachedJson<{ data: Exercise[]; updatedAt: number }>(CACHE_KEY);
      const cached = bundle?.data;

      if (syncMeta?.catalogVersion === remote.catalogVersion && cached?.length) {
        return cached;
      }

      let merged: Exercise[];

      if (
        cached?.length &&
        syncMeta &&
        syncMeta.catalogVersion !== remote.catalogVersion &&
        everyRowHasUpdatedAt(cached)
      ) {
        const baseline = maxUpdatedAtInList(cached);
        if (baseline) {
          const delta = await fetchExercisesUpdatedAfter(baseline);
          merged = delta.length ? mergeById(cached, delta) : await fetchAllExercises();
        } else {
          merged = await fetchAllExercises();
        }
      } else {
        merged = await fetchAllExercises();
      }

      persistSyncMeta(remote, merged);
      return merged;
    },
    enabled: hasApiConfig,
    staleTime: 1000 * 60 * 60 * 24,
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

export type FilteredExerciseOpts = {
  query: string;
  muscle?: string;
  equipment?: string;
};

export type UseFilteredExercisesOptions = {
  /** Delay before applying text search (muscle/equipment apply immediately). Default 220ms. */
  debounceMs?: number;
  /** When set, only the first N matches are returned (e.g. modal pickers). */
  maxResults?: number;
};

/**
 * Debounced, memoized exercise filtering — keeps screens aligned with
 * `docs/search-filter-architecture.md` (debounce text, memoize list, cap pickers).
 */
export function useFilteredExercises(
  exercises: Exercise[] | undefined,
  opts: FilteredExerciseOpts,
  options?: UseFilteredExercisesOptions,
): Exercise[] {
  const debounceMs = options?.debounceMs ?? 220;
  const maxResults = options?.maxResults;
  const debouncedQuery = useDebouncedValue(opts.query, debounceMs);

  const filtered = useMemo(
    () =>
      filterExercises(exercises ?? [], {
        query: debouncedQuery,
        muscle: opts.muscle,
        equipment: opts.equipment,
      }),
    [exercises, debouncedQuery, opts.muscle, opts.equipment],
  );

  return useMemo(
    () => (maxResults != null ? filtered.slice(0, maxResults) : filtered),
    [filtered, maxResults],
  );
}
