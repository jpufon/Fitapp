// Train tab data hooks. Two independent queries:
//   • GET /workouts/today    — most recent un-finished workout for today (resume CTA)
//   • GET /workouts?limit=N  — finished sessions for the "Recent" carousel
//
// Both go through useCachedQuery so the screen renders instantly offline / on
// cold start, then revalidates against the network.

import { useCachedQuery } from './useCachedQuery';
import { apiQuery, hasApiConfig } from '../lib/api';

// ─── Types matching backend responses ──────────────────────────────────────

export type TrainSet = {
  id: string;
  exerciseName: string;
  exerciseId: string | null;
  setNumber: number;
  reps: number;
  weightKg: number | null;
  rpe: number | null;
};

export type TodayWorkout = {
  id: string;
  name: string;
  type: string;
  startedAt: string;
  finishedAt: string | null;
  sets: TrainSet[];
};

// Shape mirrors what GET /workouts?limit= returns + a derived
// durationMinutes to avoid every screen re-doing the seconds→minutes math.
export type WorkoutHistoryItem = {
  id: string;
  name: string;
  type: string;
  startedAt: string;
  finishedAt: string | null;
  completedAt: string | null;
  durationMinutes: number;
  exerciseCount: number;
};

type TodayResponse = { workout: RawTodayWorkout | null };
type HistoryResponse = { workouts: RawHistoryItem[] };

type RawTodayWorkout = {
  id: string;
  name: string;
  type: string;
  startedAt: string;
  finishedAt: string | null;
  sets?: Array<{
    id: string;
    exerciseName: string;
    exerciseId?: string | null;
    setNumber: number;
    reps: number;
    weightKg?: number | null;
    rpe?: number | null;
  }>;
};

type RawHistoryItem = {
  id: string;
  name: string;
  type: string;
  startedAt: string;
  finishedAt: string | null;
  completedAt: string | null;
  durationSec: number;
  exerciseCount: number;
};

function normalizeToday(raw: RawTodayWorkout | null): TodayWorkout | null {
  if (!raw) return null;
  return {
    id: raw.id,
    name: raw.name,
    type: raw.type,
    startedAt: raw.startedAt,
    finishedAt: raw.finishedAt,
    sets: (raw.sets ?? []).map((s) => ({
      id: s.id,
      exerciseName: s.exerciseName,
      exerciseId: s.exerciseId ?? null,
      setNumber: s.setNumber,
      reps: s.reps,
      weightKg: s.weightKg ?? null,
      rpe: s.rpe ?? null,
    })),
  };
}

function normalizeHistory(rows: RawHistoryItem[]): WorkoutHistoryItem[] {
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    type: row.type,
    startedAt: row.startedAt,
    finishedAt: row.finishedAt,
    completedAt: row.completedAt,
    durationMinutes: row.durationSec > 0 ? Math.max(1, Math.round(row.durationSec / 60)) : 0,
    exerciseCount: row.exerciseCount,
  }));
}

// ─── Hooks ─────────────────────────────────────────────────────────────────

export function useTodayWorkout() {
  return useCachedQuery<TodayWorkout | null>({
    queryKey: ['train', 'today'],
    cacheKey: 'query.train.today',
    queryFn: async () => {
      const res = await apiQuery<TodayResponse>('/workouts/today');
      return normalizeToday(res.workout);
    },
    enabled: hasApiConfig,
  });
}

export function useWorkoutHistory(limit = 20) {
  return useCachedQuery<WorkoutHistoryItem[]>({
    queryKey: ['train', 'history', limit],
    cacheKey: `query.train.history.${limit}`,
    queryFn: async () => {
      const res = await apiQuery<HistoryResponse>(`/workouts?limit=${limit}`);
      return normalizeHistory(res.workouts);
    },
    enabled: hasApiConfig,
  });
}

// Convenience composite — returns both queries' state so TrainScreen can
// branch on either one without managing two refetch handles.
export function useTrainData(historyLimit = 20) {
  const today = useTodayWorkout();
  const history = useWorkoutHistory(historyLimit);

  return {
    todayWorkout: today.data ?? null,
    todayQuery: today,
    history: history.data ?? [],
    historyQuery: history,
    isLoading: today.isLoading || history.isLoading,
    isError: today.isError || history.isError,
    refetch: async () => {
      await Promise.all([today.refetch(), history.refetch()]);
    },
  };
}
