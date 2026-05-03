// Mutation hooks for waliFit backend.
// All mutations go through apiMutate → either sent immediately or queued for retry.
// On success, /home is invalidated so HomeScreen reflects the change.
//
// Body types come from packages/shared via walifit-shared. Types only — the
// runtime Zod schemas live in packages/shared but are evaluated only on the
// backend (which validates incoming bodies). Mobile sends, backend validates.

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { randomUUID } from 'expo-crypto';
import type {
  StartWorkoutBody,
  LogSetBody,
  FinishWorkoutBody,
  LogNutritionBody,
  RecomputeVitalityBody,
  UseFreezeBody,
} from 'walifit-shared';
import { apiMutate } from '../lib/api';

export type {
  StartWorkoutBody,
  LogSetBody,
  FinishWorkoutBody,
  LogNutritionBody,
  RecomputeVitalityBody,
  UseFreezeBody,
};

// Body shape callers pass to useLogNutrition. The hook mints `clientId`
// internally so the offline queue replays a stable idempotency key.
export type LogNutritionInput = Omit<LogNutritionBody, 'clientId'>;

// Body shape callers pass to useLogSet. The hook mints `clientId` internally.
export type LogSetInput = Omit<LogSetBody, 'clientId'>;

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
    // Mint `id` if the caller didn't supply one. The offline sync queue
    // replays the same body on retry, so a stable id collapses retries
    // onto the same row via the upsert in `POST /workouts`.
    mutationFn: (body: StartWorkoutBody) =>
      apiMutate<{ workout: { id: string } }>({
        method: 'POST',
        path: '/workouts',
        body: { ...body, id: body.id ?? randomUUID() },
      }),
    onSuccess: () => invalidateHome(qc),
  });
}

// ─── POST /workouts/:id/sets ───────────────────────────────────────────────

export function useLogSet(workoutId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: LogSetInput) =>
      apiMutate<{ set: unknown }>({
        method: 'POST',
        path: `/workouts/${workoutId}/sets`,
        body: { ...input, clientId: randomUUID() } satisfies LogSetBody,
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
    mutationFn: (input: LogNutritionInput) =>
      apiMutate<{ dailyScore: unknown }>({
        method: 'POST',
        path: `/nutrition/simple/${date}`,
        body: { ...input, clientId: randomUUID() } satisfies LogNutritionBody,
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

// ─── POST /vitality/freeze — burn one freeze token to protect a date ──────

export function useUseFreezeToken() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UseFreezeBody) =>
      apiMutate<{ burned: boolean; streak: number; freezeTokens: number }>({
        method: 'POST',
        path: '/vitality/freeze',
        body,
      }),
    onSuccess: () => invalidateHome(qc),
  });
}
