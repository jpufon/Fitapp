// /workout-templates — user-saved reusable session structures (WF-011).
// Concrete sessions still log against /workouts at runtime; templates are
// pre-fill state, never history.

import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../lib/auth.js';
import { prisma } from '../lib/prisma.js';

const TemplateExerciseSchema = z.object({
  exerciseName: z.string().trim().min(1).max(120),
  exerciseId: z.string().optional(),
  position: z.number().int().min(0).max(100),
  defaultSets: z.number().int().min(1).max(50).optional(),
  defaultReps: z.number().int().min(0).max(1000).optional(),
  restS: z.number().int().min(0).max(3600).optional(),
  durationS: z.number().int().min(0).max(7200).optional(),
  rounds: z.number().int().min(1).max(100).optional(),
  intervalWorkS: z.number().int().min(0).max(3600).optional(),
  intervalRestS: z.number().int().min(0).max(3600).optional(),
  notes: z.string().max(500).optional(),
});

const CreateTemplateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional(),
  type: z.enum(['strength', 'hybrid', 'conditioning', 'run', 'rest']).optional(),
  exercises: z.array(TemplateExerciseSchema).max(50).default([]),
});

const UpdateTemplateSchema = CreateTemplateSchema.partial().extend({
  archived: z.boolean().optional(),
});

export async function workoutTemplateRoutes(app: FastifyInstance) {
  // ── GET /workout-templates ─────────────────────────────────────────────
  app.get('/workout-templates', { preHandler: requireAuth }, async (request, reply) => {
    const templates = await prisma.workoutTemplate.findMany({
      where: { userId: request.user!.id, archived: false },
      include: { exercises: { orderBy: { position: 'asc' } } },
      orderBy: { updatedAt: 'desc' },
    });
    return reply.send({ templates });
  });

  // ── POST /workout-templates ────────────────────────────────────────────
  app.post('/workout-templates', { preHandler: requireAuth }, async (request, reply) => {
    const parsed = CreateTemplateSchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return reply.code(400).send({ error: 'invalid_body', issues: parsed.error.flatten() });
    }
    const { name, description, type, exercises } = parsed.data;

    const template = await prisma.workoutTemplate.create({
      data: {
        userId: request.user!.id,
        name,
        description,
        type: type ?? 'strength',
        exercises: { create: exercises },
      },
      include: { exercises: { orderBy: { position: 'asc' } } },
    });

    return reply.code(201).send({ template });
  });

  // ── PATCH /workout-templates/:id ───────────────────────────────────────
  app.patch<{ Params: { id: string } }>(
    '/workout-templates/:id',
    { preHandler: requireAuth },
    async (request, reply) => {
      const parsed = UpdateTemplateSchema.safeParse(request.body ?? {});
      if (!parsed.success) {
        return reply.code(400).send({ error: 'invalid_body', issues: parsed.error.flatten() });
      }

      const existing = await prisma.workoutTemplate.findFirst({
        where: { id: request.params.id, userId: request.user!.id },
      });
      if (!existing) return reply.code(404).send({ error: 'template_not_found' });

      const { exercises, ...rest } = parsed.data;

      const template = await prisma.workoutTemplate.update({
        where: { id: existing.id },
        data: {
          ...rest,
          exercises: exercises
            ? { deleteMany: {}, create: exercises }
            : undefined,
        },
        include: { exercises: { orderBy: { position: 'asc' } } },
      });

      return reply.send({ template });
    },
  );

  // ── POST /workout-templates/:id/duplicate ──────────────────────────────
  app.post<{ Params: { id: string } }>(
    '/workout-templates/:id/duplicate',
    { preHandler: requireAuth },
    async (request, reply) => {
      const source = await prisma.workoutTemplate.findFirst({
        where: { id: request.params.id, userId: request.user!.id },
        include: { exercises: { orderBy: { position: 'asc' } } },
      });
      if (!source) return reply.code(404).send({ error: 'template_not_found' });

      const template = await prisma.workoutTemplate.create({
        data: {
          userId: request.user!.id,
          name: `${source.name} (copy)`,
          description: source.description,
          type: source.type,
          exercises: {
            create: source.exercises.map(({ id: _id, templateId: _t, ...rest }) => rest),
          },
        },
        include: { exercises: { orderBy: { position: 'asc' } } },
      });
      return reply.code(201).send({ template });
    },
  );

  // ── DELETE /workout-templates/:id ──────────────────────────────────────
  app.delete<{ Params: { id: string } }>(
    '/workout-templates/:id',
    { preHandler: requireAuth },
    async (request, reply) => {
      const existing = await prisma.workoutTemplate.findFirst({
        where: { id: request.params.id, userId: request.user!.id },
      });
      if (!existing) return reply.code(404).send({ error: 'template_not_found' });

      await prisma.workoutTemplate.delete({ where: { id: existing.id } });
      return reply.code(204).send();
    },
  );
}
