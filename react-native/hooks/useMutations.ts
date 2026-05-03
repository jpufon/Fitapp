// Mutation hooks for waliFit backend.
// All mutations go through apiMutate → either sent immediately or queued for retry.
// On success, /home is invalidated so HomeScreen reflects the change.
//
// Body types come from packages/shared via walifit-shared. Types only — the
// runtime Zod schemas live in packages/shared but are evaluated only on the
// backend (which validates incoming bodies). Mobile sends, backend validates.

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  StartWorkoutBody,
  LogSetBody,
  FinishWorkoutBody,
  LogNutritionBody,
  RecomputeVitalityBody,
} from 'walifit-shared';
import { apiMutate } from '../lib/api';

export type {
  StartWorkoutBody,
  LogSetBody,
  FinishWorkoutBody,
  LogNutritionBody,
  RecomputeVitalityBody,
};

export type UpdateDailyTargetsBody = {
  proteinTargetG?: number;
  waterTargetMl?: number;
  stepsGoal?: number;
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

// ─── PATCH /users/me — daily targets ───────────────────────────────────────

export function useUpdateDailyTargets() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateDailyTargetsBody) =>
      apiMutate<{ user: unknown }>({
        method: 'PATCH',
        path: '/users/me',
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
