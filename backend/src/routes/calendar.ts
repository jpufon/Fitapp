// GET /calendar?start=YYYY-MM-DD&end=YYYY-MM-DD — DailyScore + WorkoutLog rows
// joined per day. Used by react-native/hooks/useCalendarData.ts to render the
// month grid and weekly view.
//
// GET /calendar/:date — single-day detail, same shape with vitalityScore.

import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../lib/auth.js';
import { prisma } from '../lib/prisma.js';
import { dateAtMidnight } from '../lib/dailyScore.js';

const RangeQuerySchema = z.object({
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_RANGE_DAYS = 92;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

type DailyScoreRow = Awaited<ReturnType<typeof prisma.dailyScore.findMany>>[number];
type WorkoutLogRow = Awaited<ReturnType<typeof prisma.workoutLog.findFirst>>;

function isoDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function durationMinutes(workout: WorkoutLogRow): number {
  if (!workout?.finishedAt) return 0;
  const ms = workout.finishedAt.getTime() - workout.startedAt.getTime();
  return Math.max(1, Math.round(ms / 60000));
}

function buildDay(
  date: string,
  score: DailyScoreRow | undefined,
  workout: WorkoutLogRow | undefined,
  setCount: number,
) {
  const hasWorkout = Boolean(workout);
  const completed = Boolean(workout?.finishedAt);
  const isRest = Boolean(score?.isRestDay) && !hasWorkout;

  return {
    date,
    hasActivity: hasWorkout || (score?.totalScore ?? 0) > 0,
    completed,
    type: isRest ? ('rest' as const) : ('training' as const),
    score: Math.round((score?.totalScore ?? 0) * 100),
    workoutName: workout?.name ?? null,
    exerciseCount: setCount,
    durationMinutes: durationMinutes(workout ?? null),
    hydrationMl: score?.waterMl ?? 0,
    proteinG: score?.proteinG ?? 0,
    stepsCount: score?.stepsCount ?? 0,
    notes: workout?.notes ?? null,
  };
}

export async function calendarRoutes(app: FastifyInstance) {
  app.get('/calendar', { preHandler: requireAuth }, async (request, reply) => {
    const parsed = RangeQuerySchema.safeParse(request.query ?? {});
    if (!parsed.success) {
      return reply.code(400).send({ error: 'invalid_query', issues: parsed.error.flatten() });
    }

    const startDate = dateAtMidnight(parsed.data.start);
    const endDate = dateAtMidnight(parsed.data.end);

    if (endDate < startDate) {
      return reply.code(400).send({ error: 'invalid_range' });
    }
    if ((endDate.getTime() - startDate.getTime()) / MS_PER_DAY > MAX_RANGE_DAYS) {
      return reply.code(400).send({ error: 'range_too_large', maxDays: MAX_RANGE_DAYS });
    }

    const userId = request.user!.id;
    const endExclusive = new Date(endDate.getTime() + MS_PER_DAY);

    const [scores, workouts] = await Promise.all([
      prisma.dailyScore.findMany({
        where: { userId, date: { gte: startDate, lte: endDate } },
        orderBy: { date: 'asc' },
      }),
      prisma.workoutLog.findMany({
        where: { userId, startedAt: { gte: startDate, lt: endExclusive } },
        orderBy: { startedAt: 'asc' },
        include: { _count: { select: { sets: true } } },
      }),
    ]);

    const scoresByDate = new Map(scores.map((row) => [isoDate(row.date), row]));
    const workoutsByDate = new Map<string, (typeof workouts)[number]>();
    for (const workout of workouts) {
      const key = isoDate(workout.startedAt);
      if (!workoutsByDate.has(key)) workoutsByDate.set(key, workout);
    }

    const days: ReturnType<typeof buildDay>[] = [];
    for (let cursor = startDate.getTime(); cursor <= endDate.getTime(); cursor += MS_PER_DAY) {
      const key = isoDate(new Date(cursor));
      const workout = workoutsByDate.get(key);
      days.push(buildDay(key, scoresByDate.get(key), workout, workout?._count.sets ?? 0));
    }

    return reply.send({ days });
  });

  app.get<{ Params: { date: string } }>(
    '/calendar/:date',
    { preHandler: requireAuth },
    async (request, reply) => {
      if (!ISO_DATE.test(request.params.date)) {
        return reply.code(400).send({ error: 'invalid_date', expected: 'YYYY-MM-DD' });
      }

      const userId = request.user!.id;
      const day = dateAtMidnight(request.params.date);
      const dayEnd = new Date(day.getTime() + MS_PER_DAY);

      const [score, workout] = await Promise.all([
        prisma.dailyScore.findUnique({ where: { userId_date: { userId, date: day } } }),
        prisma.workoutLog.findFirst({
          where: { userId, startedAt: { gte: day, lt: dayEnd } },
          orderBy: { startedAt: 'asc' },
          include: { _count: { select: { sets: true } } },
        }),
      ]);

      const built = buildDay(
        request.params.date,
        score ?? undefined,
        workout ?? undefined,
        workout?._count.sets ?? 0,
      );

      return reply.send({ ...built, vitalityScore: built.score });
    },
  );
}
