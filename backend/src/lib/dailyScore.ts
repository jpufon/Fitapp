// Upsert + recompute a DailyScore row for a given user/date.
// Pass any of the pillar values to update them. Server computes scores + tree state.

import { prisma } from './prisma.js';
import { computeScore } from './score.js';

export type DailyScoreUpdate = {
  stepsCount?: number;
  proteinG?: number;
  waterMl?: number;
  isRestDay?: boolean;
};

export async function upsertDailyScore(
  userId: string,
  date: Date, // expected: midnight in user's timezone, but Date here is fine for V1
  update: DailyScoreUpdate,
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      stepsGoal: true,
      proteinTargetG: true,
      waterTargetMl: true,
    },
  });
  if (!user) throw new Error('user_not_found');

  const existing = await prisma.dailyScore.findUnique({
    where: { userId_date: { userId, date } },
  });

  const merged = {
    stepsCount: update.stepsCount ?? existing?.stepsCount ?? 0,
    stepsGoal: existing?.stepsGoal ?? user.stepsGoal,
    proteinG: update.proteinG ?? existing?.proteinG ?? 0,
    proteinTargetG: existing?.proteinTargetG ?? user.proteinTargetG,
    waterMl: update.waterMl ?? existing?.waterMl ?? 0,
    waterTargetMl: existing?.waterTargetMl ?? user.waterTargetMl,
    isRestDay: update.isRestDay ?? existing?.isRestDay ?? false,
  };

  const computed = computeScore(merged);

  return prisma.dailyScore.upsert({
    where: { userId_date: { userId, date } },
    update: {
      ...merged,
      ...computed,
    },
    create: {
      userId,
      date,
      ...merged,
      ...computed,
    },
  });
}

// Returns midnight UTC for an ISO date string (YYYY-MM-DD), or today if undefined.
// Phase 4+ should respect user.timezone via Luxon.
export function dateAtMidnight(isoDate?: string): Date {
  if (isoDate) {
    return new Date(`${isoDate}T00:00:00.000Z`);
  }
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}
