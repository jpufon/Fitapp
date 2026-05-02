// Arena V1.x scaffold: /feed, /squads, /leaderboards/squad.
// Surface shapes match react-native/hooks/useArenaData.ts normalizers.

import type { FastifyInstance } from 'fastify';
import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { requireAuth } from '../lib/auth.js';
import { prisma } from '../lib/prisma.js';
import { dateAtMidnight } from '../lib/dailyScore.js';

// ── Schemas ────────────────────────────────────────────────────────────────

const CreateSquadSchema = z.object({
  name: z.string().trim().min(1).max(60),
  squadType: z.enum(['hybrid', 'run_club']).optional(),
  runFocusDistance: z.enum(['1mi', '2mi', '3mi', '2K', '5K', 'all']).optional(),
});

const JoinSquadSchema = z.object({
  inviteCode: z.string().trim().min(4).max(20),
});

const ReactionBodySchema = z.object({
  type: z.string().trim().min(1).max(20).optional(),
});

const FeedQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.string().optional(),
});

const LeaderboardQuerySchema = z.object({
  squadId: z.string().uuid().optional(),
});

// ── Helpers ────────────────────────────────────────────────────────────────

function generateInviteCode(): string {
  return randomBytes(4).toString('base64url').toUpperCase().replace(/[-_]/g, '0').slice(0, 8);
}

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  const letters = parts.map((part) => part[0] ?? '').join('').toUpperCase();
  return letters || 'AT';
}

function displayNameFor(user: { displayName: string | null; username: string | null; email: string | null }): string {
  return user.displayName ?? user.username ?? user.email ?? 'Athlete';
}

function relativeTime(date: Date, now: Date = new Date()): string {
  const diffSec = Math.max(0, Math.round((now.getTime() - date.getTime()) / 1000));
  if (diffSec < 60) return 'Now';
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay === 1) return '1d ago';
  if (diffDay < 7) return `${diffDay}d ago`;
  const diffWk = Math.round(diffDay / 7);
  if (diffWk < 4) return `${diffWk}w ago`;
  return date.toISOString().slice(0, 10);
}

function decodeCursor(cursor: string | undefined): Date | null {
  if (!cursor) return null;
  const ts = Number(Buffer.from(cursor, 'base64url').toString('utf8'));
  return Number.isFinite(ts) ? new Date(ts) : null;
}

function encodeCursor(date: Date): string {
  return Buffer.from(String(date.getTime()), 'utf8').toString('base64url');
}

async function mySquadIds(userId: string): Promise<string[]> {
  const memberships = await prisma.squadMember.findMany({
    where: { userId },
    select: { squadId: true },
  });
  return memberships.map((row) => row.squadId);
}

// ── Routes ─────────────────────────────────────────────────────────────────

export async function arenaRoutes(app: FastifyInstance) {
  // ── POST /squads — create a squad, owner becomes member ─────────────────
  app.post('/squads', { preHandler: requireAuth }, async (request, reply) => {
    const parsed = CreateSquadSchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return reply.code(400).send({ error: 'invalid_body', issues: parsed.error.flatten() });
    }

    const userId = request.user!.id;
    const inviteCode = generateInviteCode();

    const squadType = parsed.data.squadType ?? 'hybrid';
    const squad = await prisma.squad.create({
      data: {
        name: parsed.data.name,
        squadType,
        runFocusDistance: squadType === 'run_club' ? parsed.data.runFocusDistance ?? 'all' : null,
        ownerId: userId,
        inviteCode,
        members: { create: { userId } },
      },
      include: { _count: { select: { members: true } } },
    });

    return reply.code(201).send({ squad });
  });

  // ── POST /squads/join — join via invite code ────────────────────────────
  app.post('/squads/join', { preHandler: requireAuth }, async (request, reply) => {
    const parsed = JoinSquadSchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return reply.code(400).send({ error: 'invalid_body', issues: parsed.error.flatten() });
    }

    const userId = request.user!.id;
    const squad = await prisma.squad.findUnique({
      where: { inviteCode: parsed.data.inviteCode.toUpperCase() },
    });
    if (!squad) return reply.code(404).send({ error: 'squad_not_found' });

    await prisma.squadMember.upsert({
      where: { squadId_userId: { squadId: squad.id, userId } },
      update: {},
      create: { squadId: squad.id, userId },
    });

    return reply.send({ squad });
  });

  // ── DELETE /squads/:id/members/me — leave squad ─────────────────────────
  app.delete<{ Params: { id: string } }>(
    '/squads/:id/members/me',
    { preHandler: requireAuth },
    async (request, reply) => {
      const userId = request.user!.id;
      await prisma.squadMember.deleteMany({
        where: { squadId: request.params.id, userId },
      });
      return reply.code(204).send();
    },
  );

  // ── GET /squads/mine — squads I belong to + computed counts ─────────────
  app.get('/squads/mine', { preHandler: requireAuth }, async (request, reply) => {
    const userId = request.user!.id;
    const today = dateAtMidnight();
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const memberships = await prisma.squadMember.findMany({
      where: { userId },
      include: {
        squad: {
          include: {
            members: {
              select: {
                userId: true,
                user: {
                  select: {
                    dailyScores: {
                      where: { date: { gte: sevenDaysAgo, lte: today } },
                      select: { date: true, totalScore: true },
                    },
                  },
                },
              },
            },
            _count: { select: { members: true } },
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    const squads = memberships.map((membership, index) => {
      const allScores: number[] = [];
      let activeToday = 0;
      const todayMs = today.getTime();

      for (const m of membership.squad.members) {
        const scores = m.user.dailyScores;
        for (const s of scores) allScores.push(s.totalScore);
        const hasToday = scores.some(
          (s) => s.date.getTime() === todayMs && s.totalScore > 0,
        );
        if (hasToday) activeToday += 1;
      }

      const forestHealth = allScores.length
        ? Math.round((allScores.reduce((sum, v) => sum + v, 0) / allScores.length) * 100)
        : 0;

      return {
        id: membership.squad.id,
        name: membership.squad.name,
        type: membership.squad.squadType === 'run_club' ? 'Run Club' : 'Workout Squad',
        members: membership.squad._count.members,
        activeToday,
        forestHealth,
        rank: index + 1,
        inviteCode: membership.squad.inviteCode,
        ownerId: membership.squad.ownerId,
      };
    });

    return reply.send({ squads });
  });

  // ── GET /leaderboards/squad?squadId= — top members by 7d score ──────────
  app.get('/leaderboards/squad', { preHandler: requireAuth }, async (request, reply) => {
    const parsed = LeaderboardQuerySchema.safeParse(request.query ?? {});
    if (!parsed.success) {
      return reply.code(400).send({ error: 'invalid_query', issues: parsed.error.flatten() });
    }

    const userId = request.user!.id;
    const today = dateAtMidnight();
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    let squadId = parsed.data.squadId;
    if (!squadId) {
      const first = await prisma.squadMember.findFirst({
        where: { userId },
        orderBy: { joinedAt: 'asc' },
        select: { squadId: true },
      });
      if (!first) return reply.send({ leaderboard: [] });
      squadId = first.squadId;
    } else {
      const membership = await prisma.squadMember.findUnique({
        where: { squadId_userId: { squadId, userId } },
      });
      if (!membership) return reply.code(403).send({ error: 'not_a_member' });
    }

    const members = await prisma.squadMember.findMany({
      where: { squadId },
      select: {
        userId: true,
        user: {
          select: {
            id: true,
            displayName: true,
            username: true,
            email: true,
            vitalityState: { select: { streak: true } },
            dailyScores: {
              where: { date: { gte: sevenDaysAgo, lte: today } },
              select: { totalScore: true },
            },
          },
        },
      },
    });

    const ranked = members
      .map((m) => {
        const score = Math.round(
          m.user.dailyScores.reduce((sum, s) => sum + s.totalScore, 0) * 100,
        );
        const name = displayNameFor(m.user);
        return {
          userId: m.user.id,
          name,
          initials: initialsFor(name),
          score,
          streak: m.user.vitalityState?.streak ?? 0,
          isYou: m.user.id === userId,
        };
      })
      .sort((a, b) => b.score - a.score)
      .map((entry, index) => ({ rank: index + 1, ...entry }));

    return reply.send({ leaderboard: ranked, squadId });
  });

  // ── GET /feed?cursor=&limit= — paginated feed (mine + my squads) ────────
  app.get('/feed', { preHandler: requireAuth }, async (request, reply) => {
    const parsed = FeedQuerySchema.safeParse(request.query ?? {});
    if (!parsed.success) {
      return reply.code(400).send({ error: 'invalid_query', issues: parsed.error.flatten() });
    }

    const userId = request.user!.id;
    const limitRaw = Number(parsed.data.limit ?? 20);
    const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(50, Math.floor(limitRaw))) : 20;
    const cursorDate = decodeCursor(parsed.data.cursor);

    const squadIds = await mySquadIds(userId);

    const rows = await prisma.feedItem.findMany({
      where: {
        AND: [
          cursorDate ? { createdAt: { lt: cursorDate } } : {},
          {
            OR: [
              { userId },
              ...(squadIds.length ? [{ squadId: { in: squadIds } }] : []),
            ],
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      include: {
        user: { select: { id: true, displayName: true, username: true, email: true } },
        _count: { select: { reactions: true } },
      },
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const now = new Date();

    const items = page.map((row) => {
      const name = displayNameFor(row.user);
      return {
        id: row.id,
        user: row.user.id === userId ? 'You' : name,
        initials: row.user.id === userId ? 'ME' : initialsFor(name),
        eventType: humanEventType(row.eventType),
        exercise: row.exercise ?? '',
        value: row.value ?? '',
        delta: row.delta,
        time: relativeTime(row.createdAt, now),
        reactions: row._count.reactions,
        isRun: row.isRun,
      };
    });

    return reply.send({
      items,
      nextCursor: hasMore ? encodeCursor(page[page.length - 1]!.createdAt) : null,
    });
  });

  // ── POST /feed/:id/reactions — idempotent reaction add ──────────────────
  app.post<{ Params: { id: string } }>(
    '/feed/:id/reactions',
    { preHandler: requireAuth },
    async (request, reply) => {
      const parsed = ReactionBodySchema.safeParse(request.body ?? {});
      if (!parsed.success) {
        return reply.code(400).send({ error: 'invalid_body', issues: parsed.error.flatten() });
      }

      const userId = request.user!.id;
      const type = parsed.data.type ?? 'flame';

      const exists = await prisma.feedItem.findUnique({
        where: { id: request.params.id },
        select: { id: true },
      });
      if (!exists) return reply.code(404).send({ error: 'feed_item_not_found' });

      await prisma.feedReaction.upsert({
        where: { feedItemId_userId_type: { feedItemId: request.params.id, userId, type } },
        update: {},
        create: { feedItemId: request.params.id, userId, type },
      });

      const reactionCount = await prisma.feedReaction.count({
        where: { feedItemId: request.params.id },
      });

      return reply.send({ feedId: request.params.id, type, reactionCount });
    },
  );

  // ── DELETE /feed/:id/reactions — toggle off (default type=flame) ────────
  app.delete<{ Params: { id: string }; Querystring: { type?: string } }>(
    '/feed/:id/reactions',
    { preHandler: requireAuth },
    async (request, reply) => {
      const userId = request.user!.id;
      const type = request.query.type ?? 'flame';

      await prisma.feedReaction.deleteMany({
        where: { feedItemId: request.params.id, userId, type },
      });

      return reply.code(204).send();
    },
  );
}

function humanEventType(eventType: string): string {
  switch (eventType) {
    case 'strength_pr':
      return 'Strength PR';
    case 'run_pr':
      return 'Run PR';
    case 'streak_milestone':
      return 'Streak Milestone';
    case 'workout_complete':
    default:
      return 'Workout Complete';
  }
}
