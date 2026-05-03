// GET /home — today's snapshot used by HomeScreen.
// Aggregates: vitality (today's DailyScore + streak), today's workout, nutrition.

import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../lib/auth.js';
import { prisma } from '../lib/prisma.js';
import { dateAtMidnightForUser } from '../lib/dailyScore.js';

export async function homeRoutes(app: FastifyInstance) {
  app.get('/home', { preHandler: requireAuth }, async (request, reply) => {
    const userId = request.user!.id;
    const today = await dateAtMidnightForUser(userId);
    const dayStart = new Date(today.getTime());

    const [user, vitalityState, dailyScore, workout] = await Promise.all([
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
      prisma.workoutLog.findFirst({
        where: { userId, startedAt: { gte: dayStart } },
        orderBy: { startedAt: 'desc' },
      }),
    ]);

    if (!user) return reply.code(404).send({ error: 'user_not_found' });

    return reply.send({
      vitality: {
        score: dailyScore?.totalScore ?? 0,
        // Rolling 7-day stage drives the home tree (WF-020). The per-day
        // dailyScore.treeState is the Calendar dot snapshot — different read.
        treeState: vitalityState?.treeStage ?? dailyScore?.treeState ?? 'sprout',
        treeHealth: vitalityState?.treeHealth ?? 0,
        streak: vitalityState?.streak ?? 0,
        longestStreak: vitalityState?.longestStreak ?? 0,
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
