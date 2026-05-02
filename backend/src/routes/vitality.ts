import type { FastifyInstance } from 'fastify';
import { RecomputeVitalitySchema } from 'walifit-shared';
import { requireAuth } from '../lib/auth.js';
import { prisma } from '../lib/prisma.js';
import { upsertDailyScore, dateAtMidnightForUser } from '../lib/dailyScore.js';
import { persistStreak, currentDayKeyWithGrace, dayKeyToDbDate } from '../lib/streakEngine.js';

export async function vitalityRoutes(app: FastifyInstance) {
  // ── POST /vitality/recompute ───────────────────────────────────────────
  app.post('/vitality/recompute', { preHandler: requireAuth }, async (request, reply) => {
    const parsed = RecomputeVitalitySchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return reply.code(400).send({ error: 'invalid_body', issues: parsed.error.flatten() });
    }

    const userId = request.user!.id;
    const dailyScore = await upsertDailyScore(
      userId,
      await dateAtMidnightForUser(userId, parsed.data.date),
      { isRestDay: parsed.data.isRestDay },
    );

    const streakResult = await persistStreak(userId);

    return reply.send({ dailyScore, streak: streakResult.streak });
  });

  // ── GET /vitality/current — today's score + streak ─────────────────────
  app.get('/vitality/current', { preHandler: requireAuth }, async (request, reply) => {
    const userId = request.user!.id;

    const vitalityState = await prisma.vitalityState.findUnique({
      where: { userId },
      select: { timezone: true, freezeTokens: true, longestStreak: true },
    });
    const tz = vitalityState?.timezone || 'UTC';
    const todayKey = currentDayKeyWithGrace(tz);

    const dailyScore = await prisma.dailyScore.findUnique({
      where: { userId_date: { userId, date: dayKeyToDbDate(todayKey) } },
    });

    const streakResult = await persistStreak(userId);

    return reply.send({
      dailyScore,
      streak: streakResult.streak,
      longestStreak: streakResult.longestStreak,
      freezeTokens: streakResult.freezeTokens,
    });
  });
}
