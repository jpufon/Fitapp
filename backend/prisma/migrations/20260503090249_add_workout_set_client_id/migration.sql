-- Add `clientId` to workout_sets for offline-queue idempotency.
-- Mobile mints a UUID per set tap; retries collapse onto the same row.

-- 1. Add column with a backfill default so the existing 4 rows get unique UUIDs.
ALTER TABLE "workout_sets"
  ADD COLUMN "clientId" UUID NOT NULL DEFAULT gen_random_uuid();

-- 2. Drop the default — new rows must supply clientId from the client.
ALTER TABLE "workout_sets"
  ALTER COLUMN "clientId" DROP DEFAULT;

-- 3. Enforce uniqueness per workout. Two sets in the same workout cannot share
-- a clientId, which is what makes the offline queue replay idempotent.
CREATE UNIQUE INDEX "workout_sets_workoutLogId_clientId_key"
  ON "workout_sets"("workoutLogId", "clientId");
