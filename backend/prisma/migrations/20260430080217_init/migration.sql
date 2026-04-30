-- CreateEnum
CREATE TYPE "UnitSystem" AS ENUM ('metric', 'imperial');

-- CreateEnum
CREATE TYPE "WorkoutType" AS ENUM ('strength', 'hybrid', 'conditioning', 'run', 'rest');

-- CreateEnum
CREATE TYPE "RunType" AS ENUM ('free', 'preset');

-- CreateEnum
CREATE TYPE "RunDistancePreset" AS ENUM ('one_mile', 'two_mile', 'three_mile', 'two_k', 'five_k');

-- CreateEnum
CREATE TYPE "TreeState" AS ENUM ('wilted', 'recovering', 'sprout', 'growing', 'thriving', 'full_vitality');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT,
    "displayName" TEXT,
    "photoUrl" TEXT,
    "unitSystem" "UnitSystem" NOT NULL DEFAULT 'metric',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "onboardingComplete" BOOLEAN NOT NULL DEFAULT false,
    "onboardingStep" TEXT,
    "stepsGoal" INTEGER NOT NULL DEFAULT 8000,
    "proteinTargetG" INTEGER NOT NULL DEFAULT 150,
    "hydrationTargetMl" INTEGER NOT NULL DEFAULT 2500,
    "trainingDays" INTEGER[] DEFAULT ARRAY[1, 2, 3, 4, 5]::INTEGER[],
    "restTimerDefaultS" INTEGER NOT NULL DEFAULT 120,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_logs" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" "WorkoutType" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "isFreezeDay" BOOLEAN NOT NULL DEFAULT false,
    "sessionRpe" INTEGER,
    "notes" TEXT,
    "runDistanceM" INTEGER,
    "runDurationS" INTEGER,
    "runPaceSPerKm" INTEGER,
    "runType" "RunType",
    "runDistancePreset" "RunDistancePreset",
    "runRoutePolyline" TEXT,
    "runSplitPaces" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workout_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_sets" (
    "id" UUID NOT NULL,
    "workoutLogId" UUID NOT NULL,
    "exerciseName" TEXT NOT NULL,
    "exerciseId" TEXT,
    "setNumber" INTEGER NOT NULL,
    "reps" INTEGER NOT NULL,
    "weightKg" DOUBLE PRECISION,
    "rpe" INTEGER,
    "notes" TEXT,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workout_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_scores" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "date" DATE NOT NULL,
    "stepsCount" INTEGER NOT NULL DEFAULT 0,
    "stepsGoal" INTEGER NOT NULL,
    "stepsScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "proteinG" INTEGER NOT NULL DEFAULT 0,
    "proteinTargetG" INTEGER NOT NULL,
    "proteinScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "waterMl" INTEGER NOT NULL DEFAULT 0,
    "waterTargetMl" INTEGER NOT NULL,
    "waterScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isRestDay" BOOLEAN NOT NULL DEFAULT false,
    "treeState" "TreeState" NOT NULL DEFAULT 'sprout',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pr_records" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "exerciseName" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "workoutLogId" UUID,
    "achievedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pr_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "workout_logs_userId_startedAt_idx" ON "workout_logs"("userId", "startedAt");

-- CreateIndex
CREATE INDEX "workout_logs_userId_type_idx" ON "workout_logs"("userId", "type");

-- CreateIndex
CREATE INDEX "workout_sets_workoutLogId_setNumber_idx" ON "workout_sets"("workoutLogId", "setNumber");

-- CreateIndex
CREATE INDEX "daily_scores_userId_date_idx" ON "daily_scores"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "daily_scores_userId_date_key" ON "daily_scores"("userId", "date");

-- CreateIndex
CREATE INDEX "pr_records_userId_exerciseName_achievedAt_idx" ON "pr_records"("userId", "exerciseName", "achievedAt");

-- AddForeignKey
ALTER TABLE "workout_logs" ADD CONSTRAINT "workout_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_sets" ADD CONSTRAINT "workout_sets_workoutLogId_fkey" FOREIGN KEY ("workoutLogId") REFERENCES "workout_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_scores" ADD CONSTRAINT "daily_scores_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pr_records" ADD CONSTRAINT "pr_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pr_records" ADD CONSTRAINT "pr_records_workoutLogId_fkey" FOREIGN KEY ("workoutLogId") REFERENCES "workout_logs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
