// GET /exercises — read-only catalogue. Mobile primes MMKV from this on first
// launch (and any time the server reports a newer version).
//
// Search semantics:
//   ?q=         substring match on name (case-insensitive)
//   ?category=  exact match
//   ?muscle=    matches primary OR secondary muscles
//   ?equipment= matches any equipment
//   ?limit=     1..2000 (default 1000 — full library fits in one round trip)

import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../lib/auth.js';
import { prisma } from '../lib/prisma.js';

const QuerySchema = z.object({
  q: z.string().trim().min(1).max(120).optional(),
  category: z.string().trim().min(1).max(40).optional(),
  muscle: z.string().trim().min(1).max(40).optional(),
  equipment: z.string().trim().min(1).max(40).optional(),
  limit: z.coerce.number().int().min(1).max(2000).optional(),
});

export async function exerciseRoutes(app: FastifyInstance) {
  app.get('/exercises', { preHandler: requireAuth }, async (request, reply) => {
    const parsed = QuerySchema.safeParse(request.query ?? {});
    if (!parsed.success) {
      return reply.code(400).send({ error: 'invalid_query', issues: parsed.error.flatten() });
    }
    const { q, category, muscle, equipment, limit = 1000 } = parsed.data;

    const where: Parameters<typeof prisma.exercise.findMany>[0] extends infer T
      ? T extends { where?: infer W }
        ? W
        : never
      : never = {};
    const conditions: Record<string, unknown>[] = [];
    if (q) conditions.push({ name: { contains: q, mode: 'insensitive' } });
    if (category) conditions.push({ category });
    if (muscle) {
      conditions.push({
        OR: [{ primaryMuscles: { has: muscle } }, { secondaryMuscles: { has: muscle } }],
      });
    }
    if (equipment) conditions.push({ equipment: { has: equipment } });

    const items = await prisma.exercise.findMany({
      where: conditions.length ? { AND: conditions } : undefined,
      orderBy: { name: 'asc' },
      take: limit,
    });

    return reply.send({
      items,
      count: items.length,
      version: items.length ? items[items.length - 1]!.updatedAt.toISOString() : null,
    });
  });
}
