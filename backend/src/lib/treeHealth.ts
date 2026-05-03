// WF-020 — rolling 7-day tree health.
//
// `treeHealth` (0–100) is the mean of the last seven days' totalScore × 100.
// Missing days fill in as: 0 if it would have been a training day, 0.5 if rest.
// `treeStage` is the canonical TreeState for that mean — same thresholds as
// stateFromScore so per-day Calendar dots and the hero tree share semantics.
//
// Persisted to VitalityState. Per-day DailyScore.treeState stays as a snapshot
// for the Calendar; HomeScreen reads the rolling VitalityState.treeStage.

import { prisma } from './prisma.js';
import { stateFromScore } from './score.js';
import {
  addDaysToKey,
  currentDayKeyWithGrace,
  dayKeyToDbDate,
  isTrainingWeekday,
} from './streakEngine.js';

const WINDOW_DAYS = 7;

export type TreeHealthResult = {
  treeHealth: number;
  treeStage: ReturnType<typeof stateFromScore>;
};

export async function recomputeTreeHealth(userId: string): Promise<TreeHealthResult> {
  const [user, vitalityState] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { trainingDays: true },
    }),
    prisma.vitalityState.findUnique({
      where: { userId },
      select: { timezone: true },
    }),
  ]);
  if (!user || !vitalityState) {
    return { treeHealth: 100, treeStage: 'sprout' };
  }

  const tz = vitalityState.timezone || 'UTC';
  const todayKey = currentDayKeyWithGrace(tz);
  const earliestKey = addDaysToKey(todayKey, -(WINDOW_DAYS - 1));

  const rows = await prisma.dailyScore.findMany({
    where: {
      userId,
      date: { gte: dayKeyToDbDate(earliestKey), lte: dayKeyToDbDate(todayKey) },
    },
    select: { date: true, totalScore: true },
  });
  const scoreByKey = new Map<string, number>();
  for (const row of rows) {
    scoreByKey.set(row.date.toISOString().slice(0, 10), row.totalScore);
  }

  let sum = 0;
  for (let i = 0; i < WINDOW_DAYS; i += 1) {
    const cursorKey = addDaysToKey(todayKey, -i);
    const score = scoreByKey.get(cursorKey);
    if (score !== undefined) {
      sum += score;
    } else {
      const isTraining = isTrainingWeekday(cursorKey, user.trainingDays, tz);
      sum += isTraining ? 0 : 0.5;
    }
  }
  const mean = sum / WINDOW_DAYS;
  const treeHealth = Math.round(mean * 100);
  const treeStage = stateFromScore(mean);

  await prisma.vitalityState.update({
    where: { userId },
    data: { treeHealth, treeStage },
  });

  return { treeHealth, treeStage };
}
