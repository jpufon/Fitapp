import type { FastifyInstance } from 'fastify';
import { LogNutritionSchema } from 'walifit-shared';
import { requireAuth } from '../lib/auth.js';
import { upsertDailyScore, dateAtMidnight } from '../lib/dailyScore.js';

export async function nutritionRoutes(app: FastifyInstance) {
  // ── POST /nutrition/simple/:date — set today's protein / hydration / steps ─
  // :date is YYYY-MM-DD. Server recomputes DailyScore atomically.
  app.post<{ Params: { date: string } }>(
    '/nutrition/simple/:date',
    { preHandler: requireAuth },
    async (request, reply) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(request.params.date)) {
        return reply.code(400).send({ error: 'invalid_date', expected: 'YYYY-MM-DD' });
      }

      const parsed = LogNutritionSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: 'invalid_body', issues: parsed.error.flatten() });
      }

      const dailyScore = await upsertDailyScore(
        request.user!.id,
        dateAtMidnight(request.params.date),
        parsed.data,
      );

      return reply.send({ dailyScore });
    },
  );
}
