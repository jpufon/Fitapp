import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../lib/auth.js';
import { prisma } from '../lib/prisma.js';

const UnitInputSchema = z.enum(['kg', 'lbs', 'metric', 'imperial']);

const ProfileUpdateSchema = z.object({
  displayName: z.string().trim().min(1).max(120).optional(),
  username: z.string().trim().min(3).max(40).regex(/^[a-zA-Z0-9_]+$/).optional(),
  avatarUrl: z.string().url().nullable().optional(),
  goals: z.array(z.string().trim().min(1)).max(10).optional(),
  experienceLevel: z.string().trim().min(1).max(40).nullable().optional(),
  trainingDays: z.array(z.number().int().min(0).max(6)).max(7).optional(),
  equipment: z.array(z.string().trim().min(1)).max(30).optional(),
  injuries: z.array(z.string().trim().min(1)).max(30).optional(),
  bodyWeight: z.number().positive().max(1000).nullable().optional(),
  treeType: z.string().trim().min(1).max(40).optional(),
  unitSystem: UnitInputSchema.optional(),
  proteinTargetG: z.number().int().min(0).max(2000).optional(),
  waterTargetMl: z.number().int().min(0).max(20000).optional(),
  stepsGoal: z.number().int().min(0).max(200000).optional(),
  restTimerDefaultS: z.number().int().min(0).max(3600).optional(),
  aiTrainingOptOut: z.boolean().optional(),
  privacyAcceptedAt: z.string().datetime().optional(),
  termsAcceptedAt: z.string().datetime().optional(),
});

const OnboardingUpdateSchema = z.object({
  goal: z.string().trim().min(1).nullable().optional(),
  goals: z.array(z.string().trim().min(1)).max(10).optional(),
  experience: z.string().trim().min(1).nullable().optional(),
  experienceLevel: z.string().trim().min(1).nullable().optional(),
  trainingDaysPerWeek: z.number().int().min(0).max(7).optional(),
  trainingDays: z.array(z.number().int().min(0).max(6)).max(7).optional(),
  equipment: z.array(z.string().trim().min(1)).max(30).optional(),
  injuries: z.array(z.string().trim().min(1)).max(30).optional(),
  injuryNotes: z.string().trim().max(1000).optional(),
  unitSystem: UnitInputSchema.optional(),
  proteinTargetG: z.number().int().min(0).max(2000).optional(),
  waterTargetMl: z.number().int().min(0).max(20000).optional(),
  onboardingStep: z.string().trim().max(80).optional(),
  onboardingComplete: z.boolean().optional(),
});

function toUnitSystem(input: z.infer<typeof UnitInputSchema> | undefined) {
  if (!input) return undefined;
  return input === 'lbs' || input === 'imperial' ? 'imperial' : 'metric';
}

function trainingDaysFromCount(count: number): number[] {
  return Array.from({ length: count }, (_, index) => index + 1).filter((day) => day <= 6);
}

function dateFromIso(value: string | undefined): Date | undefined {
  return value ? new Date(value) : undefined;
}

export async function meRoutes(app: FastifyInstance) {
  app.get('/me', { preHandler: requireAuth }, async (request, reply) => {
    const auth = request.user!;

    // Upsert User + ensure VitalityState + UserMemory exist (V1.5 readiness).
    // VitalityState is 1:1 with User and is required for streak/freeze.
    // UserMemory ships empty in V1; populated by V1.5 BullMQ jobs.
    const user = await prisma.user.upsert({
      where: { id: auth.id },
      update: { email: auth.email },
      create: {
        id: auth.id,
        email: auth.email,
        vitalityState: { create: {} },
        userMemory: { create: {} },
      },
      include: { vitalityState: true },
    });

    // Backfill for users created before VitalityState/UserMemory existed.
    if (!user.vitalityState) {
      await prisma.vitalityState.create({ data: { userId: user.id } });
    }
    await prisma.userMemory
      .upsert({ where: { userId: user.id }, update: {}, create: { userId: user.id } });

    return reply.send({ user });
  });

  app.patch('/users/me', { preHandler: requireAuth }, async (request, reply) => {
    const parsed = ProfileUpdateSchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return reply.code(400).send({ error: 'invalid_body', issues: parsed.error.flatten() });
    }

    const input = parsed.data;
    const user = await prisma.user.update({
      where: { id: request.user!.id },
      data: {
        displayName: input.displayName,
        username: input.username,
        avatarUrl: input.avatarUrl,
        goals: input.goals,
        experienceLevel: input.experienceLevel,
        trainingDays: input.trainingDays,
        equipment: input.equipment,
        injuries: input.injuries,
        bodyWeight: input.bodyWeight,
        treeType: input.treeType,
        unitSystem: toUnitSystem(input.unitSystem),
        proteinTargetG: input.proteinTargetG,
        waterTargetMl: input.waterTargetMl,
        stepsGoal: input.stepsGoal,
        restTimerDefaultS: input.restTimerDefaultS,
        aiTrainingOptOut: input.aiTrainingOptOut,
        privacyAcceptedAt: dateFromIso(input.privacyAcceptedAt),
        termsAcceptedAt: dateFromIso(input.termsAcceptedAt),
      },
    });

    return reply.send({ user });
  });

  app.patch('/users/me/onboarding', { preHandler: requireAuth }, async (request, reply) => {
    const parsed = OnboardingUpdateSchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return reply.code(400).send({ error: 'invalid_body', issues: parsed.error.flatten() });
    }

    const input = parsed.data;
    const goal = input.goal ?? undefined;
    const goals = input.goals ?? (goal ? [goal] : undefined);
    const trainingDays = input.trainingDays ??
      (input.trainingDaysPerWeek != null ? trainingDaysFromCount(input.trainingDaysPerWeek) : undefined);
    const injuryNotes = input.injuryNotes ? [`notes:${input.injuryNotes}`] : [];

    const user = await prisma.user.update({
      where: { id: request.user!.id },
      data: {
        goals,
        experienceLevel: input.experienceLevel ?? input.experience ?? undefined,
        trainingDays,
        equipment: input.equipment,
        injuries: input.injuries ? [...input.injuries, ...injuryNotes] : undefined,
        unitSystem: toUnitSystem(input.unitSystem),
        proteinTargetG: input.proteinTargetG,
        waterTargetMl: input.waterTargetMl,
        onboardingStep: input.onboardingStep,
        onboardingComplete: input.onboardingComplete,
      },
    });

    return reply.send({ user });
  });

  app.get('/users/me/stats', { preHandler: requireAuth }, async (request, reply) => {
    const userId = request.user!.id;
    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

    const [totalWorkouts, vitality, prsThisMonth] = await Promise.all([
      prisma.workoutLog.count({ where: { userId, finishedAt: { not: null } } }),
      prisma.vitalityState.findUnique({ where: { userId }, select: { streak: true } }),
      prisma.pRRecord.count({ where: { userId, achievedAt: { gte: monthStart } } }),
    ]);

    return reply.send({
      totalWorkouts,
      currentStreak: vitality?.streak ?? 0,
      prsThisMonth,
    });
  });

  app.get('/users/me/export', { preHandler: requireAuth }, async (request, reply) => {
    const user = await prisma.user.findUnique({
      where: { id: request.user!.id },
      include: {
        vitalityState: true,
        userMemory: true,
        workouts: { include: { sets: true, prs: true }, orderBy: { startedAt: 'desc' } },
        dailyScores: { orderBy: { date: 'desc' } },
        prs: { orderBy: { achievedAt: 'desc' } },
        nutritionLogs: { orderBy: { date: 'desc' } },
        userBadges: { include: { badge: true }, orderBy: { awardedAt: 'desc' } },
      },
    });

    if (!user) {
      return reply.code(404).send({ error: 'user_not_found' });
    }

    return reply
      .header('Content-Disposition', `attachment; filename="walifit-export-${user.id}.json"`)
      .send({ exportedAt: new Date().toISOString(), user });
  });

  app.delete('/users/me', { preHandler: requireAuth }, async (request, reply) => {
    const now = new Date();
    const deletionDueAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const user = await prisma.user.update({
      where: { id: request.user!.id },
      data: {
        deletedAt: now,
        deletionDueAt,
      },
      select: {
        id: true,
        deletedAt: true,
        deletionDueAt: true,
      },
    });

    return reply.send({ user });
  });
}
