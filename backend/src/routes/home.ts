// GET /home — today's snapshot used by HomeScreen.
// Aggregates: vitality (today's DailyScore + streak), today's workout, nutrition.

import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../lib/auth.js';
import { prisma } from '../lib/prisma.js';
import { dateAtMidnight } from '../lib/dailyScore.js';

export async function homeRoutes(app: FastifyInstance) {
  app.get('/home', { preHandler: requireAuth }, async (request, reply) => {
    const userId = request.user!.id;
    const today = dateAtMidnight();
    const dayStart = new Date(today.getTime());

    const [user, vitalityState, dailyScore, recent, workout] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          stepsGoal: true,
          proteinTargetG: true,
          waterTargetMl: true,
          unitSystem: true,
        },
      }),
      prisma.vitalityState.findUnique({ where: { userId } }),
      prisma.dailyScore.findUnique({
        where: { userId_date: { userId, date: today } },
      }),
      prisma.dailyScore.findMany({
        where: { userId, date: { lte: today } },
        orderBy: { date: 'desc' },
        take: 365,
      }),
      prisma.workoutLog.findFirst({
        where: { userId, startedAt: { gte: dayStart } },
        orderBy: { startedAt: 'desc' },
      }),
    ]);

    if (!user) return reply.code(404).send({ error: 'user_not_found' });

    let streak = 0;
    let cursor = today.getTime();
    const oneDayMs = 24 * 60 * 60 * 1000;
    for (const row of recent) {
      if (row.date.getTime() !== cursor) break;
      if (row.totalScore < 0.5) break;
      streak += 1;
      cursor -= oneDayMs;
    }

    return reply.send({
      vitality: {
        score: dailyScore?.totalScore ?? 0,
        treeState: dailyScore?.treeState ?? vitalityState?.treeStage ?? 'sprout',
        streak: vitalityState?.streak ?? streak,
        longestStreak: vitalityState?.longestStreak ?? streak,
        freezeTokens: vitalityState?.freezeTokens ?? 0,
      },
      pillars: {
        steps: {
          current: dailyScore?.stepsCount ?? 0,
          target: dailyScore?.stepsGoal ?? user.stepsGoal,
          progress: dailyScore?.stepsScore ?? 0,
        },
        protein: {
          current: dailyScore?.proteinG ?? 0,
          target: dailyScore?.proteinTargetG ?? user.proteinTargetG,
          progress: dailyScore?.proteinScore ?? 0,
        },
        hydration: {
          current: dailyScore?.waterMl ?? 0,
          target: dailyScore?.waterTargetMl ?? user.waterTargetMl,
          progress: dailyScore?.waterScore ?? 0,
        },
      },
      workout,
      unitSystem: user.unitSystem,
    });
  });
}
