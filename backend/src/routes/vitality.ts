import type { FastifyInstance } from 'fastify';
import { RecomputeVitalitySchema } from 'walifit-shared';
import { requireAuth } from '../lib/auth.js';
import { prisma } from '../lib/prisma.js';
import { upsertDailyScore, dateAtMidnight } from '../lib/dailyScore.js';

export async function vitalityRoutes(app: FastifyInstance) {
  // ── POST /vitality/recompute ───────────────────────────────────────────
  app.post('/vitality/recompute', { preHandler: requireAuth }, async (request, reply) => {
    const parsed = RecomputeVitalitySchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return reply.code(400).send({ error: 'invalid_body', issues: parsed.error.flatten() });
    }

    const dailyScore = await upsertDailyScore(
      request.user!.id,
      dateAtMidnight(parsed.data.date),
      { isRestDay: parsed.data.isRestDay },
    );

    return reply.send({ dailyScore });
  });

  // ── GET /vitality/current — today's score + 30-day streak ──────────────
  app.get('/vitality/current', { preHandler: requireAuth }, async (request, reply) => {
    const today = dateAtMidnight();
    const dailyScore = await prisma.dailyScore.findUnique({
      where: { userId_date: { userId: request.user!.id, date: today } },
    });

    // Streak = consecutive days backward from today with totalScore >= 0.5.
    // Naive linear scan over recent rows; fine for V1 scale.
    const recent = await prisma.dailyScore.findMany({
      where: { userId: request.user!.id, date: { lte: today } },
      orderBy: { date: 'desc' },
      take: 365,
    });

    let streak = 0;
    let cursor = today.getTime();
    const oneDayMs = 24 * 60 * 60 * 1000;
    for (const row of recent) {
      if (row.date.getTime() !== cursor) break;
      if (row.totalScore < 0.5) break;
      streak += 1;
      cursor -= oneDayMs;
    }

    return reply.send({ dailyScore, streak });
  });
}
