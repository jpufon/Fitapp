// PR detection — runs on workout finish.
// Strength: max weightKg per (user, exerciseName). Heavier = better.
// Run: lowest runDurationS per (user, "<preset> Run"). Lower = better.
// Returns the list of newly-set PRs so the route can include them in response.

import type { Prisma } from '@prisma/client';

export type NewPR = {
  exerciseName: string;
  value: number;
  unit: 'kg' | 'seconds';
};

const RUN_PRESET_LABELS: Record<string, string> = {
  one_mile: '1 Mile Run',
  two_mile: '2 Mile Run',
  three_mile: '3 Mile Run',
  two_k: '2K Run',
  five_k: '5K Run',
};

export async function detectPRs(
  tx: Prisma.TransactionClient,
  userId: string,
  workoutLogId: string,
): Promise<NewPR[]> {
  const workout = await tx.workoutLog.findUnique({
    where: { id: workoutLogId },
    include: { sets: true },
  });
  if (!workout) return [];

  const newPRs: NewPR[] = [];

  // ── Strength PRs ───────────────────────────────────────────────────────
  // Per exercise, find heaviest set in this workout. Compare to existing PR.
  const heaviestPerExercise = new Map<string, number>();
  for (const set of workout.sets) {
    if (set.weightKg == null || set.weightKg <= 0) continue;
    const current = heaviestPerExercise.get(set.exerciseName) ?? 0;
    if (set.weightKg > current) heaviestPerExercise.set(set.exerciseName, set.weightKg);
  }

  for (const [exerciseName, weightKg] of heaviestPerExercise) {
    const existing = await tx.pRRecord.findFirst({
      where: { userId, exerciseName, unit: 'kg' },
      orderBy: { value: 'desc' },
    });

    if (!existing || weightKg > existing.value) {
      await tx.pRRecord.create({
        data: { userId, exerciseName, value: weightKg, unit: 'kg', workoutLogId },
      });
      newPRs.push({ exerciseName, value: weightKg, unit: 'kg' });
    }
  }

  // ── Run PRs ────────────────────────────────────────────────────────────
  // Only when this workout is a run with a preset distance + duration.
  if (
    workout.type === 'run' &&
    workout.runDistancePreset &&
    workout.runDurationS != null &&
    workout.runDurationS > 0
  ) {
    const exerciseName = RUN_PRESET_LABELS[workout.runDistancePreset];
    if (exerciseName) {
      const existing = await tx.pRRecord.findFirst({
        where: { userId, exerciseName, unit: 'seconds' },
        orderBy: { value: 'asc' }, // lowest = best
      });

      if (!existing || workout.runDurationS < existing.value) {
        await tx.pRRecord.create({
          data: {
            userId,
            exerciseName,
            value: workout.runDurationS,
            unit: 'seconds',
            workoutLogId,
          },
        });
        newPRs.push({ exerciseName, value: workout.runDurationS, unit: 'seconds' });
      }
    }
  }

  return newPRs;
}
