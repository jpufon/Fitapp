import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../lib/auth.js';
import { prisma } from '../lib/prisma.js';

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
}
