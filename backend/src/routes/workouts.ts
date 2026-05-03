import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'node:crypto';
import {
  StartWorkoutSchema,
  LogSetSchema,
  FinishWorkoutSchema,
} from 'walifit-shared';
import { requireAuth } from '../lib/auth.js';
import { prisma } from '../lib/prisma.js';
import { detectPRs } from '../lib/pr.js';
import { recordWorkoutFeedItems } from '../lib/feed.js';
import { rateLimit } from '../lib/rateLimit.js';

const writeDefault = rateLimit('write:default', 60, 60);

export async function workoutRoutes(app: FastifyInstance) {
  // ── POST /workouts — start a session ────────────────────────────────────
  app.post('/workouts', { preHandler: [requireAuth, writeDefault] }, async (request, reply) => {
    const parsed = StartWorkoutSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'invalid_body', issues: parsed.error.flatten() });
    }

    const workout = await prisma.workoutLog.upsert({
      where: { id: parsed.data.id ?? randomUUID() },
      update: {},
      create: {
        id: parsed.data.id,
        userId: request.user!.id,
        name: parsed.data.name,
        type: parsed.data.type,
      },
    });

    if (workout.userId !== request.user!.id) {
      return reply.code(403).send({ error: 'forbidden' });
    }

    return reply.code(201).send({ workout });
  });

  // ── POST /workouts/:id/sets — log a set ─────────────────────────────────
  app.post<{ Params: { id: string } }>(
    '/workouts/:id/sets',
    { preHandler: [requireAuth, writeDefault] },
    async (request, reply) => {
      const parsed = LogSetSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: 'invalid_body', issues: parsed.error.flatten() });
      }

      const workout = await prisma.workoutLog.findUnique({
        where: { id: request.params.id },
        select: { id: true, userId: true, finishedAt: true },
      });
      if (!workout) return reply.code(404).send({ error: 'workout_not_found' });
      if (workout.userId !== request.user!.id) {
        return reply.code(403).send({ error: 'forbidden' });
      }
      if (workout.finishedAt) {
        return reply.code(409).send({ error: 'workout_already_finished' });
      }

      // Idempotent on (workoutLogId, clientId): retries from the offline
      // sync queue collapse into the same row. Update is a no-op so a replay
      // returns the originally-created set unchanged.
      const set = await prisma.workoutSet.upsert({
        where: {
          workoutLogId_clientId: {
            workoutLogId: workout.id,
            clientId: parsed.data.clientId,
          },
        },
        update: {},
        create: {
          workoutLogId: workout.id,
          clientId: parsed.data.clientId,
          exerciseName: parsed.data.exerciseName,
          exerciseId: parsed.data.exerciseId,
          setNumber: parsed.data.setNumber,
          reps: parsed.data.reps,
          weightKg: parsed.data.weightKg,
          rpe: parsed.data.rpe,
          notes: parsed.data.notes,
          durationS: parsed.data.durationS,
          roundNumber: parsed.data.roundNumber,
          intervalWorkS: parsed.data.intervalWorkS,
          intervalRestS: parsed.data.intervalRestS,
        },
      });

      return reply.code(201).send({ set });
    },
  );

  // ── PATCH /workouts/:id — finish + run PR detection ─────────────────────
  app.patch<{ Params: { id: string } }>(
    '/workouts/:id',
    { preHandler: [requireAuth, writeDefault] },
    async (request, reply) => {
      const parsed = FinishWorkoutSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: 'invalid_body', issues: parsed.error.flatten() });
      }

      const existing = await prisma.workoutLog.findUnique({
        where: { id: request.params.id },
        select: { id: true, userId: true, finishedAt: true },
      });
      if (!existing) return reply.code(404).send({ error: 'workout_not_found' });
      if (existing.userId !== request.user!.id) {
        return reply.code(403).send({ error: 'forbidden' });
      }

      const result = await prisma.$transaction(async (tx) => {
        const workout = await tx.workoutLog.update({
          where: { id: existing.id },
          data: {
            finishedAt: existing.finishedAt ?? new Date(),
            sessionRpe: parsed.data.sessionRpe,
            notes: parsed.data.notes,
            runDistanceM: parsed.data.runDistanceM,
            runDurationS: parsed.data.runDurationS,
            runPaceSPerKm: parsed.data.runPaceSPerKm,
            runType: parsed.data.runType,
            runDistancePreset: parsed.data.runDistancePreset,
            runRoutePolyline: parsed.data.runRoutePolyline,
            runSplitPaces: parsed.data.runSplitPaces as never,
          },
          include: { sets: true },
        });

        const newPRs = await detectPRs(tx, request.user!.id, workout.id);
        return { workout, newPRs };
      });

      const totalVolumeKg = result.workout.sets.reduce((sum, set) => {
        if (set.weightKg == null) return sum;
        return sum + set.weightKg * set.reps;
      }, 0);

      await recordWorkoutFeedItems(
        {
          userId: request.user!.id,
          workoutId: result.workout.id,
          workoutName: result.workout.name,
          workoutType: result.workout.type,
          isRun: result.workout.type === 'run',
          runDistanceM: result.workout.runDistanceM,
          runDurationS: result.workout.runDurationS,
          startedAt: result.workout.startedAt,
          finishedAt: result.workout.finishedAt,
          setCount: result.workout.sets.length,
          totalVolumeKg,
        },
        result.newPRs,
      );

      return reply.send(result);
    },
  );

  // ── GET /workouts/today — most recent un-finished workout for today ─────
  app.get('/workouts/today', { preHandler: requireAuth }, async (request, reply) => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const workout = await prisma.workoutLog.findFirst({
      where: {
        userId: request.user!.id,
        startedAt: { gte: start },
      },
      orderBy: { startedAt: 'desc' },
      include: { sets: true },
    });

    return reply.send({ workout });
  });

  // ── GET /workouts?limit=N — recent finished sessions for history view ───
  app.get<{ Querystring: { limit?: string } }>(
    '/workouts',
    { preHandler: requireAuth },
    async (request, reply) => {
      const raw = Number(request.query.limit ?? 20);
      const limit = Number.isFinite(raw) ? Math.max(1, Math.min(100, Math.floor(raw))) : 20;

      const rows = await prisma.workoutLog.findMany({
        where: { userId: request.user!.id, finishedAt: { not: null } },
        orderBy: { finishedAt: 'desc' },
        take: limit,
        include: { _count: { select: { sets: true } } },
      });

      const workouts = rows.map((row) => ({
        id: row.id,
        name: row.name,
        type: row.type,
        startedAt: row.startedAt.toISOString(),
        finishedAt: row.finishedAt?.toISOString() ?? null,
        completedAt: row.finishedAt?.toISOString() ?? null,
        durationSec:
          row.finishedAt
            ? Math.max(0, Math.round((row.finishedAt.getTime() - row.startedAt.getTime()) / 1000))
            : 0,
        exerciseCount: row._count.sets,
      }));

      return reply.send({ workouts });
    },
  );
}
