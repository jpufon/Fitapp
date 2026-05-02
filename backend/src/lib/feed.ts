// Helpers for writing FeedItems on activity events. Fans out one row per
// squad the user belongs to so squad members see it via /feed; falls back to
// a personal row (squadId=null) when the user isn't in any squad.

import { prisma } from './prisma.js';
import type { NewPR } from './pr.js';

type WorkoutFinishContext = {
  userId: string;
  workoutId: string;
  workoutName: string;
  workoutType: string;
  isRun: boolean;
  runDistanceM: number | null;
  runDurationS: number | null;
  startedAt: Date;
  finishedAt: Date | null;
  setCount: number;
  totalVolumeKg: number;
};

function workoutValueLabel(ctx: WorkoutFinishContext): string {
  if (ctx.isRun && ctx.runDistanceM && ctx.runDurationS) {
    const km = (ctx.runDistanceM / 1000).toFixed(2);
    const min = Math.floor(ctx.runDurationS / 60);
    const sec = ctx.runDurationS % 60;
    return `${km}km · ${min}:${String(sec).padStart(2, '0')}`;
  }
  if (ctx.totalVolumeKg > 0) {
    return `${Math.round(ctx.totalVolumeKg).toLocaleString('en-US')}kg volume`;
  }
  if (ctx.finishedAt) {
    const min = Math.max(1, Math.round((ctx.finishedAt.getTime() - ctx.startedAt.getTime()) / 60000));
    return `${min} min`;
  }
  return 'Complete';
}

function prValueLabel(pr: NewPR): { value: string; isRun: boolean } {
  if (pr.unit === 'seconds') {
    const min = Math.floor(pr.value / 60);
    const sec = Math.round(pr.value % 60);
    return { value: `${min}:${String(sec).padStart(2, '0')}`, isRun: true };
  }
  return { value: `${pr.value}kg`, isRun: false };
}

export async function recordWorkoutFeedItems(
  ctx: WorkoutFinishContext,
  newPRs: NewPR[],
): Promise<void> {
  const memberships = await prisma.squadMember.findMany({
    where: { userId: ctx.userId },
    select: { squadId: true },
  });
  const squadIds = memberships.map((m) => m.squadId);
  const targets: Array<string | null> = squadIds.length ? squadIds : [null];

  const completeValue = workoutValueLabel(ctx);

  const writes: Array<ReturnType<typeof prisma.feedItem.create>> = [];

  for (const squadId of targets) {
    writes.push(
      prisma.feedItem.create({
        data: {
          userId: ctx.userId,
          squadId,
          eventType: 'workout_complete',
          exercise: ctx.workoutName,
          value: completeValue,
          isRun: ctx.isRun,
        },
      }),
    );

    for (const pr of newPRs) {
      const { value, isRun } = prValueLabel(pr);
      writes.push(
        prisma.feedItem.create({
          data: {
            userId: ctx.userId,
            squadId,
            eventType: isRun ? 'run_pr' : 'strength_pr',
            exercise: pr.exerciseName,
            value,
            isRun,
          },
        }),
      );
    }
  }

  await Promise.all(writes);
}
