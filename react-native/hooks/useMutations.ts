// Mutation hooks for waliFit backend.
// All mutations go through apiMutate → either sent immediately or queued for retry.
// On success, /home is invalidated so HomeScreen reflects the change.
//
// Body types are mirrored from packages/shared/src/schemas (types only, no Zod
// at mobile runtime). When packages/shared gets Metro-resolvable, replace
// these with `import type { ... } from 'walifit-shared'`.

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiMutate } from '../lib/api';

type WorkoutType = 'strength' | 'hybrid' | 'conditioning' | 'run' | 'rest';
type RunType = 'free' | 'preset';
type RunDistancePreset = 'one_mile' | 'two_mile' | 'three_mile' | 'two_k' | 'five_k';

export type StartWorkoutBody = { name: string; type: WorkoutType };

export type LogSetBody = {
  exerciseName: string;
  exerciseId?: string;
  setNumber: number;
  reps: number;
  weightKg?: number;
  rpe?: number;
  notes?: string;
};

export type FinishWorkoutBody = {
  sessionRpe?: number;
  notes?: string;
  runDistanceM?: number;
  runDurationS?: number;
  runPaceSPerKm?: number;
  runType?: RunType;
  runDistancePreset?: RunDistancePreset;
  runRoutePolyline?: string;
  runSplitPaces?: unknown;
};

export type LogNutritionBody = {
  proteinG?: number;
  waterMl?: number;
  stepsCount?: number;
};

export type RecomputeVitalityBody = {
  date?: string;
  isRestDay?: boolean;
};

function invalidateHome(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['home', 'snapshot'] });
}

// ─── POST /workouts ────────────────────────────────────────────────────────

export function useStartWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: StartWorkoutBody) =>
      apiMutate<{ workout: { id: string } }>({ method: 'POST', path: '/workouts', body }),
    onSuccess: () => invalidateHome(qc),
  });
}

// ─── POST /workouts/:id/sets ───────────────────────────────────────────────

export function useLogSet(workoutId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: LogSetBody) =>
      apiMutate<{ set: unknown }>({
        method: 'POST',
        path: `/workouts/${workoutId}/sets`,
        body,
      }),
    onSuccess: () => invalidateHome(qc),
  });
}

// ─── PATCH /workouts/:id (finish) ──────────────────────────────────────────

export function useFinishWorkout(workoutId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: FinishWorkoutBody) =>
      apiMutate<{ workout: unknown; newPRs: Array<{ exerciseName: string; value: number; unit: string }> }>({
        method: 'PATCH',
        path: `/workouts/${workoutId}`,
        body,
      }),
    onSuccess: () => invalidateHome(qc),
  });
}

// ─── POST /nutrition/simple/:date ──────────────────────────────────────────

export function useLogNutrition(date: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: LogNutritionBody) =>
      apiMutate<{ dailyScore: unknown }>({
        method: 'POST',
        path: `/nutrition/simple/${date}`,
        body,
      }),
    onSuccess: () => invalidateHome(qc),
  });
}

// ─── POST /vitality/recompute ──────────────────────────────────────────────

export function useRecomputeVitality() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body?: RecomputeVitalityBody) =>
      apiMutate<{ dailyScore: unknown }>({
        method: 'POST',
        path: '/vitality/recompute',
        body: body ?? {},
      }),
    onSuccess: () => invalidateHome(qc),
  });
}
