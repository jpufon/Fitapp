import type { FastifyInstance } from 'fastify';
import {
  StartWorkoutSchema,
  LogSetSchema,
  FinishWorkoutSchema,
} from 'walifit-shared';
import { requireAuth } from '../lib/auth.js';
import { prisma } from '../lib/prisma.js';
import { detectPRs } from '../lib/pr.js';

export async function workoutRoutes(app: FastifyInstance) {
  // ── POST /workouts — start a session ────────────────────────────────────
  app.post('/workouts', { preHandler: requireAuth }, async (request, reply) => {
    const parsed = StartWorkoutSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'invalid_body', issues: parsed.error.flatten() });
    }

    const workout = await prisma.workoutLog.create({
      data: {
        userId: request.user!.id,
        name: parsed.data.name,
        type: parsed.data.type,
      },
    });

    return reply.code(201).send({ workout });
  });

  // ── POST /workouts/:id/sets — log a set ─────────────────────────────────
  app.post<{ Params: { id: string } }>(
    '/workouts/:id/sets',
    { preHandler: requireAuth },
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

      const set = await prisma.workoutSet.create({
        data: {
          workoutLogId: workout.id,
          exerciseName: parsed.data.exerciseName,
          exerciseId: parsed.data.exerciseId,
          setNumber: parsed.data.setNumber,
          reps: parsed.data.reps,
          weightKg: parsed.data.weightKg,
          rpe: parsed.data.rpe,
          notes: parsed.data.notes,
        },
      });

      return reply.code(201).send({ set });
    },
  );

  // ── PATCH /workouts/:id — finish + run PR detection ─────────────────────
  app.patch<{ Params: { id: string } }>(
    '/workouts/:id',
    { preHandler: requireAuth },
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
}
