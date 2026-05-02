-- Align dev DB with current schema.prisma. Forward-only migration; renames
-- preserve any existing dev data. After applying, `prisma migrate status`
-- should be clean and `/me` will succeed end-to-end.

-- ── users ─────────────────────────────────────────────────────────────────

ALTER TABLE "users" RENAME COLUMN "photoUrl" TO "avatarUrl";
ALTER TABLE "users" RENAME COLUMN "hydrationTargetMl" TO "waterTargetMl";
ALTER TABLE "users" DROP COLUMN "timezone";

ALTER TABLE "users" ADD COLUMN "username" TEXT;
ALTER TABLE "users" ADD COLUMN "goals" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "users" ADD COLUMN "experienceLevel" TEXT;
ALTER TABLE "users" ADD COLUMN "equipment" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "users" ADD COLUMN "injuries" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "users" ADD COLUMN "bodyWeight" DOUBLE PRECISION;
ALTER TABLE "users" ADD COLUMN "treeType" TEXT NOT NULL DEFAULT 'oak';
ALTER TABLE "users" ADD COLUMN "privacyAcceptedAt" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN "termsAcceptedAt" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN "aiTrainingOptOut" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN "deletionDueAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- ── daily_scores ──────────────────────────────────────────────────────────

ALTER TABLE "daily_scores" ADD COLUMN "isFreezeDay" BOOLEAN NOT NULL DEFAULT false;

-- ── vitality_states ───────────────────────────────────────────────────────

CREATE TABLE "vitality_states" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "treeHealth" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "treeStage" "TreeState" NOT NULL DEFAULT 'sprout',
    "lastActiveDate" TIMESTAMP(3),
    "freezeTokens" INTEGER NOT NULL DEFAULT 0,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vitality_states_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "vitality_states_userId_key" ON "vitality_states"("userId");

ALTER TABLE "vitality_states" ADD CONSTRAINT "vitality_states_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── simple_nutrition_logs ─────────────────────────────────────────────────

CREATE TABLE "simple_nutrition_logs" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "date" DATE NOT NULL,
    "proteinG" INTEGER NOT NULL DEFAULT 0,
    "waterMl" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "simple_nutrition_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "simple_nutrition_logs_userId_date_key" ON "simple_nutrition_logs"("userId", "date");

ALTER TABLE "simple_nutrition_logs" ADD CONSTRAINT "simple_nutrition_logs_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── user_memories ─────────────────────────────────────────────────────────

CREATE TABLE "user_memories" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "coachingSummary" TEXT,
    "keyInsights" JSONB NOT NULL DEFAULT '[]',
    "communicationStyle" TEXT,
    "recurringStruggles" JSONB NOT NULL DEFAULT '[]',
    "breakthroughs" JSONB NOT NULL DEFAULT '[]',
    "sessionRpeHistory" JSONB NOT NULL DEFAULT '[]',
    "journalInsights" JSONB NOT NULL DEFAULT '[]',
    "trainingAdherence" DOUBLE PRECISION,
    "avgSessionRpe" DOUBLE PRECISION,
    "rpeTrend" TEXT,
    "volumeTrend" TEXT,
    "prVelocity" TEXT,
    "nutritionConsistency" DOUBLE PRECISION,
    "hydrationConsistency" DOUBLE PRECISION,
    "preferredSessionMins" INTEGER,
    "peakTrainingDays" JSONB NOT NULL DEFAULT '[]',
    "fatigueSignals" JSONB NOT NULL DEFAULT '[]',
    "injuryHistory" JSONB NOT NULL DEFAULT '[]',
    "sentimentTrend" TEXT,
    "motivationScore" INTEGER,
    "sleepSignals" JSONB NOT NULL DEFAULT '[]',
    "personalityType" TEXT,
    "responseToVolume" TEXT,
    "responseToIntensity" TEXT,
    "totalConversations" INTEGER NOT NULL DEFAULT 0,
    "lastConversationAt" TIMESTAMP(3),
    "lastActiveAt" TIMESTAMP(3),
    "aiEngagementLevel" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_memories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_memories_userId_key" ON "user_memories"("userId");

ALTER TABLE "user_memories" ADD CONSTRAINT "user_memories_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── badges + user_badges ──────────────────────────────────────────────────

CREATE TABLE "badges" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'personal',
    "opensAt" TIMESTAMP(3),
    "closesAt" TIMESTAMP(3),
    "squadId" TEXT,
    "isRelational" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "badges_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "badges_key_key" ON "badges"("key");

CREATE TABLE "user_badges" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "badgeId" UUID NOT NULL,
    "awardedAt" TIMESTAMP(3) NOT NULL,
    "squadId" TEXT,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "user_badges_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "user_badges_userId_idx" ON "user_badges"("userId");
CREATE UNIQUE INDEX "user_badges_userId_badgeId_key" ON "user_badges"("userId", "badgeId");

ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_badgeId_fkey"
    FOREIGN KEY ("badgeId") REFERENCES "badges"("id") ON DELETE CASCADE ON UPDATE CASCADE;
