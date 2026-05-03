import type { FastifyInstance } from 'fastify';
import { LogNutritionSchema } from 'walifit-shared';
import { requireAuth } from '../lib/auth.js';
import { dateAtMidnightForUser } from '../lib/dailyScore.js';
import { applyNutritionDelta } from '../lib/nutritionLedger.js';
import { persistStreak } from '../lib/streakEngine.js';

export async function nutritionRoutes(app: FastifyInstance) {
  // ── POST /nutrition/simple/:date — additive protein/water + absolute steps ─
  // :date is YYYY-MM-DD. Body: { clientId, proteinDeltaG?, waterDeltaMl?, stepsCount? }.
  // The clientId is the mobile-minted idempotency key — replays from the
  // offline sync queue collapse on the (userId, clientId) unique index.
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

      const userId = request.user!.id;
      const dbDate = await dateAtMidnightForUser(userId, request.params.date);

      const { dailyScore, isReplay } = await applyNutritionDelta(
        userId,
        dbDate,
        {
          proteinDeltaG: parsed.data.proteinDeltaG,
          waterDeltaMl: parsed.data.waterDeltaMl,
          stepsCount: parsed.data.stepsCount,
        },
        parsed.data.clientId,
      );

      // Streak walk-back depends on totalScore, so refresh it on every write.
      const streakResult = await persistStreak(userId);

      return reply.send({
        dailyScore,
        streak: streakResult.streak,
        longestStreak: streakResult.longestStreak,
        freezeTokens: streakResult.freezeTokens,
        isReplay,
      });
    },
  );
}
