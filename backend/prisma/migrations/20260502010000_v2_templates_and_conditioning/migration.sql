-- Sprint 2 schema closeout: WorkoutTemplate + WorkoutTemplateExercise tables
-- (WF-011 builder), conditioning fields on WorkoutSet (WF-013 work-rest + rounds).

-- ── WorkoutSet: conditioning columns ───────────────────────────────────────
ALTER TABLE "workout_sets" ADD COLUMN "durationS" INTEGER;
ALTER TABLE "workout_sets" ADD COLUMN "roundNumber" INTEGER;
ALTER TABLE "workout_sets" ADD COLUMN "intervalWorkS" INTEGER;
ALTER TABLE "workout_sets" ADD COLUMN "intervalRestS" INTEGER;

-- ── WorkoutTemplate ────────────────────────────────────────────────────────
CREATE TABLE "workout_templates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "WorkoutType" NOT NULL DEFAULT 'strength',
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "workout_templates_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "workout_templates_userId_archived_idx" ON "workout_templates"("userId", "archived");

-- ── WorkoutTemplateExercise ────────────────────────────────────────────────
CREATE TABLE "workout_template_exercises" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "templateId" UUID NOT NULL,
    "exerciseName" TEXT NOT NULL,
    "exerciseId" TEXT,
    "position" INTEGER NOT NULL,
    "defaultSets" INTEGER NOT NULL DEFAULT 3,
    "defaultReps" INTEGER,
    "restS" INTEGER,
    "durationS" INTEGER,
    "rounds" INTEGER,
    "intervalWorkS" INTEGER,
    "intervalRestS" INTEGER,
    "notes" TEXT,
    CONSTRAINT "workout_template_exercises_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "workout_template_exercises_templateId_position_idx"
    ON "workout_template_exercises"("templateId", "position");

ALTER TABLE "workout_template_exercises"
    ADD CONSTRAINT "workout_template_exercises_templateId_fkey"
    FOREIGN KEY ("templateId") REFERENCES "workout_templates"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
