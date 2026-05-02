-- Sprint 1 closeout: finalize Squad fields per WF-002 + add Exercise reference table.
-- Squad: rename `type` -> `squadType`, remap values workout->hybrid / run->run_club,
-- add `runFocusDistance` (run_club only) and `maxMembers` cap (V1 = 30).
-- Exercise: catalogue seeded from wger; one source of truth for V1 library + Sprint 4 RAG.

-- ── Squad finalize ─────────────────────────────────────────────────────────
ALTER TABLE "squads" ADD COLUMN "squadType" TEXT NOT NULL DEFAULT 'hybrid';

UPDATE "squads"
SET "squadType" = CASE "type" WHEN 'run' THEN 'run_club' ELSE 'hybrid' END;

ALTER TABLE "squads" DROP COLUMN "type";
ALTER TABLE "squads" ADD COLUMN "runFocusDistance" TEXT;
ALTER TABLE "squads" ADD COLUMN "maxMembers" INTEGER NOT NULL DEFAULT 30;

-- ── Exercise catalogue ─────────────────────────────────────────────────────
CREATE TABLE "exercises" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "wgerId" INTEGER,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "primaryMuscles" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "secondaryMuscles" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "equipment" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "instructions" TEXT,
    "movementType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "exercises_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "exercises_wgerId_key" ON "exercises"("wgerId");
CREATE INDEX "exercises_category_idx" ON "exercises"("category");
CREATE INDEX "exercises_name_idx" ON "exercises"("name");
