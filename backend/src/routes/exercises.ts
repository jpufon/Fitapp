// GET /exercises — read-only catalogue. Mobile primes MMKV from this on first
// launch. Prefer GET /exercises/catalog first: compare catalogVersion to skip
// full re-download when nothing changed.
//
// GET /exercises/catalog — cheap { total, catalogVersion } for sync gating.
//
// Search / paging:
//   ?q= ?category= ?muscle= ?equipment=  (same as before)
//   ?limit=     1..3000 (default 1000)
//   ?offset=    0..100000 (pagination; hasMore = items.length === limit)
//   ?updatedAfter= ISO8601 — only rows updated strictly after this instant
//     (for incremental sync; combine with offset if the delta set is large)

import type { FastifyInstance } from 'fastify';
import type { Prisma } from '@prisma/client';
import { z } from 'zod';
import { requireAuth } from '../lib/auth.js';
import { prisma } from '../lib/prisma.js';

const MAX_LIMIT = 3000;
const MAX_OFFSET = 100_000;

const QuerySchema = z.object({
  q: z.string().trim().min(1).max(120).optional(),
  category: z.string().trim().min(1).max(40).optional(),
  muscle: z.string().trim().min(1).max(40).optional(),
  equipment: z.string().trim().min(1).max(40).optional(),
  limit: z.coerce.number().int().min(1).max(MAX_LIMIT).optional(),
  offset: z.coerce.number().int().min(0).max(MAX_OFFSET).optional(),
  updatedAfter: z.string().datetime().optional(),
});

export async function exerciseRoutes(app: FastifyInstance) {
  app.get('/exercises/catalog', { preHandler: requireAuth }, async (_request, reply) => {
    const [total, agg] = await Promise.all([
      prisma.exercise.count(),
      prisma.exercise.aggregate({ _max: { updatedAt: true } }),
    ]);
    const catalogVersion = agg._max.updatedAt?.toISOString() ?? new Date(0).toISOString();
    return reply.send({ total, catalogVersion });
  });

  app.get('/exercises', { preHandler: requireAuth }, async (request, reply) => {
    const parsed = QuerySchema.safeParse(request.query ?? {});
    if (!parsed.success) {
      return reply.code(400).send({ error: 'invalid_query', issues: parsed.error.flatten() });
    }
    const { q, category, muscle, equipment, limit = 1000, offset = 0, updatedAfter } = parsed.data;

    const conditions: Prisma.ExerciseWhereInput[] = [];
    if (q) conditions.push({ name: { contains: q, mode: 'insensitive' } });
    if (category) conditions.push({ category });
    if (muscle) {
      conditions.push({
        OR: [{ primaryMuscles: { has: muscle } }, { secondaryMuscles: { has: muscle } }],
      });
    }
    if (equipment) conditions.push({ equipment: { has: equipment } });
    if (updatedAfter) {
      const t = new Date(updatedAfter);
      if (Number.isNaN(t.getTime())) {
        return reply.code(400).send({ error: 'invalid_updated_after' });
      }
      conditions.push({ updatedAt: { gt: t } });
    }

    const where: Prisma.ExerciseWhereInput = conditions.length ? { AND: conditions } : {};

    const [items, globalAgg] = await Promise.all([
      prisma.exercise.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: offset,
        take: limit,
      }),
      prisma.exercise.aggregate({ _max: { updatedAt: true } }),
    ]);

    const catalogVersion = globalAgg._max.updatedAt?.toISOString() ?? new Date(0).toISOString();

    return reply.send({
      items,
      count: items.length,
      /** @deprecated use catalogVersion — kept for older clients */
      version: catalogVersion,
      catalogVersion,
      hasMore: items.length === limit,
      offset,
      limit,
    });
  });
}
