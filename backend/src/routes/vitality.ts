import type { FastifyInstance } from 'fastify';
import { RecomputeVitalitySchema, UseFreezeSchema } from 'walifit-shared';
import { requireAuth } from '../lib/auth.js';
import { prisma } from '../lib/prisma.js';
import { upsertDailyScore, dateAtMidnightForUser } from '../lib/dailyScore.js';
import { persistStreak, currentDayKeyWithGrace, dayKeyToDbDate } from '../lib/streakEngine.js';
import { rateLimit } from '../lib/rateLimit.js';

const writeVitality = rateLimit('write:vitality', 30, 60);

export async function vitalityRoutes(app: FastifyInstance) {
  // ── POST /vitality/recompute ───────────────────────────────────────────
  app.post('/vitality/recompute', { preHandler: [requireAuth, writeVitality] }, async (request, reply) => {
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

  // ── POST /vitality/freeze — burn one freeze token to protect a day ─────
  // Idempotent: if the date is already a freeze day, no token is burned.
  // Past + today only — future dates are rejected.
  app.post('/vitality/freeze', { preHandler: [requireAuth, writeVitality] }, async (request, reply) => {
    const parsed = UseFreezeSchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return reply.code(400).send({ error: 'invalid_body', issues: parsed.error.flatten() });
    }

    const userId = request.user!.id;
    const date = await dateAtMidnightForUser(userId, parsed.data.date);
    const todayDb = await dateAtMidnightForUser(userId);
    if (date.getTime() > todayDb.getTime()) {
      return reply.code(400).send({ error: 'cannot_freeze_future' });
    }

    // Make sure a DailyScore row exists so we can flip isFreezeDay on it.
    await upsertDailyScore(userId, date, {});

    const result = await prisma.$transaction(async (tx) => {
      const score = await tx.dailyScore.findUnique({
        where: { userId_date: { userId, date } },
        select: { isFreezeDay: true },
      });
      if (score?.isFreezeDay) {
        // Already protected — no-op (idempotent replay).
        const state = await tx.vitalityState.findUnique({
          where: { userId },
          select: { freezeTokens: true },
        });
        return { burned: false, freezeTokens: state?.freezeTokens ?? 0 };
      }

      // Atomic conditional decrement — guards against parallel freezes draining
      // the wallet below zero. If count === 0 the user has no tokens.
      const decResult = await tx.vitalityState.updateMany({
        where: { userId, freezeTokens: { gt: 0 } },
        data: { freezeTokens: { decrement: 1 } },
      });
      if (decResult.count === 0) {
        return { burned: false, freezeTokens: 0, error: 'no_freeze_tokens' as const };
      }

      await tx.dailyScore.update({
        where: { userId_date: { userId, date } },
        data: { isFreezeDay: true },
      });
      const updated = await tx.vitalityState.findUnique({
        where: { userId },
        select: { freezeTokens: true },
      });
      return { burned: true, freezeTokens: updated?.freezeTokens ?? 0 };
    });

    if ('error' in result && result.error === 'no_freeze_tokens') {
      return reply.code(409).send({ error: 'no_freeze_tokens' });
    }

    const streakResult = await persistStreak(userId);

    return reply.send({
      burned: result.burned,
      streak: streakResult.streak,
      longestStreak: streakResult.longestStreak,
      freezeTokens: streakResult.freezeTokens,
    });
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
