-- V1.x Arena scaffold: Squad, SquadMember, FeedItem, FeedReaction.
-- Read-only mobile clients can call /feed and /squads/mine; owners can create
-- squads and members can join via inviteCode. Reactions are one per
-- (feedItem, user, type).

-- ── squads ────────────────────────────────────────────────────────────────

CREATE TABLE "squads" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'workout',
    "ownerId" UUID NOT NULL,
    "inviteCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "squads_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "squads_inviteCode_key" ON "squads"("inviteCode");

ALTER TABLE "squads" ADD CONSTRAINT "squads_ownerId_fkey"
    FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── squad_members ─────────────────────────────────────────────────────────

CREATE TABLE "squad_members" (
    "id" UUID NOT NULL,
    "squadId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "squad_members_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "squad_members_userId_idx" ON "squad_members"("userId");
CREATE UNIQUE INDEX "squad_members_squadId_userId_key" ON "squad_members"("squadId", "userId");

ALTER TABLE "squad_members" ADD CONSTRAINT "squad_members_squadId_fkey"
    FOREIGN KEY ("squadId") REFERENCES "squads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "squad_members" ADD CONSTRAINT "squad_members_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── feed_items ────────────────────────────────────────────────────────────

CREATE TABLE "feed_items" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "squadId" UUID,
    "eventType" TEXT NOT NULL,
    "exercise" TEXT,
    "value" TEXT,
    "delta" TEXT,
    "isRun" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feed_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "feed_items_squadId_createdAt_idx" ON "feed_items"("squadId", "createdAt");
CREATE INDEX "feed_items_userId_createdAt_idx" ON "feed_items"("userId", "createdAt");

ALTER TABLE "feed_items" ADD CONSTRAINT "feed_items_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "feed_items" ADD CONSTRAINT "feed_items_squadId_fkey"
    FOREIGN KEY ("squadId") REFERENCES "squads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ── feed_reactions ────────────────────────────────────────────────────────

CREATE TABLE "feed_reactions" (
    "id" UUID NOT NULL,
    "feedItemId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'flame',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feed_reactions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "feed_reactions_userId_idx" ON "feed_reactions"("userId");
CREATE UNIQUE INDEX "feed_reactions_feedItemId_userId_type_key" ON "feed_reactions"("feedItemId", "userId", "type");

ALTER TABLE "feed_reactions" ADD CONSTRAINT "feed_reactions_feedItemId_fkey"
    FOREIGN KEY ("feedItemId") REFERENCES "feed_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "feed_reactions" ADD CONSTRAINT "feed_reactions_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
